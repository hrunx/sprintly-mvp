import { Company, InsertMatch, Investor } from "../../drizzle/schema";

export interface MatchingWeights {
  sector: number;
  stage: number;
  traction: number;
  checkSize: number;
  geography: number;
  thesis: number;
}

export interface MatchBreakdownItem {
  key: keyof MatchingWeights;
  score: number;
  weight: number;
  contribution: number;
  reason: string;
}

export interface MatchComputationResult {
  score: number;
  breakdown: MatchBreakdownItem[];
  reasons: string[];
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  sector: 25,
  stage: 20,
  traction: 20,
  checkSize: 15,
  geography: 10,
  thesis: 10,
};

const STAGE_ORDER = [
  "pre-seed",
  "seed",
  "series a",
  "series b",
  "series c",
  "series d",
  "growth",
  "late stage",
];

const STAGE_TARGETS: Record<string, number> = {
  "pre-seed": 100_000,
  seed: 500_000,
  "series a": 3_000_000,
  "series b": 12_000_000,
  "series c": 30_000_000,
  "series d": 50_000_000,
  growth: 80_000_000,
  "late stage": 150_000_000,
};

const REGION_MAP: Record<string, string> = {
  "north america": "americas",
  usa: "americas",
  "united states": "americas",
  canada: "americas",
  "latin america": "americas",
  mexico: "americas",
  europe: "emea",
  "middle east": "emea",
  mena: "emea",
  "united kingdom": "emea",
  germany: "emea",
  france: "emea",
  africa: "emea",
  nigeria: "emea",
  kenya: "emea",
  "asia": "apac",
  "asia pacific": "apac",
  india: "apac",
  china: "apac",
  singapore: "apac",
  japan: "apac",
  australia: "apac",
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function toTokenSet(input?: string | null) {
  if (!input) return new Set<string>();
  return new Set(
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function parseListField(field?: string | string[] | null) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return parsed.split(",").map(item => item.trim());
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed)
        .flat()
        .map(value => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean);
    }
  } catch {
    // ignore
  }
  return field.split(",").map(item => item.trim());
}

function normalizeKeyword(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[\s/&_]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const RAW_KEYWORD_SYNONYMS: Record<string, string[]> = {
  ai: ["artificial intelligence", "machine intelligence", "ai/ml", "machine learning"],
  "ai ml": ["ai", "machine learning", "artificial intelligence"],
  "machine learning": ["ml", "artificial intelligence", "ai"],
  ml: ["machine learning", "artificial intelligence", "ai"],
  fintech: [
    "financial technology",
    "finance technology",
    "financial services technology",
    "payments",
    "fintech",
  ],
  "financial services": ["finserv", "banking", "fintech"],
  ecommerce: ["e-commerce", "online retail", "digital commerce"],
  "e commerce": ["ecommerce", "online retail", "digital commerce"],
  healthtech: ["digital health", "health care technology", "healthcare"],
  healthcare: ["health tech", "healthtech", "digital health"],
  biotech: ["biotechnology", "life sciences"],
  climatetech: ["climate tech", "clean tech", "cleantech", "sustainability"],
  cleantech: ["climate tech", "sustainability"],
  saas: ["software as a service", "cloud software", "b2b software"],
  "software as a service": ["saas", "cloud software"],
  b2b: ["business to business"],
  b2c: ["business to consumer"],
  marketplace: ["platform", "two sided marketplace"],
};

const KEYWORD_SYNONYM_LOOKUP: Record<string, Set<string>> = {};

Object.entries(RAW_KEYWORD_SYNONYMS).forEach(([root, synonyms]) => {
  const normalizedRoot = normalizeKeyword(root);
  if (!normalizedRoot) return;
  const group = new Set<string>();
  group.add(normalizedRoot);

  synonyms.forEach(term => {
    const normalized = normalizeKeyword(term);
    if (normalized) group.add(normalized);
  });

  group.forEach(term => {
    KEYWORD_SYNONYM_LOOKUP[term] = new Set(group);
  });
});

function expandKeywords(keyword: string) {
  const expanded = new Set<string>();
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return expanded;

  expanded.add(normalized);

  const synonyms = KEYWORD_SYNONYM_LOOKUP[normalized];
  synonyms?.forEach(term => expanded.add(term));

  // Add slash-delimited variants (e.g., ai/ml)
  normalized.split(/[\s-]/).forEach(part => {
    const clean = normalizeKeyword(part);
    if (clean && clean.length >= 2) {
      expanded.add(clean);
      KEYWORD_SYNONYM_LOOKUP[clean]?.forEach(term => expanded.add(term));
    }
  });

  return expanded;
}

function buildKeywordList(
  values: Array<string | string[] | null | undefined>,
): string[] {
  const keywords = new Set<string>();

  values.forEach(value => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(item => {
        const normalized = normalizeKeyword(item);
        if (normalized) {
          expandKeywords(normalized).forEach(term => keywords.add(term));
        }
      });
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          const normalized = normalizeKeyword(item);
          if (normalized) {
            expandKeywords(normalized).forEach(term => keywords.add(term));
          }
        });
        return;
      }
    } catch {
      // ignore JSON parse errors for plain strings
    }

    value
      .split(/[,;]/)
      .map(item => normalizeKeyword(item))
      .filter(Boolean)
      .forEach(keyword => {
        expandKeywords(keyword).forEach(term => keywords.add(term));
      });
  });

  return Array.from(keywords);
}

