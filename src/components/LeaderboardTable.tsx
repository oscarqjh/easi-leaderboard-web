import { useMemo } from "react";
import { RankedModel, SortDirection, Backend } from "@/lib/types";
import { CapabilityMap } from "@/lib/leaderboard-fetch";
import { BENCHMARKS } from "@/lib/constants";
import ScoreCell from "./ScoreCell";
import RankBadge from "./RankBadge";

const BACKEND_STYLES: Record<Backend, { label: string; className: string }> = {
  vlmevalkit: { label: "VLMEvalKit", className: "bg-lb-primary-light text-lb-primary border-lb-primary-muted" },
  lmmseval: { label: "LMMsEval", className: "bg-lb-bg text-lb-primary border-lb-border-emphasis" },
  others: { label: "Other", className: "bg-lb-bg text-lb-text-muted border-lb-border" },
};

function BackendBadge({ backend }: { backend: Backend }) {
  const style = BACKEND_STYLES[backend] ?? BACKEND_STYLES.others;
  return (
    <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded border ${style.className}`}>
      {style.label}
    </span>
  );
}

interface LeaderboardTableProps {
  models: RankedModel[];
  visibleColumns: string[];
  expandedColumns: string[];
  bestScores: Record<string, number>;
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  onExpandedChange: (columns: string[]) => void;
  showCapabilities?: boolean;
  capabilityMap?: CapabilityMap;
}

function SortIcon({
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  column: string;
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
}) {
  const isActive = column === sortColumn;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSort(column); }}
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm transition-all duration-150 flex-shrink-0 ${
        isActive
          ? "text-lb-primary"
          : "text-lb-text-muted/40 hover:text-lb-primary hover:bg-lb-primary-light"
      }`}
      title={`Sort by ${column}`}
    >
      {isActive ? (
        <span className={`text-[10px] inline-block transition-transform duration-200 ${
          sortDirection === "asc" ? "rotate-180" : ""
        }`}>&#9660;</span>
      ) : (
        <span className="text-[10px]">&#8597;</span>
      )}
    </button>
  );
}

