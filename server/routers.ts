import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { authRouter } from "./authRouter";
import { matchingRouter } from "./matchingRouter";
import { csvRouter } from "./csvRouter";
import { runMatchingEngine } from "./matchingEngine";
import * as db from "./db";
import { getDb } from "./db";
import { introRequests } from "../drizzle/schema";

export const appRouter = router({
  // Authentication
  auth: authRouter,

  // Companies
  companies: router({
    list: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        stage: z.string().optional(),
        location: z.string().optional(),
        minRevenue: z.number().optional(),
        maxSeeking: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (!input || Object.keys(input).length === 0) {
          return db.getAllCompanies();
        }
        return db.searchCompanies(input);
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCompanyById(input.id);
      }),
  }),

  // Investors
  investors: router({
    list: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        stage: z.string().optional(),
        geography: z.string().optional(),
        minCheckSize: z.number().optional(),
        maxCheckSize: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (!input || Object.keys(input).length === 0) {
          return db.getAllInvestors();
        }
        return db.searchInvestors(input);
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getInvestorById(input.id);
      }),
  }),

  // Matching Engine
  matching: matchingRouter,

  // Matches
  matches: router({
    list: publicProcedure
      .input(z.object({
        companyId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getTopMatches(input?.companyId, input?.limit);
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchById(input.id);
      }),
  }),

  // Analytics
  analytics: router({
    overview: publicProcedure.query(async () => {
      return db.getAnalytics();
    }),
  }),

  // Settings
  settings: router({
    getConfig: protectedProcedure.query(async () => {
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
    
    saveConfig: protectedProcedure
      .input(z.object({
        weights: z.object({
          sector: z.number(),
          stage: z.number(),
          geography: z.number(),
          traction: z.number(),
          checkSize: z.number(),
          thesis: z.number(),
        }).optional(),
        filters: z.any().optional(),
        thresholds: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),

  // CSV Upload (new)
  csv: csvRouter,

  // CSV Import (legacy)
  import: router({
    parseCompaniesCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV must have headers and data' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const companies = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const company: any = {};
          
          headers.forEach((header, idx) => {
            const value = values[idx] || '';
            if (header === 'Company Name') company.name = value;
            if (header === 'Website') company.website = value;
            if (header === 'Description') company.description = value;
            if (header === 'Industry') company.sector = value;
            if (header === 'Location') company.location = value;
            if (header === 'Founded Year') company.founded = parseInt(value) || new Date().getFullYear();
            if (header === 'Funding Stage') company.stage = value;
            if (header === 'Founder Name') company.founderName = value;
            if (header === 'Founder Email') company.founderEmail = value;
          });
          
          if (company.name) companies.push(company);
        }
        
        // Save companies to database
        const database = await getDb();
        if (database) {
          const { companies: companiesTable } = await import('../drizzle/schema');
          for (const company of companies) {
            await database.insert(companiesTable).values(company);
          }
        }
        
        // Trigger matching engine after import
        setTimeout(() => runMatchingEngine().catch(console.error), 1000);
        
        return { companies, total: companies.length };
      }),
    
    parseInvestorsCSV: protectedProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV must have headers and data' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const investors = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const investor: any = {};
          
          headers.forEach((header, idx) => {
            const value = values[idx] || '';
            if (header === 'Full Name') investor.name = value;
            if (header === 'Company') investor.firm = value;
            if (header === 'Email') investor.email = value;
            if (header === 'LinkedIn URL') investor.linkedIn = value;
            if (header === 'Location') investor.geography = value;
          });
          
          if (investor.name) investors.push(investor);
        }
        
        // Save investors to database
        const database = await getDb();
        if (database) {
          const { investors: investorsTable } = await import('../drizzle/schema');
          for (const investor of investors) {
            await database.insert(investorsTable).values(investor);
          }
        }
        
        // Trigger matching engine after import
        setTimeout(() => runMatchingEngine().catch(console.error), 1000);
        
        return { investors, total: investors.length };
      }),
  }),
  
  introRequests: router({
    create: protectedProcedure
      .input(z.object({ companyId: z.number(), investorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        await db.insert(introRequests).values({
          companyId: input.companyId,
          investorId: input.investorId,
          requesterId: ctx.user.id,
          status: 'pending',
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
