import { Protocol, Precision } from "@/lib/types";
import { PRECISION_OPTIONS } from "@/lib/constants";

interface FilterBarProps {
  protocol: Protocol;
  onProtocolChange: (p: Protocol) => void;
  precision: Precision | "all";
  onPrecisionChange: (p: Precision | "all") => void;
}

export default function FilterBar({
  protocol,
  onProtocolChange,
  precision,
  onPrecisionChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-md">
      {/* Protocol toggle */}
      <div className="flex items-center gap-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
          Protocol
        </span>
        <div className="flex rounded-md border border-lb-border overflow-hidden">
          {(["EASI-8", "ALL"] as Protocol[]).map((p) => (
            <button
              key={p}
              onClick={() => onProtocolChange(p)}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-150
                ${
                  protocol === p
                    ? "bg-lb-nav text-white"
                    : "bg-lb-surface text-lb-text-secondary hover:text-lb-text hover:bg-lb-primary-light"
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Precision select */}
      <div className="flex items-center gap-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
          Precision
        </span>
        <select
          value={precision}
          onChange={(e) => onPrecisionChange(e.target.value as Precision | "all")}
          className="px-3 py-1.5 text-sm bg-lb-surface text-lb-text rounded-md
            border border-lb-border
            focus:outline-none focus:border-lb-border-emphasis focus:ring-2 focus:ring-lb-primary-light
            cursor-pointer transition-all duration-200"
        >
          {PRECISION_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? "All" : p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
