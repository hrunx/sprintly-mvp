import { sql } from "drizzle-orm";
import { getDb } from "../db";

const RESET_TABLES_IN_ORDER = [
  "matches",
  "legacy_matches",
  "introRequests",
  "connections",
  "lists",
  "companies",
  "investors",
  "entities",
  "matchingConfig",
];

export async function resetDatabase() {
  const db = await getDb();

  if (!db) {
    throw new Error("Database connection is not available");
  }

  await db.transaction(async tx => {
    await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    for (const tableName of RESET_TABLES_IN_ORDER) {
      await tx.execute(sql.raw(`TRUNCATE TABLE \`${tableName}\``));
    }

    await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  });

  return { success: true as const };
}

