import { InsertCompany, InsertInvestor } from "../../drizzle/schema";

const STAGE_NORMALIZATION_MAP: Record<string, string> = {
  "pre seed": "Pre-seed",
  "pre-seed": "Pre-seed",
  "preseed": "Pre-seed",
  "seed": "Seed",
  "series a": "Series A",
  "series b": "Series B",
  "series c": "Series C",
  "growth": "Growth",
  "late stage": "Late Stage",
};

const SECTOR_NORMALIZATION_MAP: Record<string, string> = {
  "ai": "AI",
  "ai/ml": "AI/ML",
  "a i": "AI",
  "fintech": "Fintech",
  "healthtech": "Healthtech",
  "health tech": "Healthtech",
  "climatetech": "ClimateTech",
};

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseCurrency(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^0-9.-]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parsePercentage(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const numeric = value.replace(/[^0-9.-]/g, "");
  if (!numeric) return null;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStage(value: unknown): string | null {
  const normalized = sanitizeString(value)?.toLowerCase();
  if (!normalized) return null;
  return STAGE_NORMALIZATION_MAP[normalized] || capitalizeWords(normalized);
}

function normalizeSector(value: unknown): string | null {
  const normalized = sanitizeString(value)?.toLowerCase();
  if (!normalized) return null;
  return SECTOR_NORMALIZATION_MAP[normalized] || capitalizeWords(normalized);
}

function normalizeGeography(value: unknown): string | null {
  const normalized = sanitizeString(value);
  if (!normalized) return null;
  return normalized
    .split(",")
    .map(part => capitalizeWords(part.trim().toLowerCase()))
    .join(", ");
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(v => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(/[;,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function capitalizeWords(value: string): string {
  return value
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeCompanyRecord(input: any): InsertCompany {
  const sectorList = parseList(input.focusSectors || input.sectors || input.sector);
  const normalized: InsertCompany = {
    name: sanitizeString(input.name) ?? "",
    description: sanitizeString(input.description),
    sector: normalizeSector(sectorList[0] || input.sector || input.industry),
    subSector: sanitizeString(input.subSector),
    stage: normalizeStage(input.stage || input.fundingStage),
    geography: normalizeGeography(input.geography || input.location),
    foundedYear: input.founded
      ? Number(input.founded)
      : input.foundedYear
      ? Number(input.foundedYear)
      : null,
    teamSize: input.teamSize ? Number(input.teamSize) : null,
    fundingRound: sanitizeString(input.fundingRound || input.stage),
    fundingTarget: parseCurrency(input.fundingTarget),
    fundingRaised: parseCurrency(input.fundingRaised),
    valuation: parseCurrency(input.valuation),
    revenue: parseCurrency(input.revenue),
    revenueGrowth: parsePercentage(input.revenueGrowth),
    customers: input.customers ? Number(input.customers) : null,
    mrr: parseCurrency(input.mrr),
    businessModel: sanitizeString(input.businessModel) ?? "B2B SaaS",
    targetMarket: sanitizeString(input.targetMarket),
    competitiveAdvantage: sanitizeString(input.competitiveAdvantage),
    pitchDeckUrl: sanitizeString(input.pitchDeckUrl),
    pitchDeckAnalysis: sanitizeString(input.pitchDeckAnalysis),
    websiteUrl: sanitizeString(input.website || input.websiteUrl),
    logoUrl: sanitizeString(input.logoUrl),
    founderName: sanitizeString(input.founderName),
    founderEmail: sanitizeString(input.founderEmail),
    founderLinkedin: sanitizeString(input.founderLinkedin),
    tags: sectorList.length ? JSON.stringify({ sectors: sectorList }) : null,
    confidence: input.confidence ? Number(input.confidence) : 85,
    lastInteraction: input.lastInteraction ?? null,
    createdAt: input.createdAt ?? undefined,
    updatedAt: input.updatedAt ?? undefined,
  };

  return normalized;
}

export function normalizeInvestorRecord(input: any): InsertInvestor {
  const focusSectors = parseList(input.focusSectors || input.sector);
  const focusStages = parseList(input.focusStages || input.stage);
  const focusGeographies = parseList(input.focusGeographies || input.geography);

  const normalized: InsertInvestor = {
    name: sanitizeString(input.name) ?? "",
    type: sanitizeString(input.type) ?? "VC",
    firm: sanitizeString(input.firm) ?? sanitizeString(input.company),
    title: sanitizeString(input.title),
    bio: sanitizeString(input.bio),
    sector: normalizeSector(focusSectors[0] || input.sector),
    subSector: sanitizeString(input.subSector),
    stage: normalizeStage(focusStages[0] || input.stage),
    geography: normalizeGeography(focusGeographies[0] || input.geography),
    checkSizeMin: parseCurrency(input.checkSizeMin),
    checkSizeMax: parseCurrency(input.checkSizeMax),
    thesis: sanitizeString(input.thesis || input.investmentThesis),
    portfolioCompanies: sanitizeString(input.portfolioCompanies),
    notableInvestments: sanitizeString(input.notableInvestments),
    investmentCount: input.portfolioSize ? Number(input.portfolioSize) : null,
    email: sanitizeString(input.email),
    linkedinUrl: sanitizeString(input.linkedin || input.linkedinUrl),
    websiteUrl: sanitizeString(input.website || input.websiteUrl),
    avatarUrl: sanitizeString(input.avatarUrl),
    tags: JSON.stringify({
      focusSectors,
      focusStages,
      focusGeographies,
    }),
    confidence: input.confidence ? Number(input.confidence) : 85,
    lastInteraction: input.lastInteraction ?? null,
    createdAt: input.createdAt ?? undefined,
    updatedAt: input.updatedAt ?? undefined,
  };

  return normalized;
}

