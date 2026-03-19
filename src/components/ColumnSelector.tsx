import { BENCHMARKS } from "@/lib/constants";

interface ColumnSelectorProps {
  visibleColumns: string[];
  expandedColumns: string[];
  onChange: (columns: string[]) => void;
  onExpandedChange: (columns: string[]) => void;
  hasSubScores: (benchId: string) => boolean;
}

export default function ColumnSelector({
  visibleColumns,
  expandedColumns,
  onChange,
  onExpandedChange,
  hasSubScores,
}: ColumnSelectorProps) {
  const toggleVisible = (id: string) => {
    if (visibleColumns.includes(id)) {
      onChange(visibleColumns.filter((c) => c !== id));
      if (expandedColumns.includes(id)) {
        onExpandedChange(expandedColumns.filter((c) => c !== id));
      }
    } else {
      onChange([...visibleColumns, id]);
    }
  };

  const setDetail = (id: string, mode: "agg" | "det") => {
    if (mode === "det" && !expandedColumns.includes(id)) {
      onExpandedChange([...expandedColumns, id]);
    } else if (mode === "agg" && expandedColumns.includes(id)) {
      onExpandedChange(expandedColumns.filter((c) => c !== id));
    }
  };

  return (
    <div className="flex flex-wrap gap-xs items-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mr-sm">
        Columns
      </span>
      {BENCHMARKS.map((b) => {
        const active = visibleColumns.includes(b.id);
        const expanded = expandedColumns.includes(b.id);
        const hasSub = hasSubScores(b.id);
        const showToggle = active && hasSub;

        return (
          <div
            key={b.id}
            className={`inline-flex items-center rounded-md border overflow-hidden transition-all duration-200
              ${
                expanded
                  ? "border-lb-primary bg-lb-accent-light"
                  : active
                  ? "border-lb-primary-muted bg-lb-accent-light"
                  : "border-lb-border bg-lb-surface hover:border-lb-border-emphasis"
              }
            `}
          >
            {/* Benchmark name — toggles visibility */}
            <button
              onClick={() => toggleVisible(b.id)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors duration-150
                ${
                  active
                    ? "text-lb-primary"
                    : "text-lb-text-muted hover:text-lb-text-secondary"
                }
              `}
            >
              {b.name}
            </button>

            {/* AGG / DET segmented toggle — expands rightward when active + has sub-scores */}
            <div
              className="flex self-stretch overflow-hidden transition-all duration-300 ease-out border-l border-lb-primary-muted"
              style={{
                maxWidth: showToggle ? "100px" : "0px",
                opacity: showToggle ? 1 : 0,
                borderLeftWidth: showToggle ? "1px" : "0px",
              }}
            >
              <button
                onClick={() => setDetail(b.id, "agg")}
                className={`px-1.5 text-[9px] font-bold transition-all duration-150
                  ${
                    !expanded
                      ? "bg-lb-primary text-white"
                      : "bg-transparent text-lb-primary hover:bg-lb-primary-muted"
                  }
                `}
              >
                AGG
              </button>
              <button
                onClick={() => setDetail(b.id, "det")}
                className={`px-1.5 text-[9px] font-bold transition-all duration-150
                  ${
                    expanded
                      ? "bg-lb-primary text-white"
                      : "bg-transparent text-lb-primary hover:bg-lb-primary-muted"
                  }
                `}
              >
                SUB
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
