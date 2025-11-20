import { describe, expect, it } from "vitest";
import { calculateMatchScore, rankInvestorsForCompany, DEFAULT_WEIGHTS, buildMatchRecord } from "../matchingService";
import type { Company, Investor } from "../../../drizzle/schema";

const baseCompany: Company = {
  id: 1,
  name: "TestCo",
  description: "AI software for supply chain optimization",
  sector: "AI/ML",
  subSector: null,
  stage: "Series A",
  geography: "San Francisco, CA",
  foundedYear: 2020,
  teamSize: 25,
  fundingRound: "Series A",
  fundingTarget: 5000000,
  fundingRaised: 2000000,
  valuation: null,
  revenue: 2500000,
  revenueGrowth: 80,
  customers: 40,
  mrr: 200000,
  businessModel: "B2B SaaS",
  targetMarket: null,
  competitiveAdvantage: null,
  pitchDeckUrl: null,
  pitchDeckAnalysis: null,
  websiteUrl: null,
  logoUrl: null,
  founderName: null,
  founderEmail: null,
  founderLinkedin: null,
  tags: null,
  confidence: 90,
  lastInteraction: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseInvestor: Investor = {
  id: 10,
  name: "Vision Capital",
  type: "VC",
  firm: "Vision Capital",
  title: "Partner",
  bio: null,
  sector: "AI/ML",
  subSector: null,
  stage: "Series A",
  geography: "San Francisco, CA",
  checkSizeMin: 3000000,
  checkSizeMax: 7000000,
  thesis: "Investing in AI companies improving supply chains",
  portfolioCompanies: null,
  notableInvestments: null,
  investmentCount: 30,
  email: null,
  linkedinUrl: null,
  websiteUrl: null,
  avatarUrl: null,
  tags: null,
  confidence: 90,
  lastInteraction: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("matchingService", () => {
  it("calculates weighted match scores respecting the formula", () => {
    const result = calculateMatchScore(baseCompany, baseInvestor, DEFAULT_WEIGHTS);
    const sector = result.breakdown.find(item => item.key === "sector")!;
    const stage = result.breakdown.find(item => item.key === "stage")!;

    expect(sector.score).toBe(100);
    expect(stage.score).toBe(100);
    expect(result.score).toBeGreaterThan(80);
  });

  it("downgrades scores when company needs exceed investor check size", () => {
    const largeRoundCompany: Company = { ...baseCompany, fundingTarget: 30000000 };
    const result = calculateMatchScore(largeRoundCompany, baseInvestor, DEFAULT_WEIGHTS);
    const checkSize = result.breakdown.find(item => item.key === "checkSize")!;

    expect(checkSize.score).toBeLessThan(60);
    expect(result.score).toBeLessThan(80);
  });

  it("ranks investors and filters by minimum score", () => {
    const lowFitInvestor: Investor = {
      ...baseInvestor,
      id: 11,
      sector: "ClimateTech",
      stage: "Seed",
      geography: "New York, NY",
    };

    const matches = rankInvestorsForCompany(baseCompany, [baseInvestor, lowFitInvestor], DEFAULT_WEIGHTS, 60);
    expect(matches).toHaveLength(1);
    expect(matches[0].investorId).toBe(baseInvestor.id);
  });

  it("generates dynamic explanations referencing top factors", () => {
    const match = buildMatchRecord(baseCompany, baseInvestor, DEFAULT_WEIGHTS);
    expect(match.explanation).toBeTruthy();
    expect(match.explanation).toContain("sector alignment");
    expect(match.explanation).toMatch(/This is a .* match/);
  });

  it("describes funding alignment direction correctly", () => {
    const company: Company = { ...baseCompany, fundingTarget: 12000000 };
    const investor: Investor = { ...baseInvestor, checkSizeMin: 1000000, checkSizeMax: 3000000 };
    const match = buildMatchRecord(company, investor, DEFAULT_WEIGHTS);
    expect(match.explanation).toContain("below this round");
  });
});

