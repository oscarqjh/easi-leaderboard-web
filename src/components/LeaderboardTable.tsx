import { RankedModel, SortDirection } from "@/lib/types";
import { BENCHMARKS } from "@/lib/constants";
import ScoreCell from "./ScoreCell";
import RankBadge from "./RankBadge";

interface LeaderboardTableProps {
  models: RankedModel[];
  visibleColumns: string[];
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

export default function LeaderboardTable({
  models,
  visibleColumns,
  bestScores,
  sortColumn,
  sortDirection,
  onSort,
}: LeaderboardTableProps) {
  const benchmarkMap = new Map(BENCHMARKS.map((b) => [b.id, b]));

  let bestAvg = -Infinity;
  for (const m of models) {
    if (m.average !== null && m.average > bestAvg) bestAvg = m.average;
  }

  return (
    <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-lb-border">
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
              <SortArrow
                column="average"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </th>
            {visibleColumns.map((colId) => {
              const meta = benchmarkMap.get(colId);
              return (
                <th
                  key={colId}
                  className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[80px] ${
                    sortColumn === colId ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                  }`}
                  onClick={() => onSort(colId)}
                >
                  {meta?.name ?? colId}
                  <SortArrow
                    column={colId}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
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
              {visibleColumns.map((colId) => (
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
              ))}
            </tr>
          ))}
          {models.length === 0 && (
            <tr>
              <td
                colSpan={visibleColumns.length + 3}
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
