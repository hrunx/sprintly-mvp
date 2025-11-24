import crypto from "crypto";
import { getCsvLines, splitCsvLine } from "../csvParser";
import { invokeLLM } from "../llm";
import { ENV } from "../env";
import { scrapeMultiple } from "../firecrawl";
import { EnrichedConnectionProfile, LinkedInConnectionRow } from "./types";

const SCRAPE_CHAR_LIMIT = 7000;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function buildProfileId(row: LinkedInConnectionRow) {
  const base = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  const fallback = row.linkedinUrl || row.email || row.company || "connection";
  const slug = slugify(base || fallback);
  if (slug.length > 0) return slug;
  return crypto.createHash("md5").update(JSON.stringify(row)).digest("hex").slice(0, 12);
}

function inferRole(row: LinkedInConnectionRow): EnrichedConnectionProfile["role"] {
  const title = `${row.title || ""} ${row.company || ""}`.toLowerCase();
  if (title.match(/partner|investor|principal|vc|venture|capital|angel|fund|family office/)) {
    return "investor";
  }
  if (title.match(/founder|co[- ]founder|ceo|cto|cpo|coo/)) {
    return "founder";
  }
  return "operator";
}

export function parseLinkedInConnections(csvData: string, limit = 20): LinkedInConnectionRow[] {
  const lines = getCsvLines(csvData).filter(line => line && !line.toLowerCase().startsWith("notes"));
  const headerIndex = lines.findIndex(line => line.toLowerCase().includes("first name"));
  if (headerIndex === -1) return [];

  const headers = splitCsvLine(lines[headerIndex]);
  const dataLines = lines.slice(headerIndex + 1);

  const rows: LinkedInConnectionRow[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header.trim()] = values[idx] || "";
    });

    const row: LinkedInConnectionRow = {
      firstName: record["First Name"] || "",
      lastName: record["Last Name"] || "",
      linkedinUrl: record["URL"] || "",
      email: record["Email Address"] || "",
      company: record["Company"] || "",
      title: record["Position"] || "",
      connectedOn: record["Connected On"] || "",
    };

    if (row.firstName || row.lastName || row.linkedinUrl) {
      rows.push(row);
    }
    if (rows.length >= limit) break;
  }
  return rows;
}

type LlmProfile = Partial<
  Pick<
    EnrichedConnectionProfile,
    | "role"
    | "sector"
    | "stage"
    | "geography"
    | "summary"
    | "thesis"
    | "focusAreas"
    | "checkSizeMin"
    | "checkSizeMax"
    | "tags"
    | "sources"
    | "accuracy"
    | "companyDetails"
    | "investorDetails"
    | "linkedCompanies"
  >
> & {
  classificationConfidence?: number;
  companies?: Array<{
    name: string;
    website?: string;
    description?: string;
    stage?: string;
    headquarters?: string;
    foundedYear?: number | null;
    fundingTarget?: number | null;
    fundingRaised?: number | null;
    role?: string;
    confidence?: number;
  }>;
};

