import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Matching configuration settings
 */
export const matchingConfig = mysqlTable("matchingConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weights: text("weights").notNull(), // JSON: {sector, stage, geography, traction, checkSize, thesis}
  filters: text("filters").notNull(), // JSON: {minRevenue, minTeamSize, requirePitchDeck, requireTraction}
  thresholds: text("thresholds").notNull(), // JSON: {minMatchScore, minSectorScore, minStageScore}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchingConfig = typeof matchingConfig.$inferSelect;
export type InsertMatchingConfig = typeof matchingConfig.$inferInsert;

/**
 * Companies/Startups seeking investment
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sector: varchar("sector", { length: 100 }),
  subSector: varchar("subSector", { length: 100 }),
  stage: varchar("stage", { length: 50 }), // Pre-seed, Seed, Series A, etc
  geography: varchar("geography", { length: 100 }),
  foundedYear: int("foundedYear"),
  teamSize: int("teamSize"),
  
  // Funding details
  fundingRound: varchar("fundingRound", { length: 50 }),
  fundingTarget: int("fundingTarget"), // Amount seeking in USD
  fundingRaised: int("fundingRaised"), // Amount already raised
  valuation: int("valuation"),
  
  // Traction metrics
  revenue: int("revenue"),
  revenueGrowth: int("revenueGrowth"), // Percentage
  customers: int("customers"),
  mrr: int("mrr"), // Monthly Recurring Revenue
  
  // Business model
  businessModel: varchar("businessModel", { length: 100 }), // B2B, B2C, SaaS, Marketplace, etc
  targetMarket: text("targetMarket"),
  competitiveAdvantage: text("competitiveAdvantage"),
  
  // Pitch deck and materials
  pitchDeckUrl: varchar("pitchDeckUrl", { length: 500 }),
  pitchDeckAnalysis: text("pitchDeckAnalysis"), // AI analysis of pitch deck
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 500 }),
  
  // Contact
  founderName: varchar("founderName", { length: 255 }),
  founderEmail: varchar("founderEmail", { length: 320 }),
  founderLinkedin: varchar("founderLinkedin", { length: 500 }),
  
  tags: text("tags"), // JSON array of tags
  confidence: int("confidence").default(85), // 0-100 data quality score
  lastInteraction: timestamp("lastInteraction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Investors with investment criteria
 */
export const investors = mysqlTable("investors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }), // VC, Angel, Corporate VC, Family Office
  firm: varchar("firm", { length: 255 }),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  
  // Investment criteria
  sector: varchar("sector", { length: 100 }),
  subSector: varchar("subSector", { length: 100 }),
  stage: varchar("stage", { length: 50 }),
  geography: varchar("geography", { length: 100 }),
  checkSizeMin: int("checkSizeMin"),
  checkSizeMax: int("checkSizeMax"),
  
  // Investment thesis
  thesis: text("thesis"),
  portfolioCompanies: text("portfolioCompanies"), // JSON array
  notableInvestments: text("notableInvestments"),
  investmentCount: int("investmentCount"),
  
  // Contact
  email: varchar("email", { length: 320 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  
  tags: text("tags"), // JSON array of tags
  confidence: int("confidence").default(85),
  lastInteraction: timestamp("lastInteraction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = typeof investors.$inferInsert;

/**
 * Entity types in the knowledge graph (for backward compatibility)
 */
export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["founder", "investor", "enabler"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  firm: varchar("firm", { length: 255 }),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  sector: varchar("sector", { length: 100 }),
  subSector: varchar("subSector", { length: 100 }),
  stage: varchar("stage", { length: 50 }),
  geography: varchar("geography", { length: 100 }),
  checkSizeMin: int("checkSizeMin"),
  checkSizeMax: int("checkSizeMax"),
  thesis: text("thesis"),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  tags: text("tags"), // JSON array of tags
  confidence: int("confidence").default(85), // 0-100 confidence score
  lastInteraction: timestamp("lastInteraction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;

/**
 * Connections/relationships between entities
 */
export const connections = mysqlTable("connections", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  targetId: int("targetId").notNull(),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(), // mutual, introduced_by, worked_with, etc
  strength: int("strength").default(50), // 0-100 connection strength
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = typeof connections.$inferInsert;

/**
 * Match history and outcomes between companies and investors
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  investorId: int("investorId").notNull(),
  score: int("score").notNull(), // 0-100 overall match score
  
  // Detailed scoring breakdown
  sectorScore: int("sectorScore").default(0),
  stageScore: int("stageScore").default(0),
  geoScore: int("geoScore").default(0),
  tractionScore: int("tractionScore").default(0),
  checkSizeScore: int("checkSizeScore").default(0),
  thesisScore: int("thesisScore").default(0),
  graphScore: int("graphScore").default(0),
  
  explanation: text("explanation"), // AI-generated explanation of why this is a good match
  matchReasons: text("matchReasons"), // JSON array of specific match reasons
  concerns: text("concerns"), // JSON array of potential concerns
  introPath: text("introPath"), // JSON array of entity IDs forming the intro path
  
  status: mysqlEnum("status", ["suggested", "contacted", "meeting_scheduled", "passed", "invested"]).default("suggested"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Keep old matches table for backward compatibility
export const legacyMatches = mysqlTable("legacy_matches", {
  id: int("id").autoincrement().primaryKey(),
  founderId: int("founderId").notNull(),
  investorId: int("investorId").notNull(),
  score: int("score").notNull(),
  sectorScore: int("sectorScore").default(0),
  stageScore: int("stageScore").default(0),
  geoScore: int("geoScore").default(0),
  tractionScore: int("tractionScore").default(0),
  checkSizeScore: int("checkSizeScore").default(0),
  graphScore: int("graphScore").default(0),
  explanation: text("explanation"),
  introPath: text("introPath"),
  status: mysqlEnum("status", ["suggested", "contacted", "meeting_scheduled", "passed", "invested"]).default("suggested"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

export const introRequests = mysqlTable("introRequests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  investorId: int("investorId").notNull(),
  requestedBy: int("requestedBy").notNull(), // user ID
  connectionId: int("connectionId"), // ID of mutual connection who can make intro
  status: mysqlEnum("status", ["pending", "accepted", "declined", "completed"]).default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntroRequest = typeof introRequests.$inferSelect;
export type InsertIntroRequest = typeof introRequests.$inferInsert;

/**
 * User-created lists for campaigns
 */
export const lists = mysqlTable("lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityIds: text("entityIds"), // JSON array of entity IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type List = typeof lists.$inferSelect;
export type InsertList = typeof lists.$inferInsert;