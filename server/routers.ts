import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
