import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb, listAllCompanies, listAllInvestors } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { companies, investors, introRequests, matches, connections, connectionProfiles, connectionCompanyLinks } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import {
  normalizeCompanyRecord,
  normalizeInvestorRecord,
  getCompanyDedupKeys,
  getInvestorDedupKeys,
} from "./_core/importUtils";
import { generateMatchesForCompany, generateMatchesForInvestor } from "./_core/matchingExecutor";
import { getCsvLines, splitCsvLine } from "./_core/csvParser";
import path from "path";
import { parseLinkedInConnections, enrichConnection, enrichConnectionsFromCsv } from "./_core/connections/enrichment";
import { loadConnectionProfiles, saveConnectionProfiles, upsertProfile } from "./_core/connections/store";
import { EnrichedConnectionProfile } from "./_core/connections/types";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { loadMatchingConfig, saveMatchingConfig, DEFAULT_MATCHING_CONFIG, type MatchingConfig } from "./_core/matchingConfig";

const LINKEDIN_EXPORT_PATH = path.resolve(process.cwd(), "../Connections.csv");

const normalizeDataUrl = (payload: string, mimeType: string) => {
  const cleaned = payload.startsWith("data:")
    ? payload.split(",").slice(1).join(",")
    : payload;
  return `data:${mimeType};base64,${cleaned}`;
};

