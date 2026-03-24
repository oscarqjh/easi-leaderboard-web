import { RankedModel } from "./types";
import { CapabilityMap } from "./leaderboard-fetch";

export interface CapabilityScore {
  value: number | null;
  missingInfo?: string;
  missingDetails?: { benchId: string; subKey: string }[];
}

export interface ModelCapabilityRow {
  model: RankedModel;
  capabilities: Record<string, CapabilityScore>;
  capAverage: number | null;
  rank: number;
}

/**
 * Extract all unique capability labels from the capabilityMap, sorted.
 */
export function getCapabilityLabels(capabilityMap: CapabilityMap): string[] {
  const labels = new Set<string>();
  for (const benchId of Object.keys(capabilityMap)) {
    for (const subKey of Object.keys(capabilityMap[benchId])) {
      for (const cap of capabilityMap[benchId][subKey]) {
        labels.add(cap);
      }
    }
  }
  return Array.from(labels).sort();
}

/**
 * Build structured tooltip data for a capability column header.
 * Groups sub-scores by benchmark.
 */
export interface CapabilityTooltipData {
  cap: string;
  benchmarks: { benchId: string; subKeys: string[] }[];
}

export function getCapabilityTooltipData(
  cap: string,
  selectedBenchmarks: string[],
  capabilityMap: CapabilityMap
): CapabilityTooltipData {
  const benchmarks: { benchId: string; subKeys: string[] }[] = [];
  for (const benchId of selectedBenchmarks) {
    const benchMap = capabilityMap[benchId];
    if (!benchMap) continue;
    const subKeys: string[] = [];
    for (const [subKey, caps] of Object.entries(benchMap)) {
      if (caps.includes(cap)) subKeys.push(subKey);
    }
    if (subKeys.length > 0) benchmarks.push({ benchId, subKeys });
  }
  return { cap, benchmarks };
}

/**
 * Compute capability scores for a single model.
 */
function computeModelCaps(
  model: RankedModel,
  selectedBenchmarks: string[],
  capabilityMap: CapabilityMap,
  capLabels: string[]
): Record<string, CapabilityScore> {
  const capabilities: Record<string, CapabilityScore> = {};

  for (const cap of capLabels) {
    const values: number[] = [];
    const missing: string[] = [];

    for (const benchId of selectedBenchmarks) {
      const benchMap = capabilityMap[benchId];
      if (!benchMap) continue;

      for (const [subKey, caps] of Object.entries(benchMap)) {
        if (!caps.includes(cap)) continue;

        const val = model.subScores?.[benchId]?.[subKey];
        if (val !== undefined && val !== null) {
          values.push(val);
        } else {
          missing.push(`${benchId}/${subKey}`);
        }
      }
    }

    if (values.length === 0 && missing.length === 0) {
      capabilities[cap] = { value: null, missingInfo: "no-mapping" };
    } else if (missing.length > 0) {
      capabilities[cap] = {
        value: null,
        missingInfo: "missing-subscores",
        missingDetails: missing.map((m) => {
          const [benchId, subKey] = m.split("/", 2);
          return { benchId, subKey };
        }),
      };
    } else {
      capabilities[cap] = { value: values.reduce((a, b) => a + b, 0) / values.length };
    }
  }

  return capabilities;
}

/**
 * Compute capability scores for all models, sort, and assign ranks.
 */
export function computeCapabilityView(
  models: RankedModel[],
  selectedBenchmarks: string[],
  capabilityMap: CapabilityMap,
  sortColumn: string,
  sortDirection: "asc" | "desc"
): { labels: string[]; rows: ModelCapabilityRow[] } {
  const labels = getCapabilityLabels(capabilityMap);

  let rows: ModelCapabilityRow[] = models.map((model) => {
    const capabilities = computeModelCaps(model, selectedBenchmarks, capabilityMap, labels);

    const capValues = Object.values(capabilities);
    const totalCaps = capValues.length;
    const capAverage = totalCaps > 0
      ? capValues.reduce((acc, cs) => acc + (cs.value ?? 0), 0) / totalCaps
      : null;

    return { model, capabilities, capAverage, rank: 0 };
  });

  // Sort
  rows.sort((a, b) => {
    let aVal: number | null;
    let bVal: number | null;

    if (sortColumn === "average") {
      aVal = a.capAverage;
      bVal = b.capAverage;
    } else {
      aVal = a.capabilities[sortColumn]?.value ?? null;
      bVal = b.capabilities[sortColumn]?.value ?? null;
    }

    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
  });

  rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  return { labels, rows };
}
