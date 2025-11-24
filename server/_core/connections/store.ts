import fs from "fs/promises";
import path from "path";
import { EnrichedConnectionProfile } from "./types";

const STORE_PATH = path.resolve(process.cwd(), "server/data/connection-profiles.json");

async function ensureStoreDir() {
  const dir = path.dirname(STORE_PATH);
  await fs.mkdir(dir, { recursive: true });
}

export async function loadConnectionProfiles(): Promise<EnrichedConnectionProfile[]> {
  try {
    await ensureStoreDir();
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as EnrichedConnectionProfile[];
    }
    return [];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.warn("[Connections] Failed to load cached profiles:", error);
    return [];
  }
}

export async function saveConnectionProfiles(profiles: EnrichedConnectionProfile[]) {
  await ensureStoreDir();
  const payload = JSON.stringify(profiles, null, 2);
  await fs.writeFile(STORE_PATH, payload, "utf-8");
}

export function upsertProfile(
  profiles: EnrichedConnectionProfile[],
  profile: EnrichedConnectionProfile,
): EnrichedConnectionProfile[] {
  const existingIndex = profiles.findIndex(item => item.id === profile.id);
  if (existingIndex >= 0) {
    const merged = {
      ...profiles[existingIndex],
      ...profile,
      attachedFiles: profile.attachedFiles ?? profiles[existingIndex].attachedFiles,
    };
    return [
      ...profiles.slice(0, existingIndex),
      merged,
      ...profiles.slice(existingIndex + 1),
    ];
  }
  return [...profiles, profile];
}
