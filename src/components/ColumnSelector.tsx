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
  const toggleVisible = (id: string) => {
    if (visibleColumns.includes(id)) {
      onChange(visibleColumns.filter((c) => c !== id));
    } else {
      onChange([...visibleColumns, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-xs items-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted mr-sm">
        Columns
      </span>
      {BENCHMARKS.map((b) => {
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
      })}
    </div>
  );
}
