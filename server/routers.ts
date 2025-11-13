import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { companies, investors, introRequests, matches, connections } from "../drizzle/schema";

export const appRouter = router({
  import: router({
    parseCompaniesCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const companies = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim());
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
            
            companies.push(company);
          } catch (error: any) {
            errors.push({ row: i + 1, error: error.message });
          }
        }
        
        return { companies, errors, total: lines.length - 1 };
      }),
      
    parseInvestorsCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const investors = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim());
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
            
            investors.push(investor);
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
        
        let imported = 0;
        const errors = [];
        
        for (const company of input.companies) {
          try {
            await db.insert(companies).values({
              ...company,
              businessModel: company.businessModel || 'B2B SaaS',
              customers: company.customers || 0,
              mrr: company.mrr || 0,
              confidence: 85
            });
            imported++;
          } catch (error: any) {
            errors.push({ company: company.name, error: error.message });
          }
        }
        
        return { imported, errors, total: input.companies.length };
      }),
      
    importInvestors: protectedProcedure
      .input(z.object({ investors: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        let imported = 0;
        const errors = [];
        
        for (const investor of input.investors) {
          try {
            await db.insert(investors).values({
              ...investor,
              type: 'VC',
              confidence: 85
            });
            imported++;
          } catch (error: any) {
            errors.push({ investor: investor.name, error: error.message });
          }
        }
        
        return { imported, errors, total: input.investors.length };
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
