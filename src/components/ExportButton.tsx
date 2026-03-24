"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LuDownload } from "react-icons/lu";
import { RankedModel } from "@/lib/types";
import { CapabilityMap } from "@/lib/leaderboard-fetch";
import { exportCsv, exportJsonl, exportLatex, downloadFile } from "@/lib/export";

interface ExportButtonProps {
  models: RankedModel[];
  visibleColumns: string[];
  expandedColumns?: string[];
  showCapabilities?: boolean;
  capabilityMap?: CapabilityMap;
}

export default function ExportButton({ models, visibleColumns, expandedColumns = [], showCapabilities = false, capabilityMap }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = useCallback(
    (format: "csv" | "jsonl" | "latex") => {
      setOpen(false);
      switch (format) {
        case "csv":
          downloadFile(exportCsv(models, visibleColumns, expandedColumns), "easi-leaderboard.csv", "text/csv");
          break;
        case "jsonl":
          downloadFile(exportJsonl(models, visibleColumns, expandedColumns), "easi-leaderboard.jsonl", "application/jsonl");
          break;
        case "latex":
          downloadFile(exportLatex(models, visibleColumns, expandedColumns, showCapabilities ? capabilityMap : undefined), "easi-leaderboard.tex", "application/x-tex");
          break;
      }
    },
    [models, visibleColumns, expandedColumns, showCapabilities, capabilityMap]
  );

  const options = [
    { key: "csv" as const, label: "Export as CSV" },
    { key: "jsonl" as const, label: "Export as JSONL" },
    { key: "latex" as const, label: "Export as LaTeX" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-lb-border
          bg-lb-surface text-lb-text-secondary hover:text-lb-text hover:border-lb-border-emphasis
          transition-all duration-150"
      >
        <LuDownload className="w-3.5 h-3.5" />
        Export
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-lb-surface border border-lb-border rounded-lg shadow-lg z-50 py-1 animate-fade-in-up">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleExport(opt.key)}
              className="w-full text-left px-4 py-2 text-sm text-lb-text-secondary hover:bg-lb-primary-light hover:text-lb-text transition-colors duration-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
