import { Protocol, Precision } from "@/lib/types";
import { PRECISION_OPTIONS } from "@/lib/constants";

interface FilterBarProps {
  protocol: Protocol;
  onProtocolChange: (p: Protocol) => void;
  precision: Precision | "all";
  onPrecisionChange: (p: Precision | "all") => void;
  showCapabilities: boolean;
  onShowCapabilitiesChange: (v: boolean) => void;
}

export default function FilterBar({
  protocol,
  onProtocolChange,
  precision,
  onPrecisionChange,
  showCapabilities,
  onShowCapabilitiesChange,
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

      {/* Capabilities toggle */}
      <div className="flex items-center gap-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
          Capabilities
        </span>
        <div className="flex rounded-md border border-lb-border overflow-hidden">
          {(["OFF", "ON"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onShowCapabilitiesChange(v === "ON")}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-150
                ${
                  (v === "ON") === showCapabilities
                    ? "bg-lb-nav text-white"
                    : "bg-lb-surface text-lb-text-secondary hover:text-lb-text hover:bg-lb-primary-light"
                }
              `}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Precision toggle */}
      {/* <div className="flex items-center gap-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
          Precision
        </span>
        <div className="flex rounded-md border border-lb-border overflow-hidden">
          {PRECISION_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => onPrecisionChange(p)}
              className={`px-3 py-1.5 text-sm font-medium font-mono transition-all duration-150
                ${
                  precision === p
                    ? "bg-lb-nav text-white"
                    : "bg-lb-surface text-lb-text-secondary hover:text-lb-text hover:bg-lb-primary-light"
                }
              `}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
}