const formatMoneyShort = (amount?: number | null) => {
  if (!amount || amount <= 0) return null;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

function buildIntroEmails(company?: any, investor?: any, requesterName?: string | null) {
  const companyName = company?.name || "the company";
  const founderName = company?.founderName || companyName;
  const investorName = investor?.name || "your investor";
  const investorFirm = investor?.firm ? ` at ${investor.firm}` : "";
  const fundingLine = company?.fundingTarget
    ? `Raising ${formatMoneyShort(company.fundingTarget)}`
    : "Currently raising";
  const tractionLine = company?.revenue ? `Revenue: ${formatMoneyShort(company.revenue)}` : "";
  const sectorLine = company?.sector ? `Sector: ${company.sector}` : "";
  const stageLine = company?.stage ? `Stage: ${company.stage}` : "";

  const founderSubject = `Intro to ${investorName}${investorFirm}`;
  const investorSubject = `${companyName} → ${investorName}${investorFirm ? ` (${investorFirm.trim()})` : ""}`;

  const introLine = requesterName
    ? `${requesterName} requested this warm introduction.`
    : "Requesting a warm introduction.";

  const founderBody = [
    `Hi ${founderName.split(" ")[0] || "there"},`,
    "",
    `${introLine} I'd like to connect you with ${investorName}${investorFirm} for your raise.`,
    `${fundingLine}${stageLine ? ` • ${stageLine}` : ""}${sectorLine ? ` • ${sectorLine}` : ""}`,
    company?.description ? `Summary: ${company.description}` : "",
    "",
    "If you approve, I'll send a double opt-in note to the investor with your deck and highlights.",
    "",
    "Thanks!",
    requesterName || "Sprintly AI",
  ]
    .filter(Boolean)
    .join("\n");

  const investorBody = [
    `Hi ${investorName.split(" ")[0] || "there"},`,
    "",
    `${introLine} ${companyName} looks like a fit for your thesis.`,
    `${fundingLine}${stageLine ? ` • ${stageLine}` : ""}${sectorLine ? ` • ${sectorLine}` : ""}`,
    tractionLine,
    company?.description ? `Summary: ${company.description}` : "",
    company?.websiteUrl ? `Site: ${company.websiteUrl}` : "",
    company?.pitchDeckUrl ? `Deck: ${company.pitchDeckUrl}` : "",
    "",
    "Want an intro? If so, I'll connect you both immediately.",
    "",
    "Best,",
    requesterName || "Sprintly AI",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    founder: { subject: founderSubject, body: founderBody },
    investor: { subject: investorSubject, body: investorBody },
  };
}

let ensuredConnectionTables = false;
async function ensureConnectionTables(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db || ensuredConnectionTables) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS \`connectionProfiles\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`profileId\` varchar(64) NOT NULL UNIQUE,
      \`fullName\` varchar(255),
      \`role\` enum('investor','founder','operator') NOT NULL DEFAULT 'operator',
      \`email\` varchar(320),
      \`linkedinUrl\` varchar(500),
      \`accuracy\` int DEFAULT 0,
      \`confidence\` int DEFAULT 0,
      \`rawSource\` text,
      \`enrichedProfile\` text,
      \`scrapedSummary\` text,
      \`scrapedFacts\` text,
      \`investorId\` int,
      \`primaryCompanyId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS \`connectionCompanyLinks\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`profileId\` varchar(64) NOT NULL,
      \`companyId\` int NOT NULL,
      \`relationship\` varchar(50) DEFAULT 'founder',
      \`confidence\` int DEFAULT 70,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  ensuredConnectionTables = true;
}

async function upsertConnectionProfileRow(
  db: Awaited<ReturnType<typeof getDb>>,
  profile: EnrichedConnectionProfile,
  primaryCompanyId?: number | null,
) {
  if (!db) return;
  await ensureConnectionTables(db);

  await db
    .insert(connectionProfiles)
    .values({
      profileId: profile.id,
      fullName: profile.fullName,
      role: profile.role,
      email: profile.email,
      linkedinUrl: profile.linkedinUrl,
      accuracy: profile.accuracy,
      confidence: profile.confidence,
      rawSource: JSON.stringify(profile.source || {}),
      enrichedProfile: JSON.stringify(profile),
      scrapedSummary: profile.scrapedSummary,
      scrapedFacts: profile.scrapedFacts ? JSON.stringify(profile.scrapedFacts) : null,
      investorId: profile.investorId ?? null,
      primaryCompanyId: primaryCompanyId ?? profile.companyId ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        fullName: profile.fullName,
        role: profile.role,
        email: profile.email,
        linkedinUrl: profile.linkedinUrl,
        accuracy: profile.accuracy,
        confidence: profile.confidence,
        rawSource: JSON.stringify(profile.source || {}),
        enrichedProfile: JSON.stringify(profile),
        scrapedSummary: profile.scrapedSummary,
        scrapedFacts: profile.scrapedFacts ? JSON.stringify(profile.scrapedFacts) : null,
        investorId: profile.investorId ?? null,
        primaryCompanyId: primaryCompanyId ?? profile.companyId ?? null,
        updatedAt: new Date(),
      },
    });
}

async function persistCompanyLinks(
  db: Awaited<ReturnType<typeof getDb>>,
  profileId: string,
  companyIds: number[],
  relationship: string = "founder",
) {
  if (!db) return;
  await ensureConnectionTables(db);
  await db.delete(connectionCompanyLinks).where(eq(connectionCompanyLinks.profileId, profileId));
  if (!companyIds.length) return;
  await db.insert(connectionCompanyLinks).values(
    companyIds.map(companyId => ({
      profileId,
      companyId,
      relationship,
      confidence: 80,
    })),
  );
}

async function loadConnectionProfilesFromDb(): Promise<EnrichedConnectionProfile[] | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await ensureConnectionTables(db);

    const linkRows = await db.select().from(connectionCompanyLinks);
    const linkMap = new Map<string, number[]>();
    linkRows.forEach(link => {
      const existing = linkMap.get(link.profileId) || [];
      existing.push(link.companyId);
      linkMap.set(link.profileId, existing);
    });

    const rows = await db
      .select({
        profileId: connectionProfiles.profileId,
        fullName: connectionProfiles.fullName,
        role: connectionProfiles.role,
        email: connectionProfiles.email,
        linkedinUrl: connectionProfiles.linkedinUrl,
        accuracy: connectionProfiles.accuracy,
        confidence: connectionProfiles.confidence,
        rawSource: connectionProfiles.rawSource,
        enrichedProfile: connectionProfiles.enrichedProfile,
        scrapedSummary: connectionProfiles.scrapedSummary,
        scrapedFacts: connectionProfiles.scrapedFacts,
        investorId: connectionProfiles.investorId,
        primaryCompanyId: connectionProfiles.primaryCompanyId,
      })
      .from(connectionProfiles)
      .orderBy(desc(connectionProfiles.updatedAt));

    return rows.map(row => {
      let parsed: EnrichedConnectionProfile | null = null;
      if (row.enrichedProfile) {
        try {
          parsed = JSON.parse(row.enrichedProfile) as EnrichedConnectionProfile;
        } catch (error) {
          console.warn("[Connections] Failed to parse stored profile JSON", error);
        }
      }

      const parsedProfile = parsed as EnrichedConnectionProfile | null;

      const profile: EnrichedConnectionProfile = {
        ...((parsedProfile || {}) as EnrichedConnectionProfile),
        id: parsedProfile?.id || row.profileId,
        fullName: parsedProfile?.fullName || row.fullName || row.profileId,
        role: (parsedProfile?.role as EnrichedConnectionProfile["role"]) || (row.role as EnrichedConnectionProfile["role"]) || "operator",
        email: parsedProfile?.email || row.email || undefined,
        linkedinUrl: parsedProfile?.linkedinUrl || row.linkedinUrl || undefined,
        accuracy: parsedProfile?.accuracy ?? row.accuracy ?? 0,
        confidence: parsedProfile?.confidence ?? row.confidence ?? 0,
        tags: parsedProfile?.tags || [],
        sources: parsedProfile?.sources || [],
        matchStatus: parsedProfile?.matchStatus,
        source:
          parsedProfile?.source ||
          (row.rawSource
            ? (() => {
                try {
                  return JSON.parse(row.rawSource);
                } catch {
                  return { firstName: row.fullName || "", lastName: "" };
                }
              })()
            : { firstName: row.fullName || "", lastName: "" }),
      };

      profile.investorId = profile.investorId ?? row.investorId ?? undefined;
      profile.companyId = profile.companyId ?? row.primaryCompanyId ?? undefined;
      profile.scrapedSummary = profile.scrapedSummary ?? row.scrapedSummary ?? undefined;
      if (!profile.scrapedFacts && row.scrapedFacts) {
        try {
          profile.scrapedFacts = JSON.parse(row.scrapedFacts);
        } catch {
          profile.scrapedFacts = [];
        }
      }

      const linkedIds = linkMap.get(row.profileId) || [];
      if (linkedIds.length > 0) {
        const linkedCompanies = Array.isArray(profile.linkedCompanies)
          ? profile.linkedCompanies.map(company => ({ ...company }))
          : [];

        linkedIds.forEach((companyId, idx) => {
          const existing = linkedCompanies.find(company => company.companyId === companyId);
          if (existing) {
            existing.companyId = companyId;
            return;
          }

          if (linkedCompanies[idx] && !linkedCompanies[idx].companyId) {
            linkedCompanies[idx] = { ...linkedCompanies[idx], companyId };
            return;
          }

          linkedCompanies.push({
            name: profile.companyDetails?.name || profile.company || profile.fullName,
            companyId,
            confidence: linkedCompanies[idx]?.confidence ?? profile.confidence ?? 70,
            isPrimary: idx === 0,
          });
        });

        profile.linkedCompanies = linkedCompanies;
        if (!profile.companyId) {
          profile.companyId = linkedIds[0];
        }
      }

      return profile;
    });
  } catch (error) {
    console.warn("[Connections] Failed to load profiles from DB, falling back to cache", error);
    return null;
  }
}

async function loadStoredConnectionProfiles(): Promise<EnrichedConnectionProfile[]> {
  const fromDb = await loadConnectionProfilesFromDb();
  if (fromDb && fromDb.length > 0) {
    return fromDb;
  }
  return loadConnectionProfiles();
}

async function extractPdfText(base64Data: string) {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || (pdfParseModule as any);
    const buffer = Buffer.from(base64Data, "base64");
    const parsed = await pdfParse(buffer);
    return parsed?.text || "";
  } catch (error) {
    console.warn("[PitchDeck] Failed to parse PDF", error);
    return "";
  }
}

async function analyzePitchDeck(text: string, companyName: string) {
  if (!text.trim()) return null;
  const truncated = text.slice(0, 8000);
  const schema = {
    name: "pitch_deck_analysis",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        highlights: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        metrics: {
          type: "object",
          properties: {
            revenue: { type: "string" },
            teamSize: { type: "number" },
            marketSize: { type: "string" },
            customers: { type: "number" },
            growth: { type: "string" },
            fundingTarget: { type: "string" },
            businessModel: { type: "string" },
            competitors: { type: "array", items: { type: "string" } },
          },
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    strict: false,
  };

  const response = await invokeLLM({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system" as const,
        content:
          "You are an investment analyst summarizing a startup pitch deck. Extract crisp highlights, risks, and structured metrics. Avoid fabricating numbers—use qualitative notes if unsure.",
      },
      {
        role: "user" as const,
        content: `Company: ${companyName}
Pitch deck text (truncated):
${truncated}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 1200,
  });

  const raw = response.choices[0]?.message?.content;
  const parsed =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? raw.map(part => (part as any).text || "").join("\n")
        : "";

  try {
    return JSON.parse(parsed);
  } catch (error) {
    console.warn("[PitchDeck] Failed to parse LLM analysis", error);
    return null;
  }
}

