import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb, listAllCompanies, listAllInvestors } from "./db";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { companies, investors, introRequests, matches, connections } from "../drizzle/schema";
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
import { parseLinkedInConnections, enrichConnection } from "./_core/connections/enrichment";
import { loadConnectionProfiles, saveConnectionProfiles, upsertProfile } from "./_core/connections/store";
import { EnrichedConnectionProfile } from "./_core/connections/types";

const LINKEDIN_EXPORT_PATH = path.resolve(process.cwd(), "../Connections.csv");

const normalizeDataUrl = (payload: string, mimeType: string) => {
  const cleaned = payload.startsWith("data:")
    ? payload.split(",").slice(1).join(",")
    : payload;
  return `data:${mimeType};base64,${cleaned}`;
};

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

  for (const profile of updatedProfiles) {
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
        profile.investorId = existingId;
        profile.matchStatus = profile.matchStatus || "synced";
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
        profile.investorId = inserted.id;
        profile.matchStatus = "synced";
        keys.forEach(key => investorKeyToId.set(key, inserted.id));
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
    } else if (profile.role === "founder") {
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
        profile.companyId = existingId;
        profile.matchStatus = profile.matchStatus || "synced";
        continue;
      }

      await db.insert(companies).values({
        ...normalizedCompany,
        confidence: profile.accuracy || profile.confidence || 75,
      });
      companiesAdded++;

      const [insertedCompany] = await db.select().from(companies).orderBy(desc(companies.id)).limit(1);
      if (insertedCompany?.id) {
        profile.companyId = insertedCompany.id;
        profile.matchStatus = "synced";
        keys.forEach(key => companyKeyToId.set(key, insertedCompany.id));
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
      return loadConnectionProfiles();
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

        let merged = await loadConnectionProfiles();
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
        const profiles = await loadConnectionProfiles();
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
        let profiles = await loadConnectionProfiles();
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
        let profiles = await loadConnectionProfiles();
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
    getMatchingConfig: protectedProcedure.query(async ({ ctx }) => {
      // Return default config for now (will implement DB storage later)
      return {
        weights: {
          sector: 25,
          stage: 20,
          geography: 10,
          traction: 20,
          checkSize: 15,
          thesis: 10,
        },
        filters: {
          minRevenue: 0,
          minTeamSize: 0,
          requirePitchDeck: false,
          requireTraction: false,
        },
        thresholds: {
          minMatchScore: 50,
          minSectorScore: 60,
          minStageScore: 50,
        },
      };
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
      .mutation(async ({ input, ctx }) => {
        // For now, just return success (will implement DB storage later)
        return { success: true };
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

        await db.insert(introRequests).values({
          companyId: input.companyId,
          investorId: input.investorId,
          requestedBy: ctx.user.id,
          connectionId: input.connectionId,
          message: input.message,
          status: "pending",
        });

        return { success: true, message: "Introduction request sent!" };
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
