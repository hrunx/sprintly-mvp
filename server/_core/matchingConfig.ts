import fs from "fs/promises";
import path from "path";

export type MatchingConfig = {
  weights: {
    sector: number;
    stage: number;
    geography: number;
    traction: number;
    checkSize: number;
    thesis: number;
  };
  filters: {
    minRevenue: number;
    minTeamSize: number;
    requirePitchDeck: boolean;
    requireTraction: boolean;
  };
  thresholds: {
    minMatchScore: number;
    minSectorScore: number;
    minStageScore: number;
  };
};

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: {
    sector: 25,
    stage: 20,
    geography: 10,
    traction: 20,
    checkSize: 15,
    thesis: 10,
  },
  filters: {
    minRevenue: 0,
    minTeamSize: 0,
    requirePitchDeck: false,
    requireTraction: false,
  },
  thresholds: {
    minMatchScore: 50,
    minSectorScore: 60,
    minStageScore: 50,
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "server/data/matching-config.json");

async function ensureDir() {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
}

export async function loadMatchingConfig(): Promise<MatchingConfig> {
  try {
    await ensureDir();
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MATCHING_CONFIG,
      ...parsed,
      weights: { ...DEFAULT_MATCHING_CONFIG.weights, ...(parsed.weights || {}) },
      filters: { ...DEFAULT_MATCHING_CONFIG.filters, ...(parsed.filters || {}) },
      thresholds: { ...DEFAULT_MATCHING_CONFIG.thresholds, ...(parsed.thresholds || {}) },
    };
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.warn("[MatchingConfig] Failed to load config, using defaults", error);
    }
    return DEFAULT_MATCHING_CONFIG;
  }
}

export async function saveMatchingConfig(config: MatchingConfig) {
  await ensureDir();
  const merged = {
    ...DEFAULT_MATCHING_CONFIG,
    ...config,
    weights: { ...DEFAULT_MATCHING_CONFIG.weights, ...config.weights },
    filters: { ...DEFAULT_MATCHING_CONFIG.filters, ...config.filters },
    thresholds: { ...DEFAULT_MATCHING_CONFIG.thresholds, ...config.thresholds },
  };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
