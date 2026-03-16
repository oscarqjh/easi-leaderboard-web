import { BENCHMARKS } from "@/lib/constants";

interface ColumnSelectorProps {
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
}

export default function ColumnSelector({
  visibleColumns,
  onChange,
}: ColumnSelectorProps) {
  const toggle = (id: string) => {
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
            onClick={() => toggle(b.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150
              ${
                active
                  ? "bg-lb-accent-light border-lb-primary-muted text-lb-primary"
                  : "bg-lb-surface border-lb-border text-lb-text-muted hover:text-lb-text-secondary hover:border-lb-border-emphasis"
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
