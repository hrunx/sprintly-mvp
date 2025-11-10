import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
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

  // Entity management
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
        const { getEntities } = await import("./db");
        return getEntities(input);
      }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getEntityById } = await import("./db");
        return getEntityById(input.id);
      }),
    
    connections: publicProcedure
      .input(z.object({ entityId: z.number() }))
      .query(async ({ input }) => {
        const { getEntityConnections } = await import("./db");
        return getEntityConnections(input.entityId);
      }),
  }),

  // Matching engine
  matching: router({
    findMatches: publicProcedure
      .input(z.object({
        sector: z.string().optional(),
        stage: z.string().optional(),
        geography: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { findMatches } = await import("./db");
        return findMatches(input);
      }),
    
    founderMatches: publicProcedure
      .input(z.object({
        founderId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getFounderMatches } = await import("./db");
        return getFounderMatches(input.founderId, input.limit);
      }),
    
    introPath: publicProcedure
      .input(z.object({
        sourceId: z.number(),
        targetId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getIntroPath } = await import("./db");
        return getIntroPath(input.sourceId, input.targetId);
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
  }),
});

export type AppRouter = typeof appRouter;
