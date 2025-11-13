import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  companies, investors, matches,
  Company, Investor, Match
} from "../drizzle/schema";

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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= COMPANIES =============

export async function getAllCompanies(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(companies).limit(limit);
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0] || null;
}

export async function searchCompanies(filters: {
  sector?: string;
  stage?: string;
  location?: string;
  minRevenue?: number;
  maxSeeking?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(companies);
  const conditions = [];

  if (filters.sector) {
    conditions.push(eq(companies.sector, filters.sector));
  }
  if (filters.stage) {
    conditions.push(eq(companies.stage, filters.stage));
  }
  if (filters.location) {
    conditions.push(eq(companies.location, filters.location));
  }
  if (filters.minRevenue) {
    conditions.push(sql`${companies.annualRevenue} >= ${filters.minRevenue}`);
  }
  if (filters.maxSeeking) {
    conditions.push(sql`${companies.seeking} <= ${filters.maxSeeking}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.limit(100);
}

// ============= INVESTORS =============

export async function getAllInvestors(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(investors).limit(limit);
}

export async function getInvestorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(investors).where(eq(investors.id, id)).limit(1);
  return result[0] || null;
}

export async function searchInvestors(filters: {
  sector?: string;
  stage?: string;
  geography?: string;
  minCheckSize?: number;
  maxCheckSize?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(investors);
  const conditions = [];

  if (filters.sector) {
    conditions.push(sql`${investors.sector} LIKE ${`%${filters.sector}%`}`);
  }
  if (filters.stage) {
    conditions.push(sql`${investors.stage} LIKE ${`%${filters.stage}%`}`);
  }
  if (filters.geography) {
    conditions.push(sql`${investors.geography} LIKE ${`%${filters.geography}%`}`);
  }
  if (filters.minCheckSize) {
    conditions.push(sql`${investors.checkSizeMin} >= ${filters.minCheckSize}`);
  }
  if (filters.maxCheckSize) {
    conditions.push(sql`${investors.checkSizeMax} <= ${filters.maxCheckSize}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.limit(100);
}

// ============= MATCHES =============

export async function getTopMatches(companyId?: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(matches).orderBy(desc(matches.overallScore));

  if (companyId) {
    query = query.where(eq(matches.companyId, companyId)) as any;
  }

  return query.limit(limit);
}

export async function getMatchById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result[0] || null;
}

export async function createMatch(match: {
  companyId: number;
  investorId: number;
  overallScore: number;
  sectorScore?: number;
  stageScore?: number;
  geoScore?: number;
  tractionScore?: number;
  checkSizeScore?: number;
  thesisScore?: number;
  matchReasons?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(matches).values(match);
  
  // Return the created match
  const result = await db.select().from(matches)
    .where(and(
      eq(matches.companyId, match.companyId),
      eq(matches.investorId, match.investorId)
    ))
    .limit(1);
  
  return result[0] || null;
}

// ============= ANALYTICS =============

export async function getAnalytics() {
  const db = await getDb();
  if (!db) return null;

  const [companiesCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
  const [investorsCount] = await db.select({ count: sql<number>`count(*)` }).from(investors);
  const [matchesCount] = await db.select({ count: sql<number>`count(*)` }).from(matches);
  const [avgScore] = await db.select({ avg: sql<number>`avg(${matches.overallScore})` }).from(matches);

  return {
    totalCompanies: Number(companiesCount.count) || 0,
    totalInvestors: Number(investorsCount.count) || 0,
    totalMatches: Number(matchesCount.count) || 0,
    avgMatchScore: Math.round(Number(avgScore.avg) || 0),
  };
}
