"use client";

import { useState, useMemo, useCallback } from "react";
import { ModelEntry, FilterState, Protocol, Precision } from "@/lib/types";
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
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ColumnSelector from "./ColumnSelector";
import BarChart from "./BarChart";
import LeaderboardTable from "./LeaderboardTable";
import ExportButton from "./ExportButton";

interface OverviewClientProps {
  data: ModelEntry[];
}

export default function OverviewClient({ data }: OverviewClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    precision: "all",
    protocol: "EASI-8",
    visibleColumns: [...EASI8_IDS],
    expandedColumns: [],
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

  // Check if any model has sub-scores for a given benchmark
  const hasSubScores = useCallback(
    (benchId: string) => {
      return data.some(
        (m) => m.subScores && m.subScores[benchId] && Object.keys(m.subScores[benchId]).length > 0
      );
    },
    [data]
  );

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
        />
        <ColumnSelector
          visibleColumns={filters.visibleColumns}
          expandedColumns={filters.expandedColumns}
          onChange={(v) => updateFilter("visibleColumns", v)}
          onExpandedChange={(v) => updateFilter("expandedColumns", v)}
          hasSubScores={hasSubScores}
        />
      </div>

      {/* Bar Chart */}
      <BarChart models={rankedModels} />

      {/* Table */}
      {/* <div className="flex justify-end relative z-20">
        <ExportButton models={rankedModels} visibleColumns={filters.visibleColumns} expandedColumns={filters.expandedColumns} />
      </div> */}
      <LeaderboardTable
        models={rankedModels}
        visibleColumns={filters.visibleColumns}
        expandedColumns={filters.expandedColumns}
        bestScores={bestScores}
        sortColumn={filters.sortColumn}
        sortDirection={filters.sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
