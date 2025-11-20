import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  companies, investors, matches, connections,
  Company, Investor, Match, Connection, InsertMatch
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * COMPANY QUERIES
 */

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listCompanies(criteria: {
  search?: string;
  sector?: string;
  stage?: string;
  geography?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (criteria.search) {
    conditions.push(
      or(
        like(companies.name, `%${criteria.search}%`),
        like(companies.description, `%${criteria.search}%`)
      )!
    );
  }
  if (criteria.sector) conditions.push(eq(companies.sector, criteria.sector));
  if (criteria.stage) conditions.push(eq(companies.stage, criteria.stage));
  if (criteria.geography) conditions.push(like(companies.geography, `%${criteria.geography}%`));

  const query = db.select().from(companies);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)!).limit(criteria.limit || 50);
  }
  
  return query.limit(criteria.limit || 50);
}

/**
 * INVESTOR QUERIES
 */

export async function getInvestorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listInvestors(criteria: {
  search?: string;
  sector?: string;
  stage?: string;
  geography?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (criteria.search) {
    conditions.push(
      or(
        like(investors.name, `%${criteria.search}%`),
        like(investors.firm, `%${criteria.search}%`),
        like(investors.bio, `%${criteria.search}%`)
      )!
    );
  }
  if (criteria.sector) conditions.push(eq(investors.sector, criteria.sector));
  if (criteria.stage) conditions.push(eq(investors.stage, criteria.stage));
  if (criteria.geography) conditions.push(like(investors.geography, `%${criteria.geography}%`));

  const query = db.select().from(investors);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)!).orderBy(desc(investors.confidence)).limit(criteria.limit || 50);
  }
  
  return query.orderBy(desc(investors.confidence)).limit(criteria.limit || 50);
}

/**
 * MATCH QUERIES
 */

export async function listAllCompanies(): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies);
}

export async function listAllInvestors(): Promise<Investor[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investors);
}

export async function getCompanyMatches(companyId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(matches)
    .where(eq(matches.companyId, companyId))
    .orderBy(desc(matches.score))
    .limit(limit);
}

export async function replaceMatch(record: InsertMatch) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(matches)
    .where(
      and(
        eq(matches.companyId, record.companyId),
        eq(matches.investorId, record.investorId)
      )!
    );

  await db.insert(matches).values(record);
}

export async function getMatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listMatches(criteria: {
  companyId?: number;
  investorId?: number;
  minScore?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (criteria.companyId) conditions.push(eq(matches.companyId, criteria.companyId));
  if (criteria.investorId) conditions.push(eq(matches.investorId, criteria.investorId));
  if (criteria.minScore) conditions.push(sql`${matches.score} >= ${criteria.minScore}`);

  const query = db.select().from(matches);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)!).orderBy(desc(matches.score)).limit(criteria.limit || 50);
  }
  
  return query.orderBy(desc(matches.score)).limit(criteria.limit || 50);
}

/**
 * Get detailed match with company and investor info
 */
export async function getMatchWithDetails(matchId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const match = await getMatchById(matchId);
  if (!match) return undefined;

  const company = await getCompanyById(match.companyId);
  const investor = await getInvestorById(match.investorId);

  return {
    ...match,
    company,
    investor,
  };
}

/**
 * ANALYTICS QUERIES
 */

export async function getAnalytics() {
  const db = await getDb();
  if (!db) return {
    totalCompanies: 0,
    totalInvestors: 0,
    totalMatches: 0,
    avgMatchScore: 0,
  };

  const [companiesCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
  const [investorsCount] = await db.select({ count: sql<number>`count(*)` }).from(investors);
  const [matchesCount] = await db.select({ count: sql<number>`count(*)` }).from(matches);
  const [avgScore] = await db.select({ avg: sql<number>`avg(${matches.score})` }).from(matches);

  return {
    totalCompanies: Number(companiesCount.count),
    totalInvestors: Number(investorsCount.count),
    totalMatches: Number(matchesCount.count),
    avgMatchScore: Math.round(Number(avgScore.avg) || 0),
  };
}

/**
 * Get sector distribution
 */
export async function getSectorDistribution() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      sector: companies.sector,
      count: sql<number>`count(*)`,
    })
    .from(companies)
    .groupBy(companies.sector)
    .orderBy(desc(sql`count(*)`));
}

/**
 * Get stage distribution
 */
export async function getStageDistribution() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      stage: companies.stage,
      count: sql<number>`count(*)`,
    })
    .from(companies)
    .groupBy(companies.stage)
    .orderBy(desc(sql`count(*)`));
}