async function runLlmEnrichment(row: LinkedInConnectionRow): Promise<LlmProfile | null> {
  if (!process.env.OPENAI_API_KEY && !ENV.forgeApiKey) {
    return null;
  }

  const schema = {
    name: "connection_profile",
    schema: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["investor", "founder", "operator"] },
        classificationConfidence: { type: "number" },
        summary: { type: "string" },
        thesis: { type: "string" },
        sector: { type: "string" },
        stage: { type: "string" },
        geography: { type: "string" },
        focusAreas: { type: "array", items: { type: "string" } },
        checkSizeMin: { type: "number" },
        checkSizeMax: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        sources: { type: "array", items: { type: "string" } },
        accuracy: { type: "number" },
        companyDetails: {
          type: "object",
          properties: {
            name: { type: "string" },
            website: { type: "string" },
            description: { type: "string" },
            stage: { type: "string" },
            raising: { type: "string" },
            headquarters: { type: "string" },
            fundingTarget: { type: "number" },
            fundingRaised: { type: "number" },
            foundedYear: { type: "number" },
          },
          additionalProperties: true,
        },
        companies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              website: { type: "string" },
              description: { type: "string" },
              stage: { type: "string" },
              headquarters: { type: "string" },
              fundingTarget: { type: "number" },
              fundingRaised: { type: "number" },
              foundedYear: { type: "number" },
              role: { type: "string" },
              confidence: { type: "number" },
            },
            additionalProperties: true,
          },
        },
        investorDetails: {
          type: "object",
          properties: {
            firm: { type: "string" },
            checkSizeMin: { type: "number" },
            checkSizeMax: { type: "number" },
            focusSectors: { type: "array", items: { type: "string" } },
            focusStages: { type: "array", items: { type: "string" } },
            focusGeographies: { type: "array", items: { type: "string" } },
            pastInvestments: { type: "array", items: { type: "string" } },
            bio: { type: "string" },
          },
          additionalProperties: true,
        },
      },
      required: ["role", "accuracy"],
      additionalProperties: true,
    },
    strict: false,
  };

  const messages = [
    {
      role: "system" as const,
      content:
        "You are an analyst enriching LinkedIn connection exports. Emulate a deep web scan using public knowledge. If you are unsure, keep fields null/empty and keep accuracy low. Do not fabricate facts. Prefer concise bullet-like outputs.",
    },
    {
      role: "user" as const,
      content: `Profile seed:
- Name: ${row.firstName} ${row.lastName}
- Title: ${row.title || "unknown"}
- Company: ${row.company || "unknown"}
- LinkedIn: ${row.linkedinUrl || "unknown"}
- Email: ${row.email || "unknown"}
- Connected On: ${row.connectedOn || "unknown"}

Return concise factual enrichment, classifying if they are an investor or founder, and include companyDetails (if founder/operator) or investorDetails (if investor).`,
    },
  ];

  const response = await invokeLLM({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map(part => (part as any).text || "").join("\n")
        : "";

  try {
    return JSON.parse(raw) as LlmProfile;
  } catch {
    return null;
  }
}

type LinkedCompany = NonNullable<EnrichedConnectionProfile["linkedCompanies"]>[number];

type ScrapeEnrichment = {
  summary?: string;
  facts?: string[];
  companies?: LinkedCompany[];
  sources: string[];
};

function normalizeWebsite(url?: string | null) {
  if (!url) return "";
  try {
    const normalized = new URL(url.startsWith("http") ? url : `https://${url}`);
    return normalized.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

function normalizeCompanyName(name?: string | null) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergeCompanies(base: LinkedCompany[], additions: LinkedCompany[]) {
  const merged = [...base];

  for (const incoming of additions) {
    if (!incoming?.name && !incoming?.website) continue;
    const nameKey = normalizeCompanyName(incoming.name);
    const websiteKey = normalizeWebsite(incoming.website);

    const existingIndex = merged.findIndex(item => {
      if (!item) return false;
      const nameMatch =
        nameKey && normalizeCompanyName(item.name) === nameKey;
      const websiteMatch =
        websiteKey && normalizeWebsite(item.website) === websiteKey;
      return nameMatch || websiteMatch;
    });

    if (existingIndex >= 0) {
      const current = merged[existingIndex];
      merged[existingIndex] = {
        ...current,
        ...incoming,
        confidence: Math.max(current.confidence ?? 0, incoming.confidence ?? 0),
        isPrimary: current.isPrimary || incoming.isPrimary,
      };
    } else {
      merged.push(incoming);
    }
  }

  return merged;
}

function markPrimaryCompany(companies: LinkedCompany[], fallbackName?: string | null) {
  if (companies.some(company => company.isPrimary)) {
    return companies;
  }

  const normalizedFallback = normalizeCompanyName(fallbackName);
  const withPrimary = companies.map(company => {
    if (!company.isPrimary && normalizedFallback) {
      return {
        ...company,
        isPrimary: normalizeCompanyName(company.name) === normalizedFallback,
      };
    }
    return company;
  });

  if (!withPrimary.some(company => company.isPrimary) && withPrimary[0]) {
    withPrimary[0].isPrimary = true;
  }

  return withPrimary;
}

function collectCandidateUrls(row: LinkedInConnectionRow, llmResult: LlmProfile | null) {
  const urls = new Set<string>();
  const addUrl = (url?: string | null | unknown) => {
    if (url === null || url === undefined) return;
    const value = typeof url === "string" ? url : String(url);
    const trimmed = value.trim();
    if (!trimmed) return;
    urls.add(trimmed);
  };

  addUrl(row.linkedinUrl);
  addUrl(llmResult?.companyDetails?.website);
  (llmResult?.sources || []).forEach(source => addUrl(source));

  return Array.from(urls).filter(url => url.includes("."));
}

async function buildScrapeInsights(
  row: LinkedInConnectionRow,
  llmResult: LlmProfile | null,
): Promise<ScrapeEnrichment> {
  const candidateUrls = collectCandidateUrls(row, llmResult);
  const scraped = candidateUrls.length > 0 ? await scrapeMultiple(candidateUrls) : [];
  const scrapedText = scraped
    .map(item => item.markdown || item.content || "")
    .filter(Boolean)
    .join("\n\n");

  if (!scrapedText && (!process.env.OPENAI_API_KEY && !ENV.forgeApiKey)) {
    return { sources: candidateUrls };
  }

  if (!process.env.OPENAI_API_KEY && !ENV.forgeApiKey) {
    return { sources: candidateUrls };
  }

  const context = scrapedText
    ? scrapedText.slice(0, SCRAPE_CHAR_LIMIT)
    : [
        `Name: ${row.firstName} ${row.lastName}`.trim(),
        `Title: ${row.title || "unknown"}`,
        `Company: ${row.company || "unknown"}`,
        `LinkedIn: ${row.linkedinUrl || "unknown"}`,
      ].join("\n");

  const schema = {
    name: "scrape_enrichment",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        scrapedSummary: { type: "string" },
        facts: { type: "array", items: { type: "string" } },
        scrapedFacts: { type: "array", items: { type: "string" } },
        companies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              website: { type: "string" },
              description: { type: "string" },
              stage: { type: "string" },
              headquarters: { type: "string" },
              foundedYear: { type: "number" },
              fundingTarget: { type: "number" },
              fundingRaised: { type: "number" },
              role: { type: "string" },
              confidence: { type: "number" },
              isPrimary: { type: "boolean" },
            },
            additionalProperties: true,
          },
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
          "You are a research agent turning scraped web content into structured facts about people and their companies. Return precise facts, avoid speculation, and mark the primary/most recent company when possible.",
      },
      {
        role: "user" as const,
        content: `Person: ${row.firstName} ${row.lastName} (${row.title || "unknown title"}) at ${
          row.company || "unknown company"
        }
LinkedIn: ${row.linkedinUrl || "unknown"}
Existing summary: ${llmResult?.summary || "n/a"}
Scraped content (truncated):\n${context}`,
      },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 1200,
  });

  const rawContent = response.choices[0]?.message?.content;
  const parsed =
    typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((c: any) => c.text).join("\n") : "";

  let payload: any = {};
  try {
    payload = parsed ? JSON.parse(parsed) : {};
  } catch {
    payload = {};
  }

  return {
    summary: payload.scrapedSummary || payload.summary,
    facts: payload.scrapedFacts || payload.facts || [],
    companies: payload.companies || [],
    sources: candidateUrls,
  };
}