async function syncProfilesToDatabase(
  profiles: EnrichedConnectionProfile[],
): Promise<{
  investorsAdded: number;
  companiesAdded: number;
  matchesGenerated: number;
  profiles: EnrichedConnectionProfile[];
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[Connections] Database not available, skipping persistence");
    return { investorsAdded: 0, companiesAdded: 0, matchesGenerated: 0, profiles };
  }
  await ensureConnectionTables(db);

  const updatedProfiles = profiles.map(profile => ({ ...profile }));
  let investorsAdded = 0;
  let companiesAdded = 0;
  let matchesGenerated = 0;

  const existingInvestors = await db
    .select({
      id: investors.id,
      name: investors.name,
      firm: investors.firm,
      email: investors.email,
      linkedinUrl: investors.linkedinUrl,
      websiteUrl: investors.websiteUrl,
    })
    .from(investors);

  const existingCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      websiteUrl: companies.websiteUrl,
      founderEmail: companies.founderEmail,
      founderLinkedin: companies.founderLinkedin,
    })
    .from(companies);

  const investorKeyToId = new Map<string, number>();
  existingInvestors.forEach(inv => {
    getInvestorDedupKeys(inv).forEach(key => investorKeyToId.set(key, inv.id!));
  });

  const companyKeyToId = new Map<string, number>();
  existingCompanies.forEach(comp => {
    getCompanyDedupKeys(comp).forEach(key => companyKeyToId.set(key, comp.id!));
  });

  const investorsCache = await listAllInvestors();
  const companiesCache = await listAllCompanies();
  const connectionInvestorIds = new Set<number>();
  const connectionCompanyIds = new Set<number>();

  for (const profile of updatedProfiles) {
    const linkedCompanyIds: number[] = [];
    const linkedCompaniesWithIds: NonNullable<EnrichedConnectionProfile["linkedCompanies"]> = [];
    let companyRelationship: string | null = null;
    if (profile.role === "investor") {
      const normalized = normalizeInvestorRecord({
        name: profile.fullName,
        firm: profile.investorDetails?.firm || profile.company || "Independent",
        title: profile.title,
        email: profile.email,
        linkedin: profile.linkedinUrl,
        sector:
          profile.sector ||
          profile.focusAreas?.[0] ||
          profile.investorDetails?.focusSectors?.[0],
        stage: profile.stage || profile.investorDetails?.focusStages?.[0],
        geography:
          profile.geography || profile.investorDetails?.focusGeographies?.[0],
        checkSizeMin: profile.checkSizeMin ?? profile.investorDetails?.checkSizeMin,
        checkSizeMax: profile.checkSizeMax ?? profile.investorDetails?.checkSizeMax,
        thesis: profile.thesis || profile.summary,
        focusSectors: profile.investorDetails?.focusSectors ?? profile.focusAreas,
        focusStages: profile.investorDetails?.focusStages,
        focusGeographies: profile.investorDetails?.focusGeographies,
        tags: profile.tags,
        bio: profile.investorDetails?.bio,
        notableInvestments: profile.investorDetails?.pastInvestments?.join(", "),
      });

      const keys = getInvestorDedupKeys(normalized);
      const existingId = keys.map(key => investorKeyToId.get(key)).find(Boolean);

      if (existingId) {
        profile.investorId = existingId;
        connectionInvestorIds.add(existingId);
        profile.matchStatus = "synced";
        try {
          const { generated } = await generateMatchesForInvestor(existingId, {
            companies: companiesCache,
          });
          matchesGenerated += generated;
          if (generated > 0) profile.matchStatus = "matched";
        } catch (error) {
          console.warn("[Matching] Failed to compute matches for existing investor", existingId, error);
        }
      } else {
        await db.insert(investors).values({
          ...normalized,
          bio: normalized.bio || profile.summary,
          thesis: normalized.thesis || profile.thesis || profile.summary,
          confidence: profile.accuracy || profile.confidence || 80,
          tags: normalized.tags ?? JSON.stringify({ focusAreas: profile.focusAreas || [], importedFrom: "connections_csv" }),
        });
        investorsAdded++;

        const [inserted] = await db.select().from(investors).orderBy(desc(investors.id)).limit(1);
        if (inserted?.id) {
          profile.investorId = inserted.id;
          connectionInvestorIds.add(inserted.id);
          profile.matchStatus = "synced";
          keys.forEach(key => investorKeyToId.set(key, inserted.id));
          investorsCache.push(inserted);
          try {
            const { generated } = await generateMatchesForInvestor(inserted.id, {
              companies: companiesCache,
            });
            matchesGenerated += generated;
            if (generated > 0) profile.matchStatus = "matched";
          } catch (error) {
            console.warn("[Matching] Failed to compute matches for investor", inserted.id, error);
          }
        }
      }
    } else if (profile.role === "founder" || profile.role === "operator") {
      companyRelationship = profile.role === "operator" ? "operator" : "founder";
      const companiesForProfile =
        profile.linkedCompanies && profile.linkedCompanies.length > 0
          ? [...profile.linkedCompanies].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
          : [
              {
                name: profile.companyDetails?.name || profile.company || `${profile.fullName}'s Company`,
                website: profile.companyDetails?.website,
                description: profile.companyDetails?.description || profile.summary,
                stage: profile.stage || profile.companyDetails?.stage,
                headquarters: profile.geography || profile.companyDetails?.headquarters,
                fundingTarget: profile.companyDetails?.fundingTarget ?? undefined,
                fundingRaised: profile.companyDetails?.fundingRaised ?? undefined,
                foundedYear: profile.companyDetails?.foundedYear ?? undefined,
                role: companyRelationship,
                confidence: profile.accuracy ?? profile.confidence ?? 75,
                isPrimary: true,
              },
            ];

      for (const companyCandidate of companiesForProfile) {
        const normalizedCompany = normalizeCompanyRecord({
          name: companyCandidate.name,
          description: companyCandidate.description || profile.summary,
          sector: profile.sector || profile.focusAreas?.[0],
          geography: companyCandidate.headquarters || profile.geography,
          stage: companyCandidate.stage || profile.stage,
          founderName: profile.fullName,
          founderEmail: profile.email,
          founderLinkedin: profile.linkedinUrl,
          fundingTarget: companyCandidate.fundingTarget ?? undefined,
          fundingRaised: companyCandidate.fundingRaised ?? undefined,
          foundedYear: companyCandidate.foundedYear ?? undefined,
          website: companyCandidate.website,
          tags: profile.tags,
        });

        const keys = getCompanyDedupKeys(normalizedCompany);
        const existingId = keys.map(key => companyKeyToId.get(key)).find(Boolean);

        if (existingId) {
          linkedCompanyIds.push(existingId);
          linkedCompaniesWithIds.push({
            ...companyCandidate,
            companyId: existingId,
          });
          connectionCompanyIds.add(existingId);
          if (!profile.companyId || companyCandidate.isPrimary) {
            profile.companyId = existingId;
          }
          profile.matchStatus = "synced";
          try {
            const { generated } = await generateMatchesForCompany(existingId, {
              investors: investorsCache,
            });
            matchesGenerated += generated;
            if (generated > 0) profile.matchStatus = "matched";
          } catch (error) {
            console.warn("[Matching] Failed to compute matches for existing company", existingId, error);
          }
          continue;
        }

        await db.insert(companies).values({
          ...normalizedCompany,
          confidence: profile.accuracy || profile.confidence || 75,
        });
        companiesAdded++;

        const [insertedCompany] = await db.select().from(companies).orderBy(desc(companies.id)).limit(1);
        if (insertedCompany?.id) {
          linkedCompanyIds.push(insertedCompany.id);
          linkedCompaniesWithIds.push({
            ...companyCandidate,
            companyId: insertedCompany.id,
          });
          connectionCompanyIds.add(insertedCompany.id);
          if (!profile.companyId || companyCandidate.isPrimary) {
            profile.companyId = insertedCompany.id;
          }
          profile.matchStatus = "synced";
          keys.forEach(key => companyKeyToId.set(key, insertedCompany.id));
          companiesCache.push(insertedCompany);
          try {
            const { generated } = await generateMatchesForCompany(insertedCompany.id, {
              investors: investorsCache,
            });
            matchesGenerated += generated;
            if (generated > 0) profile.matchStatus = "matched";
          } catch (error) {
            console.warn("[Matching] Failed to compute matches for company", insertedCompany.id, error);
          }
        }
      }
    }

    if (linkedCompanyIds.length && !profile.companyId) {
      profile.companyId = linkedCompanyIds[0];
    }
    if (linkedCompaniesWithIds.length > 0) {
      const existing = Array.isArray(profile.linkedCompanies) ? profile.linkedCompanies : [];
      const merged = [...linkedCompaniesWithIds];
      existing.forEach(company => {
        const alreadyPresent = merged.find(
          item =>
            (company.companyId && item.companyId === company.companyId) ||
            (company.name && item.name && company.name.toLowerCase() === item.name.toLowerCase()),
        );
        if (!alreadyPresent) {
          merged.push(company);
        }
      });
      profile.linkedCompanies = merged;
    }
    await persistCompanyLinks(db, profile.id, linkedCompanyIds, companyRelationship ?? "founder");
    await upsertConnectionProfileRow(db, profile, profile.companyId ?? linkedCompanyIds[0] ?? null);
  }

  if (connectionCompanyIds.size > 0 && connectionInvestorIds.size > 0) {
    const candidateInvestors = investorsCache.filter(inv => inv.id && connectionInvestorIds.has(inv.id));
    const candidateCompanies = companiesCache.filter(company => company.id && connectionCompanyIds.has(company.id));

    for (const companyId of connectionCompanyIds) {
      try {
        const { generated } = await generateMatchesForCompany(companyId, {
          investors: candidateInvestors,
          minScore: 0,
          persist: true,
        });
        matchesGenerated += generated;
      } catch (error) {
        console.warn("[Matching] Failed to compute connection matches for company", companyId, error);
      }
    }

    for (const investorId of connectionInvestorIds) {
      try {
        const { generated } = await generateMatchesForInvestor(investorId, {
          companies: candidateCompanies,
          minScore: 0,
          persist: true,
        });
        matchesGenerated += generated;
      } catch (error) {
        console.warn("[Matching] Failed to compute connection matches for investor", investorId, error);
      }
    }
  }

  return {
    investorsAdded,
    companiesAdded,
    matchesGenerated,
    profiles: updatedProfiles,
  };
}