function ExpandChevron({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex items-center justify-center w-5 h-4 rounded transition-all duration-150 ${
        expanded
          ? "text-lb-primary bg-lb-primary-light"
          : "text-lb-text-muted hover:text-lb-primary hover:bg-lb-primary-light"
      }`}
      title={expanded ? "Collapse sub-scores" : "Expand sub-scores"}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      >
        <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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
  onExpandedChange,
  showCapabilities,
  capabilityMap,
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

  const showCapRow = showCapabilities && hasAnyExpanded && !!capabilityMap;
  // When showing capabilities, non-expanded columns need rowSpan=3 (group header + sub headers + capability row)
  const fixedRowSpan = showCapRow ? 3 : hasAnyExpanded ? 2 : 1;

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
              <th rowSpan={fixedRowSpan} className="sticky left-0 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap w-12">
                #
              </th>
              <th rowSpan={fixedRowSpan} className="sticky left-12 z-10 bg-lb-surface px-4 py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                Model
              </th>
              <th
                rowSpan={fixedRowSpan}
                className="px-3 py-0 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap min-w-[80px]"
              >
                <div className="flex flex-col items-center py-2.5">
                  <div className="flex items-center gap-1">
                    <span className={sortColumn === "average" ? "text-lb-primary" : "text-lb-text-muted"}>Avg</span>
                    <SortIcon column="average" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                  </div>
                </div>
              </th>

              {visibleColumns.map((colId) => {
                const meta = benchmarkMap.get(colId);
                const subKeys = subScoreKeysMap[colId] ?? [];
                const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;
                const colHasSubScores = (subKeys.length > 0) || getSubScoreKeys(models, colId).length > 0;

                if (isExpanded) {
                  return (
                    <th
                      key={colId}
                      colSpan={subKeys.length}
                      className="px-4 py-2 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-lb-primary bg-lb-bg border-b border-lb-border border-l-2 border-l-lb-border-emphasis"
                    >
                      <div className="flex items-center justify-center gap-1">
                        {meta?.name ?? colId}
                        <ExpandChevron
                          expanded={true}
                          onClick={() => onExpandedChange(expandedColumns.filter((c) => c !== colId))}
                        />
                      </div>
                    </th>
                  );
                }

                return (
                  <th
                    key={colId}
                    rowSpan={fixedRowSpan}
                    className="px-3 py-0 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap min-w-[80px]"
                  >
                    <div className="flex flex-col items-center pt-2.5 pb-1 gap-0.5">
                      <div className="relative flex items-center justify-center">
                        <span className={sortColumn === colId ? "text-lb-primary" : "text-lb-text-muted"}>
                          {meta?.name ?? colId}
                        </span>
                        <span className="absolute -right-5 top-0 -translate-y-0.5">
                          <SortIcon column={colId} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                        </span>
                      </div>
                      {colHasSubScores && (
                        <ExpandChevron
                          expanded={false}
                          onClick={() => onExpandedChange([...expandedColumns, colId])}
                        />
                      )}
                    </div>
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
                <th className="px-3 py-0 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                  <div className="flex flex-col items-center py-2.5">
                    <div className="flex items-center gap-1">
                      <span className={sortColumn === "average" ? "text-lb-primary" : "text-lb-text-muted"}>Avg</span>
                      <SortIcon column="average" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                    </div>
                  </div>
                </th>
              </>
            )}

            {visibleColumns.map((colId) => {
              const meta = benchmarkMap.get(colId);
              const subKeys = subScoreKeysMap[colId] ?? [];
              const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;
              const colHasSubScores = (subKeys.length > 0) || getSubScoreKeys(models, colId).length > 0;

              if (isExpanded) {
                return subKeys.map((subKey, subIdx) => {
                  const sortId = `${colId}:${subKey}`;
                  return (
                    <th
                      key={sortId}
                      className={`px-3 py-2 text-center font-medium text-[10px] tracking-normal whitespace-nowrap bg-lb-surface ${
                        sortColumn === sortId ? "text-lb-primary" : "text-lb-text-muted"
                      } ${subIdx === 0 ? "border-l-2 border-l-lb-border-emphasis" : ""}`}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        <span>{formatSubKey(subKey)}</span>
                        <SortIcon column={sortId} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                      </div>
                    </th>
                  );
                });
              }

              if (hasAnyExpanded) return null; // already rendered in row 1 with rowSpan

              return (
                <th
                  key={colId}
                  className="px-3 py-0 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap min-w-[80px]"
                >
                  <div className="flex flex-col items-center pt-2.5 pb-1 gap-0.5">
                    <div className="relative flex items-center justify-center">
                      <span className={sortColumn === colId ? "text-lb-primary" : "text-lb-text-muted"}>
                        {meta?.name ?? colId}
                      </span>
                      <span className="absolute -right-5 top-0 -translate-y-0.5">
                        <SortIcon column={colId} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                      </span>
                    </div>
                    {colHasSubScores && (
                      <ExpandChevron
                        expanded={false}
                        onClick={() => onExpandedChange([...expandedColumns, colId])}
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>

          {/* Row 3: Capability labels (when showCapabilities + expanded) */}
          {showCapRow && (
            <tr className="border-b border-lb-border">
              {visibleColumns.map((colId) => {
                const subKeys = subScoreKeysMap[colId] ?? [];
                const isExpanded = expandedColumns.includes(colId) && subKeys.length > 0;

                if (isExpanded) {
                  return subKeys.map((subKey, subIdx) => {
                    const caps = capabilityMap?.[colId]?.[subKey] ?? [];
                    return (
                      <th
                        key={`cap-${colId}-${subKey}`}
                        className={`px-3 py-0.5 text-center bg-lb-surface ${subIdx === 0 ? "border-l-2 border-l-lb-border-emphasis" : ""}`}
                      >
                        <span className={`text-[9px] font-medium uppercase ${caps.length > 0 ? "text-lb-primary" : "text-lb-text-muted"}`}>
                          {caps.length > 0 ? caps.join(" · ") : "–"}
                        </span>
                      </th>
                    );
                  });
                }

                return null;
              })}
            </tr>
          )}
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
                {model.backend && (
                  <BackendBadge backend={model.backend} />
                )}
              </td>
              <td className="px-4 py-3 text-center">
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
                      <td key={`${colId}-${subKey}`} className="px-3 py-3 text-center">
                        <span className="font-mono text-xs text-lb-text-secondary">
                          {val !== null ? val.toFixed(1) : "-"}
                        </span>
                      </td>
                    );
                  });
                }

                return (
                  <td key={colId} className="px-4 py-3 text-center">
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
