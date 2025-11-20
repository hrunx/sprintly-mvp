import { getDb } from './db';
import { companies, investors, matches } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { emailService } from './emailService';

/**
 * Matching Engine - Calculates compatibility scores between companies and investors
 * 
 * Six scoring factors:
 * 1. Sector alignment (0-100)
 * 2. Stage fit (0-100)
 * 3. Geography match (0-100)
 * 4. Traction requirements (0-100)
 * 5. Check size compatibility (0-100)
 * 6. Thesis alignment (0-100)
 */

export interface MatchScore {
  companyId: number;
  investorId: number;
  overallScore: number;
  sectorScore: number;
  stageScore: number;
  geographyScore: number;
  tractionScore: number;
  checkSizeScore: number;
  thesisScore: number;
  reasoning: string;
}

/**
 * Calculate sector alignment score
 */
function calculateSectorScore(companySector: string | null, investorSector: string | null): number {
  if (!companySector || !investorSector) return 50; // Neutral if missing data
  
  const companyS = companySector.toLowerCase().trim();
  const investorS = investorSector.toLowerCase();
  
  // Exact match
  if (investorS.includes(companyS)) return 100;
  
  // Partial match (related sectors)
  const sectorSynonyms: Record<string, string[]> = {
    'fintech': ['finance', 'financial', 'banking', 'payments'],
    'healthtech': ['health', 'healthcare', 'medical', 'biotech'],
    'edtech': ['education', 'learning', 'training'],
    'saas': ['software', 'b2b', 'enterprise'],
    'ecommerce': ['retail', 'marketplace', 'commerce'],
    'ai': ['artificial intelligence', 'machine learning', 'ml'],
  };
  
  for (const [key, synonyms] of Object.entries(sectorSynonyms)) {
    if (companyS.includes(key) || synonyms.some(s => companyS.includes(s))) {
      if (synonyms.some(s => investorS.includes(s)) || investorS.includes(key)) {
        return 80;
      }
    }
  }
  
  return 30; // No match
}

/**
 * Calculate stage fit score
 */
function calculateStageScore(companyStage: string | null, investorStage: string | null): number {
  if (!companyStage || !investorStage) return 50;
  
  const companyS = companyStage.toLowerCase().trim();
  const investorS = investorStage.toLowerCase();
  
  // Exact match
  if (investorS.includes(companyS)) return 100;
  
  // Stage progression logic (adjacent stages get partial credit)
  const stageOrder = ['pre-seed', 'seed', 'series a', 'series b', 'series c', 'growth'];
  const companyIdx = stageOrder.findIndex(s => companyS.includes(s));
  const investorStages = stageOrder.filter(s => investorS.includes(s));
  
  if (companyIdx >= 0 && investorStages.length > 0) {
    const distances = investorStages.map(stage => {
      const idx = stageOrder.indexOf(stage);
      return Math.abs(companyIdx - idx);
    });
    const minDistance = Math.min(...distances);
    
    if (minDistance === 0) return 100;
    if (minDistance === 1) return 70;
    if (minDistance === 2) return 40;
  }
  
  return 20;
}

/**
 * Calculate geography match score
 */
function calculateGeographyScore(companyLocation: string | null, investorGeography: string | null): number {
  if (!companyLocation || !investorGeography) return 50;
  
  const companyLoc = companyLocation.toLowerCase().trim();
  const investorGeo = investorGeography.toLowerCase();
  
  // Global investors match everyone
  if (investorGeo.includes('global') || investorGeo.includes('worldwide')) return 100;
  
  // Extract city, state, country
  const extractLocation = (loc: string) => {
    const parts = loc.split(',').map(p => p.trim());
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[parts.length - 1] || '',
    };
  };
  
  const company = extractLocation(companyLoc);
  const investor = extractLocation(investorGeo);
  
  // Same city
  if (company.city && investor.city && company.city === investor.city) return 100;
  
  // Same state/region
  if (company.state && investor.state && company.state === investor.state) return 85;
  
  // Same country
  if (company.country && investor.country && company.country === investor.country) return 70;
  
  // Continental match
  const continents: Record<string, string[]> = {
    'north america': ['usa', 'us', 'united states', 'canada', 'mexico'],
    'europe': ['uk', 'germany', 'france', 'spain', 'italy', 'netherlands'],
    'asia': ['china', 'india', 'japan', 'singapore', 'korea'],
  };
  
  for (const [continent, countries] of Object.entries(continents)) {
    const companyInContinent = countries.some(c => company.country.includes(c));
    const investorInContinent = countries.some(c => investor.country.includes(c)) || investorGeo.includes(continent);
    if (companyInContinent && investorInContinent) return 50;
  }
  
  return 30;
}

