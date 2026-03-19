import { useMemo } from "react";
import { RankedModel, SortDirection } from "@/lib/types";
import { BENCHMARKS } from "@/lib/constants";
import ScoreCell from "./ScoreCell";
import RankBadge from "./RankBadge";

interface LeaderboardTableProps {
  models: RankedModel[];
  visibleColumns: string[];
  expandedColumns: string[];
  bestScores: Record<string, number>;
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
}

function SortArrow({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string;
  sortColumn: string;
  sortDirection: SortDirection;
}) {
  if (column !== sortColumn) {
    return <span className="text-lb-text-muted/40 ml-1 text-xs">&#8597;</span>;
  }
  return (
    <span
      className={`ml-1 text-xs inline-block transition-transform duration-200 ${
        sortDirection === "asc" ? "rotate-180" : ""
      }`}
    >
      &#9660;
    </span>
  );
}

// Collect all sub-score keys for a benchmark across all models
function getSubScoreKeys(models: RankedModel[], benchId: string): string[] {
  const keys = new Set<string>();
  for (const m of models) {
    const subs = m.subScores?.[benchId];
    if (subs) {
      for (const k of Object.keys(subs)) keys.add(k);
    }
  }
  return Array.from(keys);
}

// Format sub-score key for display: "spatial_construction_accuracy" → "Spatial Constr."
function formatSubKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\baccuracy\b/gi, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

