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
    return <span className="text-lb-text-muted/40 ml-1">&#8597;</span>;
  }
  return (
    <span
      className={`ml-1 inline-block transition-transform duration-250 ${
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

  // Compute best average
  let bestAvg = -Infinity;
  for (const m of models) {
    if (m.average !== null && m.average > bestAvg) bestAvg = m.average;
  }

  return (
    <div className="bg-lb-surface shadow-border-medium overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-lb-border">
            <th className="sticky left-0 z-10 bg-lb-surface px-3 py-3 text-left font-semibold text-lb-text-secondary text-xs uppercase tracking-wider w-12">
              #
            </th>
            <th className="sticky left-12 z-10 bg-lb-surface px-3 py-3 text-left font-semibold text-lb-text-secondary text-xs uppercase tracking-wider min-w-[180px]">
              Model
            </th>
            <th
              className="px-3 py-3 text-right font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-lb-primary transition-colors duration-150 min-w-[80px]"
              onClick={() => onSort("average")}
            >
              <span className="text-lb-primary">Avg</span>
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
                  className="px-3 py-3 text-right font-semibold text-lb-text-secondary text-xs uppercase tracking-wider cursor-pointer hover:text-lb-primary transition-colors duration-150 min-w-[80px]"
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
                border-b border-lb-border/50
                hover:bg-lb-primary-light transition-colors duration-150
                ${i % 2 === 0 ? "bg-lb-surface" : "bg-lb-bg/30"}
              `}
            >
              <td className="sticky left-0 z-10 px-3 py-2.5 bg-inherit">
                <RankBadge rank={model.rank} />
              </td>
              <td className="sticky left-12 z-10 px-3 py-2.5 bg-inherit">
                <span className="font-medium text-lb-text">{model.name}</span>
                <span className="ml-2 text-xs text-lb-text-muted">
                  {model.precision}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                <ScoreCell
                  value={model.average}
                  isBest={model.average !== null && model.average === bestAvg}
                />
              </td>
              {visibleColumns.map((colId) => (
                <td key={colId} className="px-3 py-2.5 text-right">
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
                className="px-3 py-12 text-center text-lb-text-muted"
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