function keywordOverlapRatio(listA: string[], listB: string[]) {
  if (!listA.length || !listB.length) return 0;
  const setA = new Set(listA);
  const setB = new Set(listB);
  let matches = 0;

  setA.forEach(keyword => {
    if (setB.has(keyword)) matches++;
  });

  const normalizer = Math.min(setA.size, setB.size) || 1;
  return matches / normalizer;
}

function buildTokenSetFromKeywords(keywords: string[]) {
  const tokens = new Set<string>();
  keywords.forEach(keyword => {
    keyword.split(" ").forEach(part => {
      const normalized = normalizeKeyword(part);
      if (normalized && normalized.length >= 2) {
        tokens.add(normalized);
      }
    });
  });
  return tokens;
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach(value => {
    if (setB.has(value)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function numericScoreFromRatio(ratio: number) {
  if (ratio >= 1) return 100;
  if (ratio <= 0) return 0;
  return Math.round(ratio * 100);
}

function buildTokenSet(sources: Array<Set<string> | string[]>) {
  const combined = new Set<string>();
  sources.forEach(source => {
    if (source instanceof Set) {
      source.forEach(token => {
        if (token) combined.add(token);
      });
    } else {
      source.forEach(token => {
        const normalized = token?.toLowerCase();
        if (normalized) combined.add(normalized);
      });
    }
  });
  return combined;
}

function calculateSectorScore(company: Company, investor: Investor): MatchBreakdownItem {
  const companyKeywords = buildKeywordList([
    company.sector,
    company.subSector,
    parseListField(company.tags),
  ]);
  const investorKeywords = buildKeywordList([
    investor.sector,
    investor.subSector,
    parseListField(investor.tags),
  ]);

  const companyTokens = buildTokenSetFromKeywords(companyKeywords);
  const investorTokens = buildTokenSetFromKeywords(investorKeywords);

  const tokenOverlap = jaccardSimilarity(companyTokens, investorTokens);
  const keywordOverlap = keywordOverlapRatio(companyKeywords, investorKeywords);

  const combinedSimilarity = tokenOverlap * 0.6 + keywordOverlap * 0.4;
  const score = numericScoreFromRatio(combinedSimilarity);

  let reason = "No sector data available";

  if (!companyKeywords.length && !investorKeywords.length) {
    reason = "No sector data available";
  } else if (!companyKeywords.length || !investorKeywords.length) {
    reason = "Incomplete sector data for comparison";
  } else if (score >= 85) reason = "Excellent keyword alignment";
  else if (score >= 65) reason = "Strong overlapping keywords";
  else if (score >= 45) reason = "Partial sector overlap";
  else reason = "Limited keyword overlap";

  return {
    key: "sector",
    score,
    weight: DEFAULT_WEIGHTS.sector,
    contribution: 0,
    reason,
  };
}

function calculateStageScore(company: Company, investor: Investor): MatchBreakdownItem {
  const companyStage = normalize(company.stage);
  const investorStage = normalize(investor.stage);

  let score = 0;
  let reason = "Stage data incomplete";

  if (companyStage && investorStage) {
    const companyIndex = STAGE_ORDER.indexOf(companyStage);
    const investorIndex = STAGE_ORDER.indexOf(investorStage);

    if (companyIndex === -1 || investorIndex === -1) {
      score = 55;
      reason = "Unmapped stage, partial confidence";
    } else {
      const delta = Math.abs(companyIndex - investorIndex);
      if (delta === 0) {
        score = 100;
        reason = "Ideal stage focus";
      } else if (delta === 1) {
        score = 85;
        reason = "Adjacent stage focus";
      } else if (delta === 2) {
        score = 60;
        reason = "Stage slightly outside mandate";
      } else {
        score = 25;
        reason = "Stage far from investor focus";
      }
    }
  }

  return {
    key: "stage",
    score,
    weight: DEFAULT_WEIGHTS.stage,
    contribution: 0,
    reason,
  };
}

function calculateTractionScore(company: Company): MatchBreakdownItem {
  const revenue = company.revenue ?? 0;
  const revenueGrowth = company.revenueGrowth ?? 0;
  const customers = company.customers ?? 0;
  const stageTarget = STAGE_TARGETS[normalize(company.stage)] || 500_000;

  const revenueRatio = Math.min(revenue / stageTarget, 2);
  const growthRatio = Math.min(revenueGrowth / 100, 2);
  const customerRatio = Math.min(customers / 1000, 2);

  const score = Math.round(
    (numericScoreFromRatio(revenueRatio / 2) * 0.5) +
      (numericScoreFromRatio(growthRatio / 2) * 0.3) +
      (numericScoreFromRatio(customerRatio / 2) * 0.2),
  );

  let reason = "Limited traction data";
  if (score >= 80) reason = "Outstanding traction vs. stage benchmarks";
  else if (score >= 60) reason = "Healthy traction relative to stage";
  else if (score >= 40) reason = "Developing traction metrics";
  else reason = "Traction below stage benchmarks";

  return {
    key: "traction",
    score,
    weight: DEFAULT_WEIGHTS.traction,
    contribution: 0,
    reason,
  };
}

function calculateCheckSizeScore(company: Company, investor: Investor): MatchBreakdownItem {
  const target = company.fundingTarget ?? 0;
  const min = investor.checkSizeMin ?? 0;
  const max = investor.checkSizeMax ?? 0;

  let score = 0;
  let reason = "Missing check size information";

  if (target > 0 && (min > 0 || max > 0)) {
    const lowerBound = min || target;
    const upperBound = max || target;

    if (target >= lowerBound && target <= upperBound) {
      score = 100;
      reason = "Funding needs inside this investor's check size";
    } else {
      const distance =
        target < lowerBound ? lowerBound - target : target > upperBound ? target - upperBound : 0;
      const tolerance = Math.max(upperBound, target, 1);
      const ratio = Math.max(0, 1 - distance / tolerance);
      score = Math.round(20 + ratio * 80);
      reason = "Funding round slightly outside typical check size";
    }
  } else if (target > 0) {
    score = 40;
    reason = "Company shared funding needs but investor range unknown";
  }

  return {
    key: "checkSize",
    score,
    weight: DEFAULT_WEIGHTS.checkSize,
    contribution: 0,
    reason,
  };
}

function calculateGeoScore(company: Company, investor: Investor): MatchBreakdownItem {
  const companyGeo = normalize(company.geography);
  const investorGeo = normalize(investor.geography);

  let score = 0;
  let reason = "No geography data";

  const normalizeRegion = (value: string) => REGION_MAP[value] || value;

  if (companyGeo && investorGeo) {
    if (companyGeo === investorGeo) {
      score = 100;
      reason = "Exact geography match";
    } else {
      const companyRegion = normalizeRegion(companyGeo);
      const investorRegion = normalizeRegion(investorGeo);
      if (companyRegion && investorRegion && companyRegion === investorRegion) {
        score = 80;
        reason = "Same macro region";
      } else if (
        companyGeo.split(",").some(part => investorGeo.includes(part.trim())) ||
        investorGeo.split(",").some(part => companyGeo.includes(part.trim()))
      ) {
        score = 60;
        reason = "Partial geographic overlap";
      } else {
        score = 30;
        reason = "Minimal geographic overlap";
      }
    }
  }

  return {
    key: "geography",
    score,
    weight: DEFAULT_WEIGHTS.geography,
    contribution: 0,
    reason,
  };
}

function calculateThesisScore(company: Company, investor: Investor): MatchBreakdownItem {
  const thesis = normalize(investor.thesis);
  const description = normalize(company.description);
  const companyTokens = buildTokenSet([
    toTokenSet(description),
    toTokenSet(company.sector),
    toTokenSet(company.businessModel),
    parseListField(company.tags),
  ]);
  const thesisTokens = thesis ? toTokenSet(thesis) : new Set<string>();

  let score = 45;
  let reason = "Limited thesis information";

  if (thesisTokens.size > 0 && companyTokens.size > 0) {
    const overlap = jaccardSimilarity(companyTokens, thesisTokens);
    score = Math.round(40 + overlap * 60);
    if (score >= 85) reason = "Thesis tightly matches this company's focus";
    else if (score >= 65) reason = "Strong thematic overlap";
    else if (score >= 45) reason = "Partial thesis alignment";
    else reason = "Minimal thesis overlap";
  }

  return {
    key: "thesis",
    score,
    weight: DEFAULT_WEIGHTS.thesis,
    contribution: 0,
    reason,
  };
}

export function calculateMatchScore(
  company: Company,
  investor: Investor,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): MatchComputationResult {
  const factors: MatchBreakdownItem[] = [
    calculateSectorScore(company, investor),
    calculateStageScore(company, investor),
    calculateTractionScore(company),
    calculateCheckSizeScore(company, investor),
    calculateGeoScore(company, investor),
    calculateThesisScore(company, investor),
  ];

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 100;

  const breakdown = factors.map(item => {
    const weight = weights[item.key];
    const contribution = Math.round((item.score * weight) / totalWeight);
    return {
      ...item,
      weight,
      contribution,
    };
  });

  const score = Math.min(
    100,
    Math.round(
      breakdown.reduce((sum, item) => sum + (item.score * item.weight), 0) / totalWeight,
    ),
  );

  return {
    score,
    breakdown,
    reasons: breakdown
      .filter(item => item.score >= 70)
      .map(item => item.reason),
  };
}

function breakdownToRecord(
  company: Company,
  investor: Investor,
  breakdown: MatchBreakdownItem[],
  totalScore: number,
  explanation?: string,
): InsertMatch {
  const getScore = (key: keyof MatchingWeights) =>
    breakdown.find(item => item.key === key)?.score ?? 0;

  return {
    companyId: company.id!,
    investorId: investor.id!,
    score: totalScore,
    sectorScore: getScore("sector"),
    stageScore: getScore("stage"),
    tractionScore: getScore("traction"),
    checkSizeScore: getScore("checkSize"),
    geoScore: getScore("geography"),
    thesisScore: getScore("thesis"),
    graphScore: 0,
    explanation: explanation ?? null,
    matchReasons: JSON.stringify(
      breakdown
        .filter(item => item.score >= 70)
        .map(item => item.reason),
    ),
    concerns: null,
    introPath: null,
    status: "suggested",
    notes: null,
  };
}

export function buildMatchRecord(
  company: Company,
  investor: Investor,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): InsertMatch {
  const result = calculateMatchScore(company, investor, weights);
  const explanation = buildExplanation(company, investor, result.breakdown, result.score);
  return breakdownToRecord(company, investor, result.breakdown, result.score, explanation);
}

export function rankInvestorsForCompany(
  company: Company,
  investorList: Investor[],
  weights: MatchingWeights = DEFAULT_WEIGHTS,
  minScore = 0,
): InsertMatch[] {
  return investorList
    .filter(investor => investor.id)
    .map(investor => buildMatchRecord(company, investor, weights))
    .filter(match => match.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function rankCompaniesForInvestor(
  investor: Investor,
  companyList: Company[],
  weights: MatchingWeights = DEFAULT_WEIGHTS,
  minScore = 0,
): InsertMatch[] {
  return companyList
    .filter(company => company.id)
    .map(company => buildMatchRecord(company, investor, weights))
    .filter(match => match.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

function formatFactorLabel(key: keyof MatchingWeights) {
  const labels: Record<keyof MatchingWeights, string> = {
    sector: "sector alignment",
    stage: "stage fit",
    geography: "geography alignment",
    traction: "traction metrics",
    checkSize: "check size fit",
    thesis: "thesis fit",
  };
  return labels[key];
}

function describeMatchQuality(score: number) {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 55) return "balanced";
  return "developing";
}

function formatList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const [last, ...rest] = items.reverse();
  return `${rest.reverse().join(", ")}, and ${last}`;
}

function formatMoney(amount?: number | null) {
  if (!amount || amount <= 0) return "$0";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatCheckSizeRange(min?: number | null, max?: number | null) {
  if (min && max) return `${formatMoney(min)} - ${formatMoney(max)}`;
  if (min) return `from ${formatMoney(min)}`;
  if (max) return `up to ${formatMoney(max)}`;
  return "their typical range";
}

function fundingAlignmentSentence(company: Company, investor: Investor) {
  const target = company.fundingTarget ?? null;
  const min = investor.checkSizeMin ?? null;
  const max = investor.checkSizeMax ?? null;
  if (!target || (!min && !max)) return "";

  const withinMin = !min || target >= min;
  const withinMax = !max || target <= max;
  const investorLabel = investor.firm || investor.name || "the investor";

  if (withinMin && withinMax) {
    return ` ${company.name} is raising ${formatMoney(target)}, which fits ${investorLabel}'s typical check size of ${formatCheckSizeRange(min, max)}.`;
  }

  const relation =
    max && target > max
      ? "below"
      : min && target < min
      ? "above"
      : "";

  if (!relation) {
    return ` ${investorLabel} typically invests ${formatCheckSizeRange(min, max)}, which is close to this round of ${formatMoney(target)}.`;
  }

  return ` ${investorLabel} typically invests ${formatCheckSizeRange(min, max)}, which is ${relation} this round of ${formatMoney(target)}.`;
}

function summarizeThesis(thesis?: string | null) {
  if (!thesis) return "";
  const firstSentence = thesis.split(/[\.\n]/).map(part => part.trim()).find(Boolean);
  return firstSentence || thesis.slice(0, 140);
}

function buildExplanation(
  company: Company,
  investor: Investor,
  breakdown: MatchBreakdownItem[],
  score: number,
) {
  const quality = describeMatchQuality(score);
  const topFactors = [...breakdown]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => `${formatFactorLabel(item.key)} (${item.score}%)`);

  const factorPhrase = topFactors.length
    ? `based on ${formatList(topFactors)}`
    : "based on available data";

  const fundingSentence = fundingAlignmentSentence(company, investor);
  const thesisSentence = investor.thesis
    ? ` ${investor.firm || investor.name} focuses on ${summarizeThesis(investor.thesis)}.`
    : "";

  return `This is a ${quality} match ${factorPhrase}.${fundingSentence}${thesisSentence}`.trim();
}

