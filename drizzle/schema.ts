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
 * Entity types in the knowledge graph
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
 * Match history and outcomes
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  founderId: int("founderId").notNull(),
  investorId: int("investorId").notNull(),
  score: int("score").notNull(), // 0-100 match score
  sectorScore: int("sectorScore").default(0),
  stageScore: int("stageScore").default(0),
  geoScore: int("geoScore").default(0),
  tractionScore: int("tractionScore").default(0),
  checkSizeScore: int("checkSizeScore").default(0),
  graphScore: int("graphScore").default(0),
  explanation: text("explanation"),
  introPath: text("introPath"), // JSON array of entity IDs forming the path
  status: mysqlEnum("status", ["suggested", "contacted", "meeting_scheduled", "passed", "invested"]).default("suggested"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

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