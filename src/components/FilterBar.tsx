import { Protocol, Precision, ViewMode } from "@/lib/types";
import { PRECISION_OPTIONS, CAPABILITIES } from "@/lib/constants";
import Tooltip from "./Tooltip";

interface FilterBarProps {
  protocol: Protocol;
  onProtocolChange: (p: Protocol) => void;
  precision: Precision | "all";
  onPrecisionChange: (p: Precision | "all") => void;
  showCapabilities: boolean;
  onShowCapabilitiesChange: (v: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
}

export default function FilterBar({
  protocol,
  onProtocolChange,
  precision,
  onPrecisionChange,
  showCapabilities,
  onShowCapabilitiesChange,
  viewMode,
  onViewModeChange,
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

      {/* View mode toggle */}
      <div className="flex items-center gap-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
          View
        </span>
        <div className="flex rounded-md border border-lb-border overflow-hidden">
          {(["benchmark", "taxonomy"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewModeChange(v)}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-150 capitalize
                ${
                  viewMode === v
                    ? "bg-lb-nav text-white"
                    : "bg-lb-surface text-lb-text-secondary hover:text-lb-text hover:bg-lb-primary-light"
                }
              `}
            >
              {v === "taxonomy" ? (
                <Tooltip
                  content={
                    <div>
                      <div className="text-lb-text mb-1.5">Scores are computed as the simple average of all sub-scores tagged with each taxonomy across the selected benchmarks.</div>
                      <div className="text-[10px] font-semibold text-lb-text-muted uppercase tracking-wider mb-1">Taxonomy Labels</div>
                      {CAPABILITIES.map((c) => (
                        <div key={c.abbr} className="text-[10px] leading-relaxed">
                          <span className="text-lb-primary font-semibold">{c.abbr}</span>
                          <span className="text-lb-text-muted"> — </span>
                          <span className="text-lb-text-secondary">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  }
                  showIcon
                >
                  <span>{v}</span>
                </Tooltip>
              ) : v}
            </button>
          ))}
        </div>
      </div>

      {/* Taxonomy toggle — hidden in taxonomy view mode */}
      {viewMode !== "taxonomy" && (
        <div className="flex items-center gap-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-lb-text-muted">
            Taxonomy
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
      )}
    </div>
  );
}
