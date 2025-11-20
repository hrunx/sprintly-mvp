import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { runMatchingEngine } from './matchingEngine';
import { getDb } from './db';
import { matches, companies, investors } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const matchingRouter = router({
  /**
   * Run the matching engine manually
   */
  runEngine: protectedProcedure.mutation(async () => {
    const result = await runMatchingEngine();
    return {
      success: true,
      ...result,
    };
  }),

  /**
   * Get all matches with company and investor details
   */
  getMatches: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        minScore: z.number().optional().default(40),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const allMatches = await db
        .select()
        .from(matches)
        .orderBy(desc(matches.overallScore))
        .limit(input.limit);

      // Fetch company and investor details for each match
      const matchesWithDetails = await Promise.all(
        allMatches
          .filter((m) => m.overallScore >= input.minScore)
          .map(async (match) => {
            const [company] = await db
              .select()
              .from(companies)
              .where(eq(companies.id, match.companyId))
              .limit(1);

            const [investor] = await db
              .select()
              .from(investors)
              .where(eq(investors.id, match.investorId))
              .limit(1);

            return {
              ...match,
              company,
              investor,
            };
          })
      );

      return matchesWithDetails;
    }),

  /**
   * Get matches for a specific company
   */
  getCompanyMatches: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const companyMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.companyId, input.companyId))
        .orderBy(desc(matches.overallScore));

      // Fetch investor details
      const matchesWithInvestors = await Promise.all(
        companyMatches.map(async (match) => {
          const [investor] = await db
            .select()
            .from(investors)
            .where(eq(investors.id, match.investorId))
            .limit(1);

          return {
            ...match,
            investor,
          };
        })
      );

      return matchesWithInvestors;
    }),

  /**
   * Get matches for a specific investor
   */
  getInvestorMatches: publicProcedure
    .input(z.object({ investorId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const investorMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.investorId, input.investorId))
        .orderBy(desc(matches.overallScore));

      // Fetch company details
      const matchesWithCompanies = await Promise.all(
        investorMatches.map(async (match) => {
          const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.id, match.companyId))
            .limit(1);

          return {
            ...match,
            company,
          };
        })
      );

      return matchesWithCompanies;
    }),

  /**
   * Get detailed match breakdown for a specific company-investor pair
   */
  getMatchDetail: publicProcedure
    .input(
      z.object({
        companyId: z.number(),
        investorId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.companyId, input.companyId))
        .limit(1);

      if (!match) return null;

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      const [investor] = await db
        .select()
        .from(investors)
        .where(eq(investors.id, input.investorId))
        .limit(1);

      return {
        ...match,
        company,
        investor,
      };
    }),
});
