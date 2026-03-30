import React from "react";
import { SortDirection, Backend } from "@/lib/types";
import { ModelCapabilityRow } from "@/lib/capability-scores";
import RankBadge from "./RankBadge";
import Tooltip from "./Tooltip";

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

function formatScore(v: number | null): string {
  return v !== null && v !== undefined ? v.toFixed(1) : "-";
}

interface CapabilityTableProps {
  rows: ModelCapabilityRow[];
  capLabels: string[];
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  capabilityTooltips: Record<string, React.ReactNode>;
}

export default function CapabilityTable({
  rows,
  capLabels,
  sortColumn,
  sortDirection,
  onSort,
  capabilityTooltips,
}: CapabilityTableProps) {
  // Find best scores per capability
  const bestCaps: Record<string, number> = {};
  for (const label of capLabels) {
    let best = -Infinity;
    for (const row of rows) {
      const v = row.capabilities[label]?.value;
      if (v !== null && v !== undefined && v > best) best = v;
    }
    if (best > -Infinity) bestCaps[label] = best;
  }

  let bestAvg = -Infinity;
  for (const row of rows) {
    if (row.capAverage !== null && row.capAverage > bestAvg) bestAvg = row.capAverage;
  }

  return (
    <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-[11px] md:text-sm">
        <thead>
          <tr className="border-b-2 border-lb-border">
            <th className="sticky left-0 z-10 bg-lb-surface px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap w-10 md:w-12">
              #
            </th>
            <th className="sticky left-10 md:left-12 z-10 bg-lb-surface px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap md:min-w-[180px]">
              Model
            </th>
            <th
              className={`px-2 py-2 md:px-4 md:py-3 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[70px] md:min-w-[80px] ${
                sortColumn === "average" ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
              }`}
              onClick={() => onSort("average")}
            >
              Avg
              <SortArrow column="average" sortColumn={sortColumn} sortDirection={sortDirection} />
            </th>
            {capLabels.map((label) => (
              <th
                key={label}
                className={`px-2 py-2 md:px-4 md:py-3 text-center font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-150 min-w-[70px] md:min-w-[80px] ${
                  sortColumn === label ? "text-lb-primary" : "text-lb-text-muted hover:text-lb-text-secondary"
                }`}
                onClick={() => onSort(label)}
              >
                <Tooltip content={capabilityTooltips[label]} showIcon>
                  <span>{label.toUpperCase()}</span>
                </Tooltip>
                <SortArrow column={label} sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const model = row.model;
            return (
              <tr
                key={model.name}
                className={`
                  border-b border-lb-border/60
                  hover:bg-lb-primary-light transition-colors duration-150
                  ${i % 2 === 1 ? "bg-black/[0.01]" : ""}
                `}
              >
                <td className={`sticky left-0 z-10 px-2 py-2 md:px-4 md:py-3 ${i % 2 === 1 ? "bg-[#faf9fb]" : "bg-lb-surface"}`}>
                  <RankBadge rank={row.rank} />
                </td>
                <td className={`sticky left-10 md:left-12 z-10 px-2 py-2 md:px-4 md:py-3 ${i % 2 === 1 ? "bg-[#faf9fb]" : "bg-lb-surface"}`}>
                  <div className="max-w-[130px] md:max-w-none line-clamp-2 md:line-clamp-none md:whitespace-nowrap">
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
                    <span className="hidden md:inline">
                      {model.backend && <BackendBadge backend={model.backend} />}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 md:px-4 md:py-3 text-center">
                  <span
                    className={`font-mono text-sm font-semibold ${
                      row.capAverage !== null && row.capAverage === bestAvg
                        ? "text-lb-primary underline underline-offset-2 decoration-lb-primary/25"
                        : "text-lb-text"
                    }`}
                  >
                    {formatScore(row.capAverage)}
                  </span>
                </td>
                {capLabels.map((label) => {
                  const cs = row.capabilities[label];
                  const isBest = cs?.value !== null && cs?.value !== undefined && cs?.value === bestCaps[label];
                  const scoreEl = (
                    <span
                      className={`font-mono text-sm ${
                        cs?.value === null
                          ? "text-lb-text-muted"
                          : isBest
                          ? "font-semibold text-lb-primary underline underline-offset-2 decoration-lb-primary/25"
                          : "text-lb-text"
                      }`}
                    >
                      {formatScore(cs?.value ?? null)}
                    </span>
                  );

                  let tooltipContent: React.ReactNode = null;
                  if (cs?.missingInfo === "no-mapping") {
                    tooltipContent = (
                      <span className="text-lb-text-muted">
                        No sub-scores mapped to <strong className="text-lb-text">{label.toUpperCase()}</strong> in selected benchmarks
                      </span>
                    );
                  } else if (cs?.missingInfo === "missing-subscores" && cs.missingDetails) {
                    const grouped: Record<string, string[]> = {};
                    for (const d of cs.missingDetails) {
                      if (!grouped[d.benchId]) grouped[d.benchId] = [];
                      grouped[d.benchId].push(d.subKey);
                    }
                    tooltipContent = (
                      <div>
                        <div className="font-semibold text-lb-text mb-1">
                          {label.toUpperCase()} <span className="font-normal text-lb-text-muted">— cannot be computed</span>
                        </div>
                        <div className="text-lb-text-secondary text-[10px] mb-1.5">
                          Missing sub-scores for this taxonomy:
                        </div>
                        {Object.entries(grouped).map(([benchId, subKeys]) => (
                          <div key={benchId} className="mb-1.5 last:mb-0">
                            <div className="text-lb-primary font-medium text-[10px] uppercase tracking-wider mb-0.5">
                              {benchId.replace(/_/g, " ")}
                            </div>
                            {subKeys.map((sk) => (
                              <div key={sk} className="pl-2 text-lb-text-secondary font-mono text-[10px] leading-snug">
                                {sk.replace(/_/g, " ").replace(/\baccuracy\b/gi, "").trim()}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <td key={label} className="px-2 py-2 md:px-4 md:py-3 text-center">
                      {tooltipContent ? (
                        <Tooltip content={tooltipContent} showIcon>
                          {scoreEl}
                        </Tooltip>
                      ) : scoreEl}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={capLabels.length + 3}
                className="px-4 py-12 text-center text-lb-text-muted"
              >
                No models match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-center text-[10px] text-lb-text-muted py-1.5 md:hidden">
        ← swipe to see more benchmarks →
      </p>
    </div>
  );
}
