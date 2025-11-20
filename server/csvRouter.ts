import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { parse } from 'csv-parse/sync';
import { getDb } from './db';
import { companies, investors } from '../drizzle/schema';
import { runMatchingEngine } from './matchingEngine';

export const csvRouter = router({
  /**
   * Upload companies from CSV
   */
  uploadCompanies: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      try {
        // Parse CSV
        const records: any[] = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        if (records.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV file is empty' });
        }

        // Insert companies
        const insertedCompanies: any[] = [];
        for (const record of records) {
          const companyData = {
            name: record.name || record.Name || '',
            description: record.description || record.Description || null,
            website: record.website || record.Website || null,
            sector: record.sector || record.Sector || null,
            stage: record.stage || record.Stage || null,
            location: record.location || record.Location || null,
            founded: record.founded ? (parseInt(record.founded) || null) : null,
            teamSize: record.teamSize || record['Team Size'] ? (parseInt(record.teamSize || record['Team Size']) || null) : null,
            businessModel: record.businessModel || record['Business Model'] || null,
            fundingRound: record.fundingRound || record['Funding Round'] || null,
            seeking: record.seeking || record.Seeking ? (parseInt(record.seeking || record.Seeking) || null) : null,
            alreadyRaised: record.alreadyRaised || record['Already Raised'] ? (parseInt(record.alreadyRaised || record['Already Raised']) || null) : null,
            valuation: record.valuation || record.Valuation ? (parseInt(record.valuation || record.Valuation) || null) : null,
            annualRevenue: record.annualRevenue || record['Annual Revenue'] ? (parseInt(record.annualRevenue || record['Annual Revenue']) || null) : null,
            revenueGrowth: record.revenueGrowth || record['Revenue Growth'] ? (parseInt(record.revenueGrowth || record['Revenue Growth']) || null) : null,
            customers: record.customers || record.Customers ? (parseInt(record.customers || record.Customers) || null) : null,
            mrr: record.mrr || record.MRR ? (parseInt(record.mrr || record.MRR) || null) : null,
            founderName: record.founderName || record['Founder Name'] || null,
            founderEmail: record.founderEmail || record['Founder Email'] || null,
            founderLinkedIn: record.founderLinkedIn || record['Founder LinkedIn'] || null,
            pitchDeckUrl: record.pitchDeckUrl || record['Pitch Deck URL'] || null,
          };

          const [result] = await db.insert(companies).values(companyData);
          insertedCompanies.push({ id: result.insertId, ...companyData });
        }

        return {
          success: true,
          count: insertedCompanies.length,
          companies: insertedCompanies,
        };
      } catch (error) {
        console.error('[CSV Upload] Error uploading companies:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload companies',
        });
      }
    }),

  /**
   * Upload investors from CSV
   */
  uploadInvestors: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      try {
        // Parse CSV
        const records: any[] = parse(input.csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        if (records.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV file is empty' });
        }

        // Insert investors
        const insertedInvestors: any[] = [];
        for (const record of records) {
          const investorData = {
            name: record.name || record.Name || '',
            type: record.type || record.Type || null,
            firm: record.firm || record.Firm || null,
            bio: record.bio || record.Bio || null,
            sector: record.sector || record.Sector || null,
            stage: record.stage || record.Stage || null,
            geography: record.geography || record.Geography || null,
            checkSizeMin: record.checkSizeMin || record['checkSizeMin'] || record['Check Size Min'] ? (parseInt(record.checkSizeMin || record['checkSizeMin'] || record['Check Size Min']) || null) : null,
            checkSizeMax: record.checkSizeMax || record['checkSizeMax'] || record['Check Size Max'] ? (parseInt(record.checkSizeMax || record['checkSizeMax'] || record['Check Size Max']) || null) : null,
            email: record.email || record.Email || null,
            linkedIn: record.linkedIn || record.LinkedIn || null,
            website: record.website || record.Website || null,
          };

          const [result] = await db.insert(investors).values(investorData);
          insertedInvestors.push({ id: result.insertId, ...investorData });
        }

        // Auto-trigger matching after investor upload
        console.log('[CSV Upload] Auto-triggering matching engine...');
        const matchingResult = await runMatchingEngine();
        console.log(`[CSV Upload] Matching complete: ${matchingResult.created} matches created`);

        return {
          success: true,
          count: insertedInvestors.length,
          investors: insertedInvestors,
          matchingResult,
        };
      } catch (error) {
        console.error('[CSV Upload] Error uploading investors:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload investors',
        });
      }
    }),
});
