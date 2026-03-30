"use client";

import { useState, useRef, useEffect } from "react";
import { BENCHMARKS } from "@/lib/constants";
import { ViewMode } from "@/lib/types";

interface ColumnSelectorProps {
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
  viewMode?: ViewMode;
}

export default function ColumnSelector({
  visibleColumns,
  onChange,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleVisible = (id: string) => {
    if (visibleColumns.includes(id)) {
      onChange(visibleColumns.filter((c) => c !== id));
    } else {
      onChange([...visibleColumns, id]);
    }
  };

  const buttons = BENCHMARKS.map((b) => {
    const active = visibleColumns.includes(b.id);
    return (
      <button
        key={b.id}
        onClick={() => toggleVisible(b.id)}
        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-200
          ${active
            ? "border-lb-primary-muted bg-lb-accent-light text-lb-primary"
            : "border-lb-border bg-lb-surface text-lb-text-muted hover:border-lb-border-emphasis hover:text-lb-text-secondary"
          }
        `}
      >
        {b.name}
      </button>
    );
  });

  // Single wrapper div to avoid Fragment breaking parent space-y-md layout
  return (
    <div>
      {/* Desktop: inline buttons */}
      <div className="hidden md:flex flex-wrap gap-xs items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mr-sm">
          Columns
        </span>
        {buttons}
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-lb-text-muted border border-lb-border rounded-md hover:border-lb-border-emphasis transition-colors"
        >
          Columns
          <span className="text-[10px]">({visibleColumns.length})</span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 bg-lb-surface border border-lb-border rounded-lg shadow-lg p-2 z-30 min-w-[200px]">
            <div className="flex flex-col gap-1">
              {buttons}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