/**
 * Calculate traction score
 * Since we don't have explicit minTraction field, we infer from stage
 */
function calculateTractionScore(
  revenue: number | null,
  customers: number | null,
  investorStage: string | null
): number {
  if (!investorStage) return 70; // No requirement = good fit
  
  const stage = investorStage.toLowerCase();
  
  // Infer traction requirements from stage
  let requiredRevenue = 0;
  let requiredCustomers = 0;
  
  if (stage.includes('pre-seed') || stage.includes('idea')) {
    return 90; // Pre-revenue acceptable
  } else if (stage.includes('seed')) {
    requiredRevenue = 100000; // $100k ARR
    requiredCustomers = 100;
  } else if (stage.includes('series a')) {
    requiredRevenue = 1000000; // $1M ARR
    requiredCustomers = 1000;
  } else if (stage.includes('series b')) {
    requiredRevenue = 5000000; // $5M ARR
    requiredCustomers = 5000;
  }
  
  // Check if company meets requirements
  const revenueScore = revenue && requiredRevenue > 0 
    ? Math.min(100, (revenue / requiredRevenue) * 100)
    : 50;
    
  const customerScore = customers && requiredCustomers > 0
    ? Math.min(100, (customers / requiredCustomers) * 100)
    : 50;
  
  return Math.max(revenueScore, customerScore);
}

/**
 * Calculate check size compatibility score
 */
function calculateCheckSizeScore(
  companyFundingNeeded: number | null,
  investorMinCheck: number | null,
  investorMaxCheck: number | null
): number {
  if (!companyFundingNeeded) return 60;
  if (!investorMinCheck && !investorMaxCheck) return 70;
  
  const min = investorMinCheck || 0;
  const max = investorMaxCheck || Infinity;
  
  // Perfect fit: within range
  if (companyFundingNeeded >= min && companyFundingNeeded <= max) return 100;
  
  // Too small
  if (companyFundingNeeded < min) {
    const ratio = companyFundingNeeded / min;
    if (ratio > 0.7) return 70; // Close enough
    if (ratio > 0.5) return 50;
    return 30;
  }
  
  // Too large
  if (companyFundingNeeded > max) {
    const ratio = max / companyFundingNeeded;
    if (ratio > 0.7) return 70;
    if (ratio > 0.5) return 50;
    return 30;
  }
  
  return 50;
}

/**
 * Calculate thesis alignment score (using simple keyword matching)
 * In production, this would use embeddings/semantic search
 */
function calculateThesisScore(companyDescription: string | null, investorThesis: string | null): number {
  if (!companyDescription || !investorThesis) return 50;
  
  const desc = companyDescription.toLowerCase();
  const thesis = investorThesis.toLowerCase();
  
  // Extract keywords from thesis
  const keywords = thesis
    .split(/\s+/)
    .filter(word => word.length > 4) // Only meaningful words
    .filter(word => !['about', 'their', 'which', 'where', 'these', 'those'].includes(word));
  
  // Count keyword matches
  const matches = keywords.filter(keyword => desc.includes(keyword)).length;
  const matchRatio = keywords.length > 0 ? matches / keywords.length : 0;
  
  if (matchRatio > 0.5) return 90;
  if (matchRatio > 0.3) return 70;
  if (matchRatio > 0.1) return 50;
  
  return 30;
}

/**
 * Calculate overall match score for a company-investor pair
 */
