import { DEFAULT_WEIGHTS, MatchingWeights, rankCompaniesForInvestor, rankInvestorsForCompany } from "./matchingService";
import { getCompanyById, getInvestorById, listAllCompanies, listAllInvestors, replaceMatch } from "../db";
import { Company, Investor } from "../../drizzle/schema";

const MIN_MATCH_SCORE = 40;
const MAX_MATCHES_PER_ENTITY = 25;

interface CompanyMatchOptions {
  weights?: MatchingWeights;
  investors?: Investor[];
}

interface InvestorMatchOptions {
  weights?: MatchingWeights;
  companies?: Company[];
}

export async function generateMatchesForCompany(
  companyId: number,
  options: CompanyMatchOptions = {},
) {
  const company = await getCompanyById(companyId);
  if (!company) return { generated: 0 };

  const investors = options.investors ?? (await listAllInvestors());
  if (investors.length === 0) return { generated: 0 };

  const matches = rankInvestorsForCompany(
    company,
    investors,
    options.weights ?? DEFAULT_WEIGHTS,
    MIN_MATCH_SCORE,
  ).slice(
    0,
    MAX_MATCHES_PER_ENTITY,
  );

  for (const match of matches) {
    await replaceMatch(match);
  }

  return { generated: matches.length };
}

export async function generateMatchesForInvestor(
  investorId: number,
  options: InvestorMatchOptions = {},
) {
  const investor = await getInvestorById(investorId);
  if (!investor) return { generated: 0 };

  const companies = options.companies ?? (await listAllCompanies());
  if (companies.length === 0) return { generated: 0 };

  const matches = rankCompaniesForInvestor(
    investor,
    companies,
    options.weights ?? DEFAULT_WEIGHTS,
    MIN_MATCH_SCORE,
  ).slice(
    0,
    MAX_MATCHES_PER_ENTITY,
  );

  for (const match of matches) {
    await replaceMatch(match);
  }

  return { generated: matches.length };
}

