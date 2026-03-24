"use client";

import { useState, useMemo, useCallback } from "react";
import { ModelEntry, FilterState, Protocol, Precision, ViewMode } from "@/lib/types";
import { CapabilityMap } from "@/lib/leaderboard-fetch";
import { EASI8_IDS } from "@/lib/constants";
import {
  filterBySearch,
  filterByPrecision,
  getColumnsForProtocol,
  computeAverages,
  sortModels,
  computeBestScores,
  assignRanks,
} from "@/lib/filters";
import { computeCapabilityView, getCapabilityTooltipData } from "@/lib/capability-scores";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ColumnSelector from "./ColumnSelector";
import BarChart from "./BarChart";
import LeaderboardTable from "./LeaderboardTable";
import CapabilityTable from "./CapabilityTable";
import ExportButton from "./ExportButton";

interface OverviewClientProps {
  data: ModelEntry[];
  capabilityMap?: CapabilityMap;
}

export default function OverviewClient({ data, capabilityMap }: OverviewClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    precision: "all",
    protocol: "EASI-8",
    viewMode: "benchmark",
    visibleColumns: [...EASI8_IDS],
    expandedColumns: [],
    showCapabilities: false,
    sortColumn: "average",
    sortDirection: "desc",
  });

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleProtocolChange = (protocol: Protocol) => {
    const columns = getColumnsForProtocol(protocol);
    setFilters((prev) => ({
      ...prev,
      protocol,
      visibleColumns: columns,
      expandedColumns: prev.expandedColumns.filter((c) => columns.includes(c)),
    }));
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    setFilters((prev) => ({
      ...prev,
      viewMode,
      sortColumn: "average",
      sortDirection: "desc",
    }));
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const hasSubScores = useCallback(
    (benchId: string) => {
      return data.some(
        (m) => m.subScores && m.subScores[benchId] && Object.keys(m.subScores[benchId]).length > 0
      );
    },
    [data]
  );

  // Benchmark view data
  const rankedModels = useMemo(() => {
    let result = filterBySearch(data, filters.search);
    result = filterByPrecision(result, filters.precision);
    const withAvg = computeAverages(result, filters.visibleColumns);
    const sorted = sortModels(withAvg, filters.sortColumn, filters.sortDirection);
    return assignRanks(sorted);
  }, [data, filters]);

  const bestScores = useMemo(
    () => computeBestScores(data, filters.visibleColumns),
    [data, filters.visibleColumns]
  );

  // Capability view data
  const capabilityView = useMemo(() => {
    if (filters.viewMode !== "capability" || !capabilityMap) return null;
    return computeCapabilityView(
      rankedModels, filters.visibleColumns, capabilityMap,
      filters.sortColumn, filters.sortDirection
    );
  }, [filters.viewMode, filters.visibleColumns, capabilityMap, rankedModels, filters.sortColumn, filters.sortDirection]);

  const capabilityTooltips = useMemo((): Record<string, React.ReactNode> => {
    if (!capabilityView || !capabilityMap) return {};
    const tooltips: Record<string, React.ReactNode> = {};
    for (const label of capabilityView.labels) {
      const tooltipData = getCapabilityTooltipData(label, filters.visibleColumns, capabilityMap);
      if (tooltipData.benchmarks.length === 0) {
        tooltips[label] = (
          <span className="text-lb-text-muted">
            No sub-scores mapped to <strong className="text-lb-text">{label.toUpperCase()}</strong> in selected benchmarks
          </span>
        );
      } else {
        tooltips[label] = (
          <div>
            <div className="font-semibold text-lb-text mb-1.5">
              {label.toUpperCase()} <span className="font-normal text-lb-text-muted">— contributing sub-scores</span>
            </div>
            {tooltipData.benchmarks.map((b) => (
              <div key={b.benchId} className="mb-1.5 last:mb-0">
                <div className="text-lb-primary font-medium text-[10px] uppercase tracking-wider mb-0.5">
                  {b.benchId.replace(/_/g, " ")}
                </div>
                {b.subKeys.map((sk) => (
                  <div key={sk} className="pl-2 text-lb-text-secondary font-mono text-[10px] leading-snug">
                    {sk.replace(/_/g, " ").replace(/\baccuracy\b/gi, "").trim()}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
    }
    return tooltips;
  }, [capabilityView, capabilityMap, filters.visibleColumns]);

  // Bar chart data — use capability averages when in capability mode
  const barChartModels = useMemo(() => {
    if (filters.viewMode === "capability" && capabilityView) {
      return capabilityView.rows.map((r) => ({
        ...r.model,
        rank: r.rank,
        average: r.capAverage,
      }));
    }
    return rankedModels;
  }, [filters.viewMode, capabilityView, rankedModels]);

  return (
    <div className="space-y-md animate-fade-in-up">
      {/* Controls */}
      <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-md space-y-md">
        <SearchBar
          value={filters.search}
          onChange={(v) => updateFilter("search", v)}
        />
        <FilterBar
          protocol={filters.protocol}
          onProtocolChange={handleProtocolChange}
          precision={filters.precision}
          onPrecisionChange={(v) => updateFilter("precision", v)}
          showCapabilities={filters.showCapabilities}
          onShowCapabilitiesChange={(v) => updateFilter("showCapabilities", v)}
          viewMode={filters.viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <ColumnSelector
          visibleColumns={filters.visibleColumns}
          expandedColumns={filters.expandedColumns}
          onChange={(v) => updateFilter("visibleColumns", v)}
          onExpandedChange={(v) => updateFilter("expandedColumns", v)}
          hasSubScores={hasSubScores}
          viewMode={filters.viewMode}
        />
      </div>

      {/* Bar Chart */}
      <BarChart models={barChartModels} />

      {/* Export + Table */}
      <div className="flex justify-end relative z-20">
        <ExportButton
          models={rankedModels}
          visibleColumns={filters.visibleColumns}
          expandedColumns={filters.expandedColumns}
          showCapabilities={filters.showCapabilities}
          capabilityMap={capabilityMap}
          viewMode={filters.viewMode}
          capabilityRows={capabilityView?.rows}
          capLabels={capabilityView?.labels}
        />
      </div>

      {filters.viewMode === "capability" && capabilityView ? (
        <CapabilityTable
          rows={capabilityView.rows}
          capLabels={capabilityView.labels}
          sortColumn={filters.sortColumn}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          capabilityTooltips={capabilityTooltips}
        />
      ) : (
        <LeaderboardTable
          models={rankedModels}
          visibleColumns={filters.visibleColumns}
          expandedColumns={filters.expandedColumns}
          bestScores={bestScores}
          sortColumn={filters.sortColumn}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          showCapabilities={filters.showCapabilities}
          capabilityMap={capabilityMap}
        />
      )}
    </div>
  );
}
