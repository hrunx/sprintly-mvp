#!/usr/bin/env tsx
import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import { desc } from "drizzle-orm";
import { enrichConnectionsFromCsv } from "../server/_core/connections/enrichment";
import { loadConnectionProfiles, saveConnectionProfiles } from "../server/_core/connections/store";
import { EnrichedConnectionProfile } from "../server/_core/connections/types";
import { getDb, listAllCompanies, listAllInvestors } from "../server/db";
import {
  normalizeCompanyRecord,
  normalizeInvestorRecord,
  getCompanyDedupKeys,
  getInvestorDedupKeys,
} from "../server/_core/importUtils";
import { companies, investors } from "../drizzle/schema";
import { generateMatchesForCompany, generateMatchesForInvestor } from "../server/_core/matchingExecutor";

async function parseCsv(limit: number) {
  const csvPath = path.resolve("..", "Connections.csv");
  const csvData = await fs.readFile(csvPath, "utf-8");
  return enrichConnectionsFromCsv(csvData, limit);
}

async function syncProfilesToDatabase(profiles: EnrichedConnectionProfile[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Connections] Database not available, skipping DB sync");
    return { investorsAdded: 0, companiesAdded: 0, matchesGenerated: 0, profiles };
  }

  const investorsCache = await listAllInvestors();
  const companiesCache = await listAllCompanies();

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

  let investorsAdded = 0;
  let companiesAdded = 0;
  let matchesGenerated = 0;
  const updated: EnrichedConnectionProfile[] = [];

  for (const profile of profiles) {
    if (profile.role === "investor") {
      const normalized = normalizeInvestorRecord({
        name: profile.fullName,
        firm: profile.company || "Independent",
        title: profile.title,
        email: profile.email,
        linkedin: profile.linkedinUrl,
        sector: profile.sector || profile.focusAreas?.[0],
        stage: profile.stage,
        geography: profile.geography,
        checkSizeMin: profile.checkSizeMin,
        checkSizeMax: profile.checkSizeMax,
        thesis: profile.thesis || profile.summary,
        focusSectors: profile.focusAreas,
        tags: profile.tags,
      });

      const keys = getInvestorDedupKeys(normalized);
      const existingId = keys.map(key => investorKeyToId.get(key)).find(Boolean);
      if (existingId) {
        updated.push({ ...profile, investorId: existingId, matchStatus: profile.matchStatus || "synced" });
        continue;
      }

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
        keys.forEach(key => investorKeyToId.set(key, inserted.id));
        try {
          const { generated } = await generateMatchesForInvestor(inserted.id, {
            companies: companiesCache,
          });
          matchesGenerated += generated;
          updated.push({ ...profile, investorId: inserted.id, matchStatus: generated > 0 ? "matched" : "synced" });
        } catch (error) {
          console.warn("[Matching] Failed for investor", inserted.id, error);
          updated.push({ ...profile, investorId: inserted.id, matchStatus: "synced" });
        }
      }
    } else {
      const normalizedCompany = normalizeCompanyRecord({
        name: profile.company || `${profile.fullName}'s Company`,
        description: profile.summary,
        sector: profile.sector || profile.focusAreas?.[0],
        geography: profile.geography,
        stage: profile.stage,
        founderName: profile.fullName,
        founderEmail: profile.email,
        founderLinkedin: profile.linkedinUrl,
        tags: profile.tags,
      });

      const keys = getCompanyDedupKeys(normalizedCompany);
      const existingId = keys.map(key => companyKeyToId.get(key)).find(Boolean);
      if (existingId) {
        updated.push({ ...profile, companyId: existingId, matchStatus: profile.matchStatus || "synced" });
        continue;
      }

      await db.insert(companies).values({
        ...normalizedCompany,
        confidence: profile.accuracy || profile.confidence || 75,
      });
      companiesAdded++;

      const [insertedCompany] = await db.select().from(companies).orderBy(desc(companies.id)).limit(1);
      if (insertedCompany?.id) {
        keys.forEach(key => companyKeyToId.set(key, insertedCompany.id));
        try {
          const { generated } = await generateMatchesForCompany(insertedCompany.id, {
            investors: investorsCache,
          });
          matchesGenerated += generated;
          updated.push({ ...profile, companyId: insertedCompany.id, matchStatus: generated > 0 ? "matched" : "synced" });
        } catch (error) {
          console.warn("[Matching] Failed for company", insertedCompany.id, error);
          updated.push({ ...profile, companyId: insertedCompany.id, matchStatus: "synced" });
        }
      }
    }
  }

  return { investorsAdded, companiesAdded, matchesGenerated, profiles: updated };
}

async function main() {
  const limit = Number(process.env.CONNECTION_LIMIT || 20);
  console.log(`🔍 Reading first ${limit} connections from Connections.csv...`);
  const enriched: EnrichedConnectionProfile[] = await parseCsv(limit);

  console.log("💾 Saving connection profiles cache...");
  await saveConnectionProfiles(enriched);

  console.log("🗄️  Syncing to database + generating matches...");
  const result = await syncProfilesToDatabase(enriched);
  await saveConnectionProfiles(result.profiles);

  console.log(
    `✅ Done. Investors added: ${result.investorsAdded}, Companies added: ${result.companiesAdded}, Matches generated: ${result.matchesGenerated}`,
  );
}

main().catch(error => {
  console.error("❌ Failed to process connections:", error);
  process.exit(1);
});