export async function enrichConnection(row: LinkedInConnectionRow): Promise<EnrichedConnectionProfile> {
  const baseRole = inferRole(row);
  const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  const profileId = buildProfileId(row);

  const llmResult = await runLlmEnrichment(row);
  const scrapeInsights = await buildScrapeInsights(row, llmResult);

  const accuracy = llmResult?.accuracy ?? 40;
  const role = llmResult?.role || baseRole;

  const linkedCompanies: LinkedCompany[] = [];
  if (role === "founder" || role === "operator") {
    const baseCompanyName =
      llmResult?.companyDetails?.name || row.company || `${fullName || "Connection"}'s company`;
    linkedCompanies.push({
      name: baseCompanyName,
      website: llmResult?.companyDetails?.website,
      description: llmResult?.companyDetails?.description,
      stage: llmResult?.companyDetails?.stage,
      headquarters: llmResult?.companyDetails?.headquarters,
      fundingRaised: llmResult?.companyDetails?.fundingRaised ?? undefined,
      fundingTarget: llmResult?.companyDetails?.fundingTarget ?? undefined,
      foundedYear: llmResult?.companyDetails?.foundedYear ?? undefined,
      confidence: llmResult?.classificationConfidence ?? llmResult?.accuracy ?? 60,
      role: "founder",
      isPrimary: true,
    });
  }

  if (llmResult?.companies?.length) {
    linkedCompanies.push(
      ...llmResult.companies.map(company => ({
        ...company,
        role: company.role || "founder",
      })),
    );
  }

  const mergedCompanies = markPrimaryCompany(
    mergeCompanies(linkedCompanies, scrapeInsights.companies || []),
    row.company || llmResult?.companyDetails?.name,
  );
  const primaryCompany =
    mergedCompanies.find(company => company.isPrimary) || mergedCompanies[0] || null;

  const tags = Array.from(
    new Set(
      [
        row.company,
        row.title,
        ...(llmResult?.tags || []),
        ...(llmResult?.focusAreas || []),
        ...(llmResult?.investorDetails?.pastInvestments || []),
        ...(scrapeInsights.facts || []),
      ]
        .filter(Boolean)
        .map(tag => String(tag)),
    ),
  );

  return {
    id: profileId,
    fullName: fullName || profileId,
    company: row.company || undefined,
    title: row.title || undefined,
    linkedinUrl: row.linkedinUrl || undefined,
    email: row.email || undefined,
    role,
    sector: llmResult?.sector,
    stage: llmResult?.stage,
    geography: llmResult?.geography,
    checkSizeMin: llmResult?.checkSizeMin ?? llmResult?.investorDetails?.checkSizeMin ?? null,
    checkSizeMax: llmResult?.checkSizeMax ?? llmResult?.investorDetails?.checkSizeMax ?? null,
    focusAreas: llmResult?.focusAreas,
    summary:
      llmResult?.summary ||
      `Connection from LinkedIn export (${row.title || "no title"} at ${row.company || "unknown company"})`,
    thesis: llmResult?.thesis,
    accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
    confidence: Math.max(50, Math.min(95, Math.round(accuracy || 40))),
    tags,
    sources: Array.from(
      new Set([...(llmResult?.sources || []), ...(scrapeInsights.sources || []), row.linkedinUrl].filter(Boolean) as string[]),
    ),
    notes: llmResult ? undefined : "LLM enrichment unavailable – using CSV details only",
    lastEnrichedAt: new Date().toISOString(),
    source: row,
    attachedFiles: [],
    matchStatus: "not_synced",
    companyDetails: llmResult?.companyDetails || (primaryCompany
      ? {
          name: primaryCompany.name,
          website: primaryCompany.website,
          description: primaryCompany.description,
          stage: primaryCompany.stage,
          headquarters: primaryCompany.headquarters,
          fundingRaised: primaryCompany.fundingRaised,
          fundingTarget: primaryCompany.fundingTarget,
          foundedYear: primaryCompany.foundedYear ?? undefined,
        }
      : undefined),
    investorDetails: llmResult?.investorDetails,
    linkedCompanies: mergedCompanies,
    scrapedSummary: scrapeInsights.summary,
    scrapedFacts: scrapeInsights.facts,
    scrapeSources: scrapeInsights.sources,
  };
}

export async function enrichConnectionsFromCsv(csvData: string, limit = 20) {
  const rows = parseLinkedInConnections(csvData, limit);
  const enriched: EnrichedConnectionProfile[] = [];

  for (const row of rows) {
    const profile = await enrichConnection(row);
    enriched.push(profile);
  }

  return enriched;
}