export const appRouter = router({
  import: router({
    parseCompaniesCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = getCsvLines(input.csvData);
        if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
        
        const headers = splitCsvLine(lines[0]);
        const companies = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = splitCsvLine(lines[i]);
            const company: any = {};
            
            headers.forEach((header, idx) => {
              const value = values[idx] || '';
              
              // Map LinkedIn CSV columns to our database fields
              switch(header) {
                case 'Company Name': company.name = value; break;
                case 'Website': company.website = value; break;
                case 'Description': company.description = value; break;
                case 'Industry': company.sector = value; break;
                case 'Company Size': company.teamSize = parseInt(value) || 0; break;
                case 'Location': company.geography = value; break;
                case 'Founded Year': company.founded = parseInt(value) || new Date().getFullYear(); break;
                case 'Growth Rate': company.revenueGrowth = parseInt(value.replace('%', '')) || 0; break;
                case 'Funding Stage': company.stage = value; break;
                case 'Funding Seeking': company.fundingTarget = parseInt(value.replace(/[^0-9]/g, '')) || 0; break;
                case 'Funding Raised': company.fundingRaised = parseInt(value.replace(/[^0-9]/g, '')) || 0; break;
                case 'Valuation': company.valuation = parseInt(value.replace(/[^0-9]/g, '')) || 0; break;
                case 'Founder Name': company.founderName = value; break;
                case 'Founder Email': company.founderEmail = value; break;
                case 'Founder LinkedIn': company.founderLinkedin = value; break;
                case 'Pitch Deck URL': company.pitchDeckUrl = value; break;
                case 'Revenue Range':
                  const match = value.match(/\$([0-9.]+)M/);
                  if (match) company.revenue = parseFloat(match[1]) * 1000000;
                  break;
              }
            });
            
            // Validation
            if (!company.name) throw new Error('Company name is required');
            if (!company.sector) throw new Error('Industry/Sector is required');
            
            const normalized = normalizeCompanyRecord(company);
            if (!normalized.name) {
              throw new Error('Company name is required');
            }
            if (!normalized.sector) {
              throw new Error('Industry/Sector is required');
            }
            companies.push(normalized);
          } catch (error: any) {
            errors.push({ row: i + 1, error: error.message });
          }
        }
        
        return { companies, errors, total: lines.length - 1 };
      }),
      
    parseInvestorsCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = getCsvLines(input.csvData);
        if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
        
        const headers = splitCsvLine(lines[0]);
        const investors = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = splitCsvLine(lines[i]);
            const investor: any = {};
            
            headers.forEach((header, idx) => {
              const value = values[idx] || '';
              
              // Map LinkedIn CSV columns to our database fields
              switch(header) {
                case 'Full Name': investor.name = value; break;
                case 'Title': investor.title = value; break;
                case 'Company': investor.firm = value; break;
                case 'Email': investor.email = value; break;
                case 'LinkedIn URL': investor.linkedin = value; break;
                case 'Website': investor.website = value; break;
                case 'Location': investor.geography = value; break;
                case 'Investment Thesis': investor.thesis = value; break;
                case 'Bio': investor.bio = value; break;
                case 'Focus Sectors': 
                  investor.focusSectors = value.split(',').map(s => s.trim());
                  break;
                case 'Focus Stages': 
                  investor.focusStages = value.split(',').map(s => s.trim());
                  break;
                case 'Focus Geographies': 
                  investor.focusGeographies = value.split(',').map(s => s.trim());
                  break;
                case 'Check Size Min': 
                  investor.checkSizeMin = parseInt(value.replace(/[^0-9]/g, '')) || 0;
                  break;
                case 'Check Size Max': 
                  investor.checkSizeMax = parseInt(value.replace(/[^0-9]/g, '')) || 0;
                  break;
                case 'Portfolio Companies': 
                  investor.portfolioSize = parseInt(value) || 0;
                  break;
              }
            });
            
            // Validation
            if (!investor.name) throw new Error('Investor name is required');
            if (!investor.firm) throw new Error('Company/Firm is required');
            
            const normalized = normalizeInvestorRecord(investor);
            if (!normalized.name) {
              throw new Error('Investor name is required');
            }
            if (!normalized.firm) {
              throw new Error('Company/Firm is required');
            }
            investors.push(normalized);
          } catch (error: any) {
            errors.push({ row: i + 1, error: error.message });
          }
        }
        
        return { investors, errors, total: lines.length - 1 };
      }),
      
    importCompanies: protectedProcedure
      .input(z.object({ companies: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const existingCompanies = await db
          .select({
            name: companies.name,
            websiteUrl: companies.websiteUrl,
            founderEmail: companies.founderEmail,
            founderLinkedin: companies.founderLinkedin,
          })
          .from(companies);
        
        let imported = 0;
        const errors = [];
        let matchesGenerated = 0;
        const investorsCache = await listAllInvestors();
        const knownCompanyKeys = new Set<string>();
        const batchKeys = new Set<string>();

        existingCompanies.forEach(existing => {
          getCompanyDedupKeys(existing).forEach(key => knownCompanyKeys.add(key));
        });
        
        for (const company of input.companies) {
          try {
            const dedupKeys = getCompanyDedupKeys(company);
            const isDuplicate =
              dedupKeys.some(key => knownCompanyKeys.has(key)) ||
              dedupKeys.some(key => batchKeys.has(key));

            if (isDuplicate) {
              errors.push({
                company: company.name,
                error: "Duplicate company detected. Skipping import.",
              });
              continue;
            }

            dedupKeys.forEach(key => batchKeys.add(key));

            await db.insert(companies).values({
              ...company,
              businessModel: company.businessModel || 'B2B SaaS',
              customers: company.customers || 0,
              mrr: company.mrr || 0,
              confidence: 85
            });
            imported++;

            dedupKeys.forEach(key => knownCompanyKeys.add(key));
            
            const [inserted] = await db
              .select()
              .from(companies)
              .orderBy(desc(companies.id))
              .limit(1);

            if (inserted) {
              try {
                const { generated } = await generateMatchesForCompany(inserted.id, {
                  investors: investorsCache,
                });
                matchesGenerated += generated;
              } catch (matchError) {
                console.warn("[Matching] Failed to compute matches for company", inserted.id, matchError);
              }
            }
          } catch (error: any) {
            errors.push({ company: company.name, error: error.message });
          }
        }
        
        return { imported, errors, total: input.companies.length, matchesGenerated };
      }),
      
    importInvestors: protectedProcedure
      .input(z.object({ investors: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const existingInvestors = await db
          .select({
            name: investors.name,
            firm: investors.firm,
            email: investors.email,
            linkedinUrl: investors.linkedinUrl,
            websiteUrl: investors.websiteUrl,
          })
          .from(investors);
        
        let imported = 0;
        const errors = [];
        let matchesGenerated = 0;
        const companiesCache = await listAllCompanies();
        const knownInvestorKeys = new Set<string>();
        const batchInvestorKeys = new Set<string>();

        existingInvestors.forEach(existing => {
          getInvestorDedupKeys(existing).forEach(key => knownInvestorKeys.add(key));
        });
        
        for (const investor of input.investors) {
          try {
            const dedupKeys = getInvestorDedupKeys(investor);
            const isDuplicate =
              dedupKeys.some(key => knownInvestorKeys.has(key)) ||
              dedupKeys.some(key => batchInvestorKeys.has(key));

            if (isDuplicate) {
              errors.push({
                investor: investor.name,
                error: "Duplicate investor detected. Skipping import.",
              });
              continue;
            }

            dedupKeys.forEach(key => batchInvestorKeys.add(key));

            await db.insert(investors).values({
              ...investor,
              type: 'VC',
              confidence: 85
            });
            imported++;

            dedupKeys.forEach(key => knownInvestorKeys.add(key));
            
            const [inserted] = await db
              .select()
              .from(investors)
              .orderBy(desc(investors.id))
              .limit(1);

            if (inserted) {
              try {
                const { generated } = await generateMatchesForInvestor(inserted.id, {
                  companies: companiesCache,
                });
                matchesGenerated += generated;
              } catch (matchError) {
                console.warn("[Matching] Failed to compute matches for investor", inserted.id, matchError);
              }
            }
          } catch (error: any) {
            errors.push({ investor: investor.name, error: error.message });
          }
        }
        
        return { imported, errors, total: input.investors.length, matchesGenerated };
      }),
  }),
  connections: router({
    list: publicProcedure.query(async () => {
      return loadStoredConnectionProfiles();
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const profiles = await loadStoredConnectionProfiles();
        const profile = profiles.find(p => p.id === input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }
        return profile;
      }),

    ingestCsv: protectedProcedure
      .input(z.object({ csvData: z.string(), limit: z.number().min(1).max(50).optional() }))
      .mutation(async ({ input }) => {
        const limit = input.limit ?? 20;
        const enriched = await enrichConnectionsFromCsv(input.csvData, limit);

        let merged = await loadStoredConnectionProfiles();
        enriched.forEach(profile => {
          merged = upsertProfile(merged, profile);
        });

        const syncResult = await syncProfilesToDatabase(merged);
        await saveConnectionProfiles(syncResult.profiles);

        return {
          imported: enriched.length,
          profiles: syncResult.profiles,
          db: {
            investorsAdded: syncResult.investorsAdded,
            companiesAdded: syncResult.companiesAdded,
            matchesGenerated: syncResult.matchesGenerated,
          },
        };
      }),

    syncLinkedIn: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
      .mutation(async ({ input }) => {
        const limit = input?.limit ?? 20;
        let csvData = "";
        try {
          const fs = await import("fs/promises");
          csvData = await fs.readFile(LINKEDIN_EXPORT_PATH, "utf-8");
        } catch (error) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `LinkedIn export not found at ${LINKEDIN_EXPORT_PATH}`,
          });
        }

        const parsed = parseLinkedInConnections(csvData, limit);
        const errors: Array<{ name: string; error: string }> = [];
        const enriched: EnrichedConnectionProfile[] = [];

        for (const row of parsed) {
          try {
            const profile = await enrichConnection(row);
            enriched.push(profile);
          } catch (error: any) {
            errors.push({
              name: `${row.firstName} ${row.lastName}`.trim() || row.linkedinUrl || "Unknown",
              error: error?.message || "Failed to enrich profile",
            });
          }
        }

        let merged = await loadStoredConnectionProfiles();
        enriched.forEach(profile => {
          merged = upsertProfile(merged, profile);
        });

        const syncResult = await syncProfilesToDatabase(merged);
        await saveConnectionProfiles(syncResult.profiles);

        return {
          imported: enriched.length,
          errors,
          db: {
            investorsAdded: syncResult.investorsAdded,
            companiesAdded: syncResult.companiesAdded,
            matchesGenerated: syncResult.matchesGenerated,
          },
          profiles: syncResult.profiles,
        };
      }),

    refreshProfile: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const profiles = await loadStoredConnectionProfiles();
        const current = profiles.find(p => p.id === input.id);
        if (!current) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        const updated = await enrichConnection(current.source);
        updated.attachedFiles = current.attachedFiles;
        updated.investorId = current.investorId;
        updated.companyId = current.companyId;

        let merged = upsertProfile(profiles, updated);
        const syncResult = await syncProfilesToDatabase(merged);
        merged = syncResult.profiles;
        await saveConnectionProfiles(merged);

        const refreshed = merged.find(p => p.id === updated.id) || updated;
        return {
          profile: refreshed,
          db: {
            investorsAdded: syncResult.investorsAdded,
            companiesAdded: syncResult.companiesAdded,
            matchesGenerated: syncResult.matchesGenerated,
          },
        };
      }),

    uploadAttachment: protectedProcedure
      .input(z.object({
        id: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        dataBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        let profiles = await loadStoredConnectionProfiles();
        const target = profiles.find(p => p.id === input.id);
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        const dataUrl = normalizeDataUrl(input.dataBase64, input.mimeType);
        const size = Math.round((dataUrl.length * 3) / 4);
        const attachment = {
          id: `${Date.now()}`,
          name: input.fileName,
          mimeType: input.mimeType,
          size,
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        const updated: EnrichedConnectionProfile = {
          ...target,
          attachedFiles: [...(target.attachedFiles || []), attachment],
        };

        profiles = upsertProfile(profiles, updated);
        await saveConnectionProfiles(profiles);

        return updated;
      }),

    pushToMatching: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        let profiles = await loadStoredConnectionProfiles();
        const target = profiles.find(p => p.id === input.id);
        if (!target) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        const syncResult = await syncProfilesToDatabase([target]);
        const updated = syncResult.profiles[0] || target;

        profiles = upsertProfile(profiles, updated);
        await saveConnectionProfiles(profiles);

        return {
          profile: updated,
          db: {
            investorsAdded: syncResult.investorsAdded,
            companiesAdded: syncResult.companiesAdded,
            matchesGenerated: syncResult.matchesGenerated,
          },
        };
      }),
  }),
  settings: router({
    getMatchingConfig: protectedProcedure.query(async () => {
      return loadMatchingConfig();
    }),
    saveMatchingConfig: protectedProcedure
      .input(
        z.object({
          weights: z.object({
            sector: z.number(),
            stage: z.number(),
            geography: z.number(),
            traction: z.number(),
            checkSize: z.number(),
            thesis: z.number(),
          }),
          filters: z.object({
            minRevenue: z.number(),
            minTeamSize: z.number(),
            requirePitchDeck: z.boolean(),
            requireTraction: z.boolean(),
          }),
          thresholds: z.object({
            minMatchScore: z.number(),
            minSectorScore: z.number(),
            minStageScore: z.number(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const stored = await saveMatchingConfig(input as MatchingConfig);
        return { success: true, config: stored };
      }),
  }),
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Company management
  companies: router({
    list: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        stage: z.string().optional(),
        geography: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { listCompanies } = await import("./db");
        return listCompanies(input || {});
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getCompanyById } = await import("./db");
        return getCompanyById(input.id);
      }),

    uploadFile: protectedProcedure
      .input(z.object({
        companyName: z.string().optional(),
        companyId: z.number().optional(),
        fileName: z.string(),
        mimeType: z.string(),
        dataBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        let company = null;
        if (input.companyId) {
          const rows = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
          company = rows[0] || null;
        }
        if (!company && input.companyName) {
          const rows = await db.select().from(companies).where(eq(companies.name, input.companyName)).limit(1);
          company = rows[0] || null;
        }
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found for uploaded file" });
        }

        let fileUrl: string | null = null;
        const payload = input.dataBase64.startsWith("data:")
          ? input.dataBase64.split(",").slice(1).join(",")
          : input.dataBase64;
        const buffer = Buffer.from(payload, "base64");
        let analysis: any = null;

        try {
          const stored = await storagePut(
            `pitchdecks/${company.id}-${Date.now()}-${input.fileName}`,
            buffer,
            input.mimeType,
          );
          fileUrl = stored.url;
        } catch (error) {
          console.warn("[Upload] Failed to store file via storage proxy, falling back to data URL", error);
          fileUrl = input.dataBase64;
        }

        if (input.mimeType.toLowerCase().includes("pdf")) {
          const text = await extractPdfText(payload);
          analysis = await analyzePitchDeck(text, company.name);
        }

        await db
          .update(companies)
          .set({
            pitchDeckUrl: fileUrl,
            pitchDeckAnalysis: analysis ? JSON.stringify(analysis) : company.pitchDeckAnalysis,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, company.id));

        try {
          await generateMatchesForCompany(company.id);
        } catch (error) {
          console.warn("[Matching] Failed to refresh matches after file upload", error);
        }

        return { success: true, companyId: company.id, pitchDeckUrl: fileUrl, analysis };
      }),
  }),

  // Investor management
  investors: router({
    list: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        stage: z.string().optional(),
        geography: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { listInvestors } = await import("./db");
        return listInvestors(input || {});
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getInvestorById } = await import("./db");
        return getInvestorById(input.id);
      }),
  }),

  // Matching engine
  matches: router({
    list: publicProcedure
      .input(z.object({
        companyId: z.number().optional(),
        investorId: z.number().optional(),
        minScore: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { listMatches } = await import("./db");
        return listMatches(input || {});
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getMatchById } = await import("./db");
        return getMatchById(input.id);
      }),
    
    withDetails: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getMatchWithDetails } = await import("./db");
        return getMatchWithDetails(input.id);
      }),
    
    forCompany: publicProcedure
      .input(z.object({
        companyId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getCompanyMatches } = await import("./db");
        return getCompanyMatches(input.companyId, input.limit);
      }),

    manualRun: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          weights: z.object({
            sector: z.number(),
            stage: z.number(),
            geography: z.number(),
            traction: z.number(),
            checkSize: z.number(),
            thesis: z.number(),
          }).optional(),
          temperature: z.number().min(0).max(1).optional(),
          limit: z.number().min(1).max(50).optional(),
          persist: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return generateMatchesForCompany(input.companyId, {
          weights: input.weights,
          temperature: input.temperature,
          limit: input.limit ?? 20,
          persist: input.persist ?? true,
        });
      }),
  }),

  // Semantic search (AI reranking)
  search: router({
    semantic: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().min(1).max(50).optional() }))
      .query(async ({ input }) => {
        const limit = input.limit ?? 20;
        const companiesList = await listAllCompanies();
        const sample = companiesList.slice(0, 60).map(company => ({
          id: company.id!,
          name: company.name,
          sector: company.sector,
          stage: company.stage,
          geography: company.geography,
          description: company.description,
          fundingTarget: company.fundingTarget,
          revenue: company.revenue,
        }));

        const fallback = sample
          .map(company => {
            const haystack = `${company.name} ${company.description ?? ""} ${company.sector ?? ""} ${company.stage ?? ""} ${company.geography ?? ""}`.toLowerCase();
            const score =
              (input.query.toLowerCase().split(/\s+/).filter(Boolean).reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0) /
                Math.max(1, input.query.split(/\s+/).length)) *
              100;
            return { company, score: Math.round(Math.min(100, score * 20)) };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => ({
            company: companiesList.find(c => c.id === item.company.id) || item.company,
            score: item.score,
            reason: "Keyword overlap",
          }));

        if (!process.env.OPENAI_API_KEY && !process.env.BUILT_IN_FORGE_API_KEY) {
          return { query: input.query, results: fallback, usedAI: false };
        }

        try {
          const schema = {
            name: "semantic_company_rank",
            schema: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      score: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["id", "score"],
                  },
                },
              },
              required: ["results"],
            },
            strict: false,
          };

          const response = await invokeLLM({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a semantic search ranker for startup investors. Rank the companies by relevance to the user's query. Prefer factual matches on sector, stage, geography, traction, or funding target. If unsure, keep score lower.",
              },
              {
                role: "user",
                content: `Query: ${input.query}
Companies (id, name, sector, stage, geography, description, fundingTarget, revenue):
${JSON.stringify(sample.slice(0, 40), null, 2)}
Return up to ${limit} results with ids, scores (0-100), and a short reason.`,
              },
            ],
            response_format: { type: "json_schema", json_schema: schema },
            max_tokens: 800,
          });

          const rawContent = response.choices[0]?.message?.content;
          const parsed =
            typeof rawContent === "string"
              ? rawContent
              : Array.isArray(rawContent)
                ? rawContent.map((c: any) => c.text || "").join("\n")
                : "";

          const payload = parsed ? JSON.parse(parsed) : { results: [] };
          const byId = new Map(companiesList.map(c => [c.id, c]));
          const ordered = (payload.results || [])
            .filter((item: any) => typeof item?.id === "number")
            .map((item: any) => ({
              company: byId.get(item.id) || sample.find(entry => entry.id === item.id) || null,
              score: Math.round(Math.min(100, Math.max(0, item.score || 0))),
              reason: item.reason || "AI semantic relevance",
            }))
            .filter((item: any) => item.company)
            .slice(0, limit);

          if (ordered.length === 0) {
            return { query: input.query, results: fallback, usedAI: false };
          }

          return {
            query: input.query,
            results: ordered,
            usedAI: true,
          };
        } catch (error) {
          console.warn("[SemanticSearch] Falling back to keyword search", error);
          return { query: input.query, results: fallback, usedAI: false };
        }
      }),
  }),

  // Analytics
  analytics: router({
    overview: publicProcedure
      .query(async () => {
        const { getAnalytics } = await import("./db");
        return getAnalytics();
      }),
    
    sectorDistribution: publicProcedure
      .query(async () => {
        const { getSectorDistribution } = await import("./db");
        return getSectorDistribution();
      }),
    
    stageDistribution: publicProcedure
      .query(async () => {
        const { getStageDistribution } = await import("./db");
        return getStageDistribution();
      }),

    recentActivity: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { matches: [], companies: [], investors: [] };

      const recentMatches = await db
        .select({
          id: matches.id,
          score: matches.score,
          createdAt: matches.createdAt,
          companyId: matches.companyId,
          investorId: matches.investorId,
        })
        .from(matches)
        .orderBy(desc(matches.createdAt))
        .limit(10);

      const recentCompanies = await db
        .select({
          id: companies.id,
          name: companies.name,
          sector: companies.sector,
          stage: companies.stage,
          createdAt: companies.createdAt,
        })
        .from(companies)
        .orderBy(desc(companies.createdAt))
        .limit(10);

      const recentInvestors = await db
        .select({
          id: investors.id,
          name: investors.name,
          firm: investors.firm,
          sector: investors.sector,
          createdAt: investors.createdAt,
        })
        .from(investors)
        .orderBy(desc(investors.createdAt))
        .limit(10);

      return {
        matches: recentMatches,
        companies: recentCompanies,
        investors: recentInvestors,
      };
    }),

    topEntities: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { investors: [], companies: [] };

      const topInvestors = await db
        .select({
          investorId: matches.investorId,
          count: desc(sql<number>`count(*)`),
        })
        .from(matches)
        .groupBy(matches.investorId)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      const topCompanies = await db
        .select({
          companyId: matches.companyId,
          count: desc(sql<number>`count(*)`),
        })
        .from(matches)
        .groupBy(matches.companyId)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      const investorDetails = await Promise.all(
        topInvestors.map(async item => {
          const investor = await db
            .select({
              id: investors.id,
              name: investors.name,
              firm: investors.firm,
              title: investors.title,
              sector: investors.sector,
            })
            .from(investors)
            .where(eq(investors.id, item.investorId))
            .limit(1);
          return investor[0]
            ? { ...investor[0], connections: Number(item.count) }
            : null;
        }),
      );

      const companyDetails = await Promise.all(
        topCompanies.map(async item => {
          const company = await db
            .select({
              id: companies.id,
              name: companies.name,
              sector: companies.sector,
              stage: companies.stage,
            })
            .from(companies)
            .where(eq(companies.id, item.companyId))
            .limit(1);
          return company[0]
            ? { ...company[0], connections: Number(item.count) }
            : null;
        }),
      );

      return {
        investors: investorDetails.filter(Boolean),
        companies: companyDetails.filter(Boolean),
      };
    }),
  }),

  // Legacy entity endpoints for backward compatibility
  entities: router({
    list: publicProcedure
      .input(z.object({
        type: z.enum(["founder", "investor", "enabler"]).optional(),
        sector: z.string().optional(),
        stage: z.string().optional(),
        geography: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        // Map to investors for backward compatibility
        const { listInvestors } = await import("./db");
        return listInvestors({
          sector: input?.sector,
          stage: input?.stage,
          geography: input?.geography,
          search: input?.search,
          limit: input?.limit,
        });
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Try investor first for backward compatibility
        const { getInvestorById } = await import("./db");
        return getInvestorById(input.id);
      }),
    
    connections: publicProcedure
      .input(z.object({ entityId: z.number() }))
      .query(async ({ input }) => {
        // Return empty for now - connections not implemented yet
        return [];
      }),
  }),

  introRequests: router({
    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        investorId: z.number(),
        connectionId: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        const [investor] = await db.select().from(investors).where(eq(investors.id, input.investorId)).limit(1);
        if (!company || !investor) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company or investor not found" });
        }

        await db.insert(introRequests).values({
          companyId: input.companyId,
          investorId: input.investorId,
          requestedBy: ctx.user.id,
          connectionId: input.connectionId,
          message: input.message,
          status: "pending",
        });

        const emails = buildIntroEmails(company, investor, ctx.user.name);

        return {
          success: true,
          message: "Introduction request sent!",
          emails,
        };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const db = await getDb();
        if (!db) return [];

        const requests = await db
          .select()
          .from(introRequests)
          .where(eq(introRequests.requestedBy, ctx.user.id))
          .orderBy(desc(introRequests.createdAt));

        return requests;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "accepted", "declined", "completed"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db
          .update(introRequests)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(introRequests.id, input.id));

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
