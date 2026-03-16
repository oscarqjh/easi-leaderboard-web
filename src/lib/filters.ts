import { ModelEntry, RankedModel, SortDirection } from "./types";
import { EASI8_IDS, ALL_IDS } from "./constants";

export function filterBySearch(models: ModelEntry[], search: string): ModelEntry[] {
  if (!search.trim()) return models;
  const keywords = search
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return models.filter((m) =>
    keywords.some((kw) => m.name.toLowerCase().includes(kw))
  );
}

export function filterByPrecision(
  models: ModelEntry[],
  precision: string
): ModelEntry[] {
  if (precision === "all") return models;
  return models.filter((m) => m.precision === precision);
}

export function getColumnsForProtocol(protocol: "EASI-8" | "ALL"): string[] {
  return protocol === "EASI-8" ? EASI8_IDS : ALL_IDS;
}

export function computeAverages(
  models: ModelEntry[],
  columns: string[]
): (ModelEntry & { average: number | null })[] {
  return models.map((m) => {
    const values = columns
      .map((c) => m.scores[c])
      .filter((v): v is number => v !== null && v !== undefined);
    const average = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
    return { ...m, average };
  });
}

export function sortModels(
  models: (ModelEntry & { average: number | null })[],
  column: string,
  direction: SortDirection
): (ModelEntry & { average: number | null })[] {
  return [...models].sort((a, b) => {
    let aVal: number | null;
    let bVal: number | null;

    if (column === "average") {
      aVal = a.average;
      bVal = b.average;
    } else {
      aVal = a.scores[column] ?? null;
      bVal = b.scores[column] ?? null;
    }

    // Nulls always last
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    return direction === "desc" ? bVal - aVal : aVal - bVal;
  });
}

export function computeBestScores(
  models: ModelEntry[],
  columns: string[]
): Record<string, number> {
  const best: Record<string, number> = {};
  for (const col of columns) {
    let max = -Infinity;
    for (const m of models) {
      const v = m.scores[col];
      if (v !== null && v !== undefined && v > max) max = v;
    }
    if (max > -Infinity) best[col] = max;
  }
  return best;
}

export function assignRanks(
  models: (ModelEntry & { average: number | null })[]
): RankedModel[] {
  return models.map((m, i) => ({ ...m, rank: i + 1 }));
}
