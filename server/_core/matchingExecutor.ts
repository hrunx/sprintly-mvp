import { DEFAULT_WEIGHTS, MatchingWeights, applyTemperature, rankCompaniesForInvestor, rankInvestorsForCompany } from "./matchingService";
import { getCompanyById, getInvestorById, listAllCompanies, listAllInvestors, replaceMatch } from "../db";
import { Company, Investor } from "../../drizzle/schema";
import { loadMatchingConfig } from "./matchingConfig";

const FALLBACK_MIN_MATCH_SCORE = 40;
const MAX_MATCHES_PER_ENTITY = 25;

interface CompanyMatchOptions {
  weights?: MatchingWeights;
  investors?: Investor[];
  temperature?: number;
  limit?: number;
  persist?: boolean;
  minScore?: number;
}

interface InvestorMatchOptions {
  weights?: MatchingWeights;
  companies?: Company[];
  temperature?: number;
  limit?: number;
  persist?: boolean;
  minScore?: number;
}

function companyPassesFilters(company: Company, filters: Awaited<ReturnType<typeof loadMatchingConfig>>["filters"]) {
  if (!filters) return true;
  if (filters.minRevenue && (company.revenue ?? 0) < filters.minRevenue) return false;
  if (filters.minTeamSize && (company.teamSize ?? 0) < filters.minTeamSize) return false;
  if (filters.requirePitchDeck && !company.pitchDeckUrl) return false;
  if (filters.requireTraction) {
    const hasTraction = (company.revenue ?? 0) > 0 || (company.customers ?? 0) > 0 || (company.mrr ?? 0) > 0;
    if (!hasTraction) return false;
  }
  return true;
}

export async function generateMatchesForCompany(
  companyId: number,
  options: CompanyMatchOptions = {},
) {
  const company = await getCompanyById(companyId);
  if (!company) return { generated: 0 };

  const config = await loadMatchingConfig();
  const investors = options.investors ?? (await listAllInvestors());
  if (investors.length === 0) return { generated: 0 };

  const limit = options.limit ?? MAX_MATCHES_PER_ENTITY;
  const weights = options.weights ?? config.weights ?? DEFAULT_WEIGHTS;
  const minScore = options.minScore ?? config.thresholds?.minMatchScore ?? FALLBACK_MIN_MATCH_SCORE;

  const matches = rankInvestorsForCompany(
    company,
    investors,
    weights,
    minScore,
  )
    .map(match =>
      options.temperature ? { ...match, score: applyTemperature(match.score, options.temperature) } : match,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (options.persist !== false) {
    for (const match of matches) {
      await replaceMatch(match);
    }
  }

  return { generated: matches.length, matches };
}

export async function generateMatchesForInvestor(
  investorId: number,
  options: InvestorMatchOptions = {},
) {
  const investor = await getInvestorById(investorId);
  if (!investor) return { generated: 0 };

  const config = await loadMatchingConfig();
  const companies = (options.companies ?? (await listAllCompanies())).filter(company =>
    companyPassesFilters(company, config.filters),
  );
  if (companies.length === 0) return { generated: 0 };

  const weights = options.weights ?? config.weights ?? DEFAULT_WEIGHTS;
  const minScore = options.minScore ?? config.thresholds?.minMatchScore ?? FALLBACK_MIN_MATCH_SCORE;

  const matches = rankCompaniesForInvestor(investor, companies, weights, minScore)
    .map(match =>
      options.temperature ? { ...match, score: applyTemperature(match.score, options.temperature) } : match,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? MAX_MATCHES_PER_ENTITY);

  if (options.persist !== false) {
    for (const match of matches) {
      await replaceMatch(match);
    }
  }

  return { generated: matches.length, matches };
}