export function calculateMatchScore(
  company: typeof companies.$inferSelect,
  investor: typeof investors.$inferSelect
): MatchScore {
  const sectorScore = calculateSectorScore(company.sector, investor.sector);
  const stageScore = calculateStageScore(company.stage, investor.stage);
  const geographyScore = calculateGeographyScore(company.location, investor.geography);
  const tractionScore = calculateTractionScore(
    company.annualRevenue,
    company.customers,
    investor.stage
  );
  const checkSizeScore = calculateCheckSizeScore(
    company.seeking,
    investor.checkSizeMin,
    investor.checkSizeMax
  );
  const thesisScore = calculateThesisScore(company.description, investor.bio);
  
  // Weighted average (adjust weights as needed)
  const weights = {
    sector: 0.25,
    stage: 0.20,
    geography: 0.15,
    traction: 0.15,
    checkSize: 0.15,
    thesis: 0.10,
  };
  
  const overallScore = Math.round(
    sectorScore * weights.sector +
    stageScore * weights.stage +
    geographyScore * weights.geography +
    tractionScore * weights.traction +
    checkSizeScore * weights.checkSize +
    thesisScore * weights.thesis
  );
  
  // Generate reasoning
  const reasons: string[] = [];
  if (sectorScore >= 80) reasons.push('Strong sector alignment');
  if (stageScore >= 80) reasons.push('Perfect stage fit');
  if (geographyScore >= 80) reasons.push('Geographic proximity');
  if (tractionScore >= 80) reasons.push('Meets traction requirements');
  if (checkSizeScore >= 80) reasons.push('Check size compatible');
  if (thesisScore >= 70) reasons.push('Thesis alignment');
  
  if (reasons.length === 0) {
    if (overallScore >= 60) reasons.push('Moderate overall fit');
    else reasons.push('Limited alignment');
  }
  
  const reasoning = reasons.join('; ');
  
  return {
    companyId: company.id,
    investorId: investor.id,
    overallScore,
    sectorScore: Math.round(sectorScore),
    stageScore: Math.round(stageScore),
    geographyScore: Math.round(geographyScore),
    tractionScore: Math.round(tractionScore),
    checkSizeScore: Math.round(checkSizeScore),
    thesisScore: Math.round(thesisScore),
    reasoning,
  };
}

/**
 * Run matching engine for all companies and investors
 */
export async function runMatchingEngine(): Promise<{ created: number; updated: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Fetch all companies and investors
  const allCompanies = await db.select().from(companies);
  const allInvestors = await db.select().from(investors);
  
  console.log(`Running matching engine: ${allCompanies.length} companies × ${allInvestors.length} investors`);
  
  let created = 0;
  let updated = 0;
  
  // Calculate matches for each company-investor pair
  for (const company of allCompanies) {
    for (const investor of allInvestors) {
      const score = calculateMatchScore(company, investor);
      
      // Only save matches with score >= 40 (configurable threshold)
      if (score.overallScore >= 40) {
        // Check if match already exists
        const existing = await db
          .select()
          .from(matches)
          .where(eq(matches.companyId, company.id))
          .limit(1);
        
        const matchData = {
          companyId: company.id,
          investorId: investor.id,
          overallScore: score.overallScore,
          sectorScore: score.sectorScore,
          stageScore: score.stageScore,
          geoScore: score.geographyScore,
          tractionScore: score.tractionScore,
          checkSizeScore: score.checkSizeScore,
          thesisScore: score.thesisScore,
          matchReasons: score.reasoning,
        };
        
        if (existing.length > 0) {
          // Update existing match
          await db.update(matches)
            .set(matchData)
            .where(eq(matches.id, existing[0].id));
          updated++;
        } else {
          // Create new match
          await db.insert(matches).values(matchData);
          created++;
          
          // Send email notification for high-quality matches (80%+)
          if (score.overallScore >= 80) {
            await emailService.sendMatchNotification({
              companyName: company.name,
              investorName: investor.name,
              investorEmail: investor.email || 'N/A',
              matchScore: score.overallScore,
              sectorScore: score.sectorScore,
              stageScore: score.stageScore,
              geoScore: score.geographyScore,
              tractionScore: score.tractionScore,
              checkSizeScore: score.checkSizeScore,
              thesisScore: score.thesisScore,
              matchReasons: score.reasoning,
            });
          }
        }
      }
    }
  }
  
  console.log(`Matching complete: ${created} created, ${updated} updated`);
  
  return { created, updated };
}
