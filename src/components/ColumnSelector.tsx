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
    <div className="flex flex-wrap gap-xs">
      <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-secondary self-center mr-sm">
        Columns
      </span>
      {BENCHMARKS.map((b) => {
        const active = visibleColumns.includes(b.id);
        return (
          <button
            key={b.id}
            onClick={() => toggle(b.id)}
            className={`px-2 py-1 text-xs font-medium transition-colors duration-150
              ${
                active
                  ? "bg-lb-primary-light text-lb-primary shadow-border-thin"
                  : "bg-lb-bg text-lb-text-muted hover:text-lb-text-secondary"
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
