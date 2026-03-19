"use client";

import { useState } from "react";
import { RankedModel } from "@/lib/types";

interface BarChartProps {
  models: RankedModel[];
  maxCount?: number;
}

export default function BarChart({ models, maxCount = 10 }: BarChartProps) {
  const [collapsed, setCollapsed] = useState(false);

  const displayed = models.slice(0, maxCount);
  const maxScore = Math.max(...displayed.map((m) => m.average ?? 0));

  return (
    <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-md">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-sm text-xs font-semibold uppercase tracking-widest text-lb-text-muted hover:text-lb-text-secondary transition-colors duration-150"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
        Score Overview
      </button>

      {!collapsed && (
        <div className="space-y-2.5 mt-md">
          {displayed.map((model, i) => {
            const pct =
              model.average !== null && maxScore > 0
                ? (model.average / maxScore) * 100
                : 0;
            return (
              <div key={model.name} className="flex items-center gap-sm">
                <span className="w-36 text-xs font-medium text-lb-text-secondary truncate text-right">
                  {model.displayName || model.name}
                </span>
                <div className="flex-1 h-5 bg-lb-bg rounded-sm border border-lb-border overflow-hidden">
                  <div
                    className="h-full bg-lb-nav rounded-sm animate-bar-grow"
                    style={{
                      width: `${pct}%`,
                      animationDelay: `${i * 30}ms`,
                      opacity: 1 - i * 0.05,
                    }}
                  />
                </div>
                <span className="w-12 text-xs font-mono font-medium text-lb-text text-right">
                  {model.average !== null ? model.average.toFixed(1) : "-/-"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
