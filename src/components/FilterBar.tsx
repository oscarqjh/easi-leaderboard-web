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
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-secondary">
          Protocol
        </span>
        <div className="flex">
          {(["EASI-8", "ALL"] as Protocol[]).map((p) => (
            <button
              key={p}
              onClick={() => onProtocolChange(p)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors duration-150
                ${
                  protocol === p
                    ? "bg-lb-primary text-white shadow-border-medium"
                    : "bg-lb-surface text-lb-text-secondary shadow-border-thin hover:text-lb-text"
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
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-secondary">
          Precision
        </span>
        <select
          value={precision}
          onChange={(e) => onPrecisionChange(e.target.value as Precision | "all")}
          className="px-3 py-1.5 text-sm bg-lb-surface text-lb-text shadow-border-thin
            focus:outline-none focus:shadow-border-medium
            cursor-pointer"
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
