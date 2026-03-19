import { ModelEntry } from "./types";
import { BENCHMARKS } from "./constants";

const HF_API_BASE = "https://huggingface.co/api";
const VERSIONS_PATH = "leaderboard/versions";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const benchmarkIds = new Set(BENCHMARKS.map((b) => b.id));

interface CachedData {
  data: ModelEntry[];
  lastUpdated: string;
  fetchedAt: number;
}

let cache: CachedData | null = null;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok && i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

interface HfFileEntry {
  path: string;
  type: string;
}

interface HfModelData {
  config?: { model_name?: string; model_key?: string };
  results: Record<string, Record<string, number>>;
}

function transformData(raw: Record<string, HfModelData>): ModelEntry[] {
  return Object.entries(raw).map(([key, entry]) => {
    const name = entry.config?.model_name || key;

    const scores: Record<string, number | null> = {};
    for (const benchId of benchmarkIds) {
      const result = entry.results[benchId];
      if (!result) {
        scores[benchId] = null;
        continue;
      }
      // Use 'acc' for most benchmarks, 'caa' for SITE
      scores[benchId] = result.acc ?? result.caa ?? null;
    }

    return {
      name,
      type: "instruction" as const,
      precision: "bfloat16" as const,
      scores,
    };
  });
}

function parseTimestamp(filename: string): string {
  // bench_20260214T040553.json → 2026-02-14T04:05:53Z
  const match = filename.match(/bench_(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

export async function getLeaderboardData(): Promise<{
  data: ModelEntry[];
  lastUpdated: string;
}> {
  // Return cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { data: cache.data, lastUpdated: cache.lastUpdated };
  }

  const token = process.env.HF_UPLOAD_TOKEN;
  const repoId = process.env.HF_RESULTS_REPO || "lmms-lab-si/EASI-Leaderboard-Results";

  if (!token) {
    throw new Error("HF_UPLOAD_TOKEN not configured");
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 1. List version files
  const listRes = await fetchWithRetry(
    `${HF_API_BASE}/datasets/${repoId}/tree/main/${VERSIONS_PATH}`,
    { headers }
  );

  if (!listRes.ok) {
    throw new Error(`Failed to list leaderboard versions (${listRes.status})`);
  }

  const files = (await listRes.json()) as HfFileEntry[];
  const jsonFiles = files
    .filter((f) => f.path.endsWith(".json"))
    .sort((a, b) => a.path.localeCompare(b.path));

  if (jsonFiles.length === 0) {
    throw new Error("No leaderboard data files found");
  }

  const latestFile = jsonFiles[jsonFiles.length - 1];
  const filename = latestFile.path.split("/").pop() || "";

  // 2. Fetch the latest file
  const dataRes = await fetchWithRetry(
    `https://huggingface.co/datasets/${repoId}/resolve/main/${latestFile.path}`,
    { headers }
  );

  if (!dataRes.ok) {
    throw new Error(`Failed to fetch leaderboard data (${dataRes.status})`);
  }

  const raw = (await dataRes.json()) as Record<string, HfModelData>;

  // 3. Transform
  const data = transformData(raw);
  const lastUpdated = parseTimestamp(filename);

  // 4. Cache
  cache = { data, lastUpdated, fetchedAt: Date.now() };

  return { data, lastUpdated };
}