export default function LeaderboardTable({
  models,
  visibleColumns,
  expandedColumns,
  bestScores,
  sortColumn,
  sortDirection,
  onSort,
}: LeaderboardTableProps) {
  const benchmarkMap = new Map(BENCHMARKS.map((b) => [b.id, b]));

  // Pre-compute sub-score keys for expanded columns
  const subScoreKeysMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const colId of expandedColumns) {
      map[colId] = getSubScoreKeys(models, colId);
    }
    return map;
  }, [models, expandedColumns]);

  const hasAnyExpanded = expandedColumns.length > 0 &&
    expandedColumns.some((c) => visibleColumns.includes(c) && (subScoreKeysMap[c]?.length ?? 0) > 0);

  let bestAvg = -Infinity;
  for (const m of models) {
    if (m.average !== null && m.average > bestAvg) bestAvg = m.average;
  }

  // Calculate total columns for empty-state colspan
  let totalCols = 3; // #, Model, Avg
  for (const colId of visibleColumns) {
    const isExpanded = expandedColumns.includes(colId) && (subScoreKeysMap[colId]?.length ?? 0) > 0;
    totalCols += isExpanded ? subScoreKeysMap[colId].length : 1;
  }

  return (
    <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {/* Row 1: group headers for expanded columns */}
          {hasAnyExpanded && (
            <tr className="border-b border-lb-border/60">
              {/* Fixed cols span both header rows */}
              <th rowSpan={2} className="sticky left-0 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap w-12">
                #
              </th>
              <th rowSpan={2} className="sticky left-12 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                Model
              </th>
              <th
                rowSpan={2}
                className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[80px] ${
                  sortColumn === "average" ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                }`}
                onClick={() => onSort("average")}
              >
                Avg
                <SortArrow column="average" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>

              {visibleColumns.map((colId) => {
                const meta = benchmarkMap.get(colId);
                const subKeys = subScoreKeysMap[colId] ?? [];
                const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;

                if (isExpanded) {
                  return (
                    <th
                      key={colId}
                      colSpan={subKeys.length}
                      className="px-4 py-2 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-lb-primary bg-lb-bg border-b border-lb-border"
                    >
                      {meta?.name ?? colId}
                    </th>
                  );
                }

                return (
                  <th
                    key={colId}
                    rowSpan={2}
                    className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[80px] ${
                      sortColumn === colId ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                    }`}
                    onClick={() => onSort(colId)}
                  >
                    {meta?.name ?? colId}
                    <SortArrow column={colId} sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                );
              })}
            </tr>
          )}

          {/* Row 2 (or only row if no expansions): sub-score headers */}
          <tr className="border-b-2 border-lb-border">
            {!hasAnyExpanded && (
              <>
                <th className="sticky left-0 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap w-12">
                  #
                </th>
                <th className="sticky left-12 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                  Model
                </th>
                <th
                  className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[80px] ${
                    sortColumn === "average" ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                  }`}
                  onClick={() => onSort("average")}
                >
                  Avg
                  <SortArrow column="average" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
              </>
            )}

            {visibleColumns.map((colId) => {
              const meta = benchmarkMap.get(colId);
              const subKeys = subScoreKeysMap[colId] ?? [];
              const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;

              if (isExpanded) {
                return subKeys.map((subKey) => {
                  const sortId = `${colId}:${subKey}`;
                  return (
                    <th
                      key={sortId}
                      className={`px-3 py-2 text-right font-medium text-[10px] tracking-normal whitespace-nowrap cursor-pointer transition-colors duration-150 bg-lb-surface ${
                        sortColumn === sortId ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                      }`}
                      onClick={() => onSort(sortId)}
                    >
                      {formatSubKey(subKey)}
                      <SortArrow column={sortId} sortColumn={sortColumn} sortDirection={sortDirection} />
                    </th>
                  );
                });
              }

              if (hasAnyExpanded) return null; // already rendered in row 1 with rowSpan=2

              return (
                <th
                  key={colId}
                  className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[80px] ${
                    sortColumn === colId ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                  }`}
                  onClick={() => onSort(colId)}
                >
                  {meta?.name ?? colId}
                  <SortArrow column={colId} sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {models.map((model, i) => (
            <tr
              key={model.name}
              className={`
                border-b border-lb-border/60
                hover:bg-lb-primary-light transition-colors duration-150
                ${i % 2 === 1 ? "bg-black/[0.01]" : ""}
              `}
            >
              <td className={`sticky left-0 z-10 px-4 py-3 ${i % 2 === 1 ? "bg-[#faf9fb]" : "bg-lb-surface"}`}>
                <RankBadge rank={model.rank} />
              </td>
              <td className={`sticky left-12 z-10 px-4 py-3 whitespace-nowrap ${i % 2 === 1 ? "bg-[#faf9fb]" : "bg-lb-surface"}`}>
                {model.link ? (
                  <a
                    href={model.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-lb-text hover:text-lb-primary transition-colors duration-150"
                  >
                    {model.displayName || model.name}
                  </a>
                ) : (
                  <span className="font-semibold text-lb-text">{model.displayName || model.name}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-mono text-sm font-semibold ${
                    model.average !== null && model.average === bestAvg
                      ? "text-lb-primary underline underline-offset-2 decoration-lb-primary/25"
                      : "text-lb-text"
                  }`}
                >
                  {model.average !== null ? model.average.toFixed(1) : "-/-"}
                </span>
              </td>

              {visibleColumns.map((colId) => {
                const subKeys = subScoreKeysMap[colId] ?? [];
                const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;

                if (isExpanded) {
                  return subKeys.map((subKey) => {
                    const val = model.subScores?.[colId]?.[subKey] ?? null;
                    return (
                      <td key={`${colId}-${subKey}`} className="px-3 py-3 text-right">
                        <span className="font-mono text-xs text-lb-text-secondary">
                          {val !== null ? val.toFixed(1) : "-"}
                        </span>
                      </td>
                    );
                  });
                }

                return (
                  <td key={colId} className="px-4 py-3 text-right">
                    <ScoreCell
                      value={model.scores[colId] ?? null}
                      isBest={
                        model.scores[colId] !== null &&
                        model.scores[colId] !== undefined &&
                        model.scores[colId] === bestScores[colId]
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          {models.length === 0 && (
            <tr>
              <td
                colSpan={totalCols}
                className="px-4 py-12 text-center text-lb-text-muted"
              >
                No models match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
