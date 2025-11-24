export type LinkedInConnectionRow = {
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  email?: string;
  company?: string;
  title?: string;
  connectedOn?: string;
};

export type ProfileAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

export type EnrichedConnectionProfile = {
  id: string;
  fullName: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  email?: string;
  role: "investor" | "founder" | "operator";
  sector?: string;
  stage?: string;
  geography?: string;
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  focusAreas?: string[];
  summary?: string;
  thesis?: string;
  accuracy: number;
  confidence: number;
  tags: string[];
  sources?: string[];
  notes?: string;
  lastEnrichedAt?: string;
  source: LinkedInConnectionRow;
  attachedFiles?: ProfileAttachment[];
  matchStatus?: "not_synced" | "synced" | "matched";
  investorId?: number;
  companyId?: number;
  companyDetails?: {
    name?: string;
    website?: string;
    description?: string;
    stage?: string;
    raising?: string;
    headquarters?: string;
    fundingTarget?: number | null;
    fundingRaised?: number | null;
    foundedYear?: number | null;
  };
  investorDetails?: {
    firm?: string;
    checkSizeMin?: number | null;
    checkSizeMax?: number | null;
    focusSectors?: string[];
    focusStages?: string[];
    focusGeographies?: string[];
    pastInvestments?: string[];
    bio?: string;
  };
  linkedCompanies?: Array<{
    name: string;
    companyId?: number;
    website?: string;
    description?: string;
    stage?: string;
    headquarters?: string;
    foundedYear?: number | null;
    fundingTarget?: number | null;
    fundingRaised?: number | null;
    role?: string;
    confidence?: number;
    isPrimary?: boolean;
  }>;
  scrapedSummary?: string;
  scrapedFacts?: string[];
  scrapeSources?: string[];
};
