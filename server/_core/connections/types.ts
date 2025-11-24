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
  checkSizeMin?: number;
  checkSizeMax?: number;
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
};
