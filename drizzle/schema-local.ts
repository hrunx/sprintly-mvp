import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Users table with email/password authentication
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hashed
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies seeking investment
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 500 }),
  sector: varchar("sector", { length: 100 }),
  stage: varchar("stage", { length: 50 }),
  location: varchar("location", { length: 100 }),
  founded: int("founded"),
  teamSize: int("teamSize"),
  businessModel: varchar("businessModel", { length: 100 }),
  fundingRound: varchar("fundingRound", { length: 50 }),
  seeking: int("seeking"),
  alreadyRaised: int("alreadyRaised"),
  valuation: int("valuation"),
  annualRevenue: int("annualRevenue"),
  revenueGrowth: int("revenueGrowth"),
  customers: int("customers"),
  mrr: int("mrr"),
  founderName: varchar("founderName", { length: 255 }),
  founderEmail: varchar("founderEmail", { length: 255 }),
  founderLinkedIn: varchar("founderLinkedIn", { length: 500 }),
  pitchDeckUrl: varchar("pitchDeckUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Investors
 */
export const investors = mysqlTable("investors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  firm: varchar("firm", { length: 255 }),
  bio: text("bio"),
  sector: text("sector"),
  stage: text("stage"),
  geography: text("geography"),
  checkSizeMin: int("checkSizeMin"),
  checkSizeMax: int("checkSizeMax"),
  email: varchar("email", { length: 255 }),
  linkedIn: varchar("linkedIn", { length: 500 }),
  website: varchar("website", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = typeof investors.$inferInsert;

/**
 * AI-generated matches
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  investorId: int("investorId").notNull(),
  overallScore: int("overallScore").notNull(),
  sectorScore: int("sectorScore"),
  stageScore: int("stageScore"),
  geoScore: int("geoScore"),
  tractionScore: int("tractionScore"),
  checkSizeScore: int("checkSizeScore"),
  thesisScore: int("thesisScore"),
  matchReasons: text("matchReasons"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Introduction requests
 */
export const introRequests = mysqlTable("introRequests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  investorId: int("investorId").notNull(),
  requesterId: int("requesterId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntroRequest = typeof introRequests.$inferSelect;
export type InsertIntroRequest = typeof introRequests.$inferInsert;

/**
 * Matching configuration
 */
export const matchingConfig = mysqlTable("matchingConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }),
  sectorWeight: int("sectorWeight").default(25).notNull(),
  stageWeight: int("stageWeight").default(20).notNull(),
  geoWeight: int("geoWeight").default(10).notNull(),
  tractionWeight: int("tractionWeight").default(20).notNull(),
  checkSizeWeight: int("checkSizeWeight").default(15).notNull(),
  thesisWeight: int("thesisWeight").default(10).notNull(),
  filters: text("filters"),
  thresholds: text("thresholds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchingConfig = typeof matchingConfig.$inferSelect;
export type InsertMatchingConfig = typeof matchingConfig.$inferInsert;
