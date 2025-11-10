import { eq, and, or, like, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, entities, connections, matches, Entity, Connection, Match } from "../drizzle/schema";
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
 * Get all entities with optional filtering
 */
export async function getEntities(filters?: {
  type?: "founder" | "investor" | "enabler";
  sector?: string;
  stage?: string;
  geography?: string;
  search?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(entities);

  const conditions = [];
  if (filters?.type) conditions.push(eq(entities.type, filters.type));
  if (filters?.sector) conditions.push(eq(entities.sector, filters.sector));
  if (filters?.stage) conditions.push(eq(entities.stage, filters.stage));
  if (filters?.geography) conditions.push(like(entities.geography, `%${filters.geography}%`));
  if (filters?.search) {
    conditions.push(
      or(
        like(entities.name, `%${filters.search}%`),
        like(entities.firm, `%${filters.search}%`),
        like(entities.bio, `%${filters.search}%`)
      )!
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  query = query.orderBy(desc(entities.confidence)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return query;
}

/**
 * Get entity by ID
 */
export async function getEntityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(entities).where(eq(entities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get connections for an entity
 */
export async function getEntityConnections(entityId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(connections)
    .where(or(eq(connections.sourceId, entityId), eq(connections.targetId, entityId))!)
    .orderBy(desc(connections.strength));
}

/**
 * Get matches for a founder
 */
export async function getFounderMatches(founderId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(matches)
    .where(eq(matches.founderId, founderId))
    .orderBy(desc(matches.score))
    .limit(limit);
}

/**
 * Search and match investors for a founder based on criteria
 */
export async function findMatches(criteria: {
  sector?: string;
  stage?: string;
  geography?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(entities.type, "investor")];
  
  if (criteria.sector) conditions.push(eq(entities.sector, criteria.sector));
  if (criteria.stage) conditions.push(eq(entities.stage, criteria.stage));
  if (criteria.geography) conditions.push(like(entities.geography, `%${criteria.geography}%`));

  return db
    .select()
    .from(entities)
    .where(and(...conditions)!)
    .orderBy(desc(entities.confidence))
    .limit(criteria.limit || 10);
}

/**
 * Get analytics/KPI data
 */
export async function getAnalytics() {
  const db = await getDb();
  if (!db) return null;

  const [founderCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entities)
    .where(eq(entities.type, "founder"));

  const [investorCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entities)
    .where(eq(entities.type, "investor"));

  const [connectionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(connections);

  const [matchCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches);

  const [avgMatchScore] = await db
    .select({ avg: sql<number>`avg(score)` })
    .from(matches);

  return {
    founders: founderCount?.count || 0,
    investors: investorCount?.count || 0,
    connections: connectionCount?.count || 0,
    matches: matchCount?.count || 0,
    avgMatchScore: Math.round(avgMatchScore?.avg || 0),
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
      sector: entities.sector,
      count: sql<number>`count(*)`,
    })
    .from(entities)
    .where(eq(entities.type, "founder"))
    .groupBy(entities.sector)
    .orderBy(desc(sql`count(*)`));
}

/**
 * Get intro path between two entities
 */
export async function getIntroPath(sourceId: number, targetId: number) {
  const db = await getDb();
  if (!db) return [];

  // Simple path: check if there's a direct connection
  const directConnection = await db
    .select()
    .from(connections)
    .where(
      or(
        and(eq(connections.sourceId, sourceId), eq(connections.targetId, targetId))!,
        and(eq(connections.sourceId, targetId), eq(connections.targetId, sourceId))!
      )!
    )
    .limit(1);

  if (directConnection.length > 0) {
    return [sourceId, targetId];
  }

  // Find mutual connections (2-hop path)
  const sourceConnections = await db
    .select({ targetId: connections.targetId })
    .from(connections)
    .where(eq(connections.sourceId, sourceId));

  const targetConnections = await db
    .select({ sourceId: connections.sourceId })
    .from(connections)
    .where(eq(connections.targetId, targetId));

  const sourceTargets = sourceConnections.map((c) => c.targetId);
  const targetSources = targetConnections.map((c) => c.sourceId);

  const mutuals = sourceTargets.filter((id) => targetSources.includes(id));

  if (mutuals.length > 0) {
    return [sourceId, mutuals[0], targetId];
  }

  return []; // No path found
}
