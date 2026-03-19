"use client";

import { useState, useEffect } from "react";
import OverviewClient from "@/components/OverviewClient";
import { ModelEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [data, setData] = useState<ModelEntry[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("/api/leaderboard");
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error || `Server error (${res.status})`);
          }
          const json = await res.json();
          if (!cancelled) {
            setData(json.data);
            setLastUpdated(json.lastUpdated || "");
            setError(null);
            setLoading(false);
          }
          return;
        } catch (err) {
          if (attempt === 2) {
            if (!cancelled) {
              setError((err as Error).message || "Failed to load leaderboard data.");
              setLoading(false);
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-md py-lg">
        <div className="mb-lg animate-fade-in-up">
          <div className="h-10 w-80 bg-lb-border/40 rounded-md animate-pulse mb-3" />
          <div className="h-4 w-48 bg-lb-border/30 rounded-md animate-pulse" />
        </div>
        <div className="space-y-md">
          <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-md space-y-md">
            <div className="h-10 bg-lb-border/30 rounded-md animate-pulse" />
            <div className="h-8 w-64 bg-lb-border/30 rounded-md animate-pulse" />
          </div>
          <div className="h-64 bg-lb-surface border border-lb-border rounded-lg animate-pulse" />
          <div className="h-96 bg-lb-surface border border-lb-border rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-md py-lg">
        <div className="mb-lg">
          <h1 className="font-heading text-heading font-semibold text-lb-text">
            EASI: Evaluation of MLLMs
            <br />
            <em className="text-lb-primary italic">on Spatial Intelligence</em>
          </h1>
        </div>
        <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-8 text-center">
          <div className="font-heading text-lg font-semibold text-lb-text mb-2">
            Unable to load leaderboard data
          </div>
          <p className="text-sm text-lb-text-secondary mb-4">
            {error || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium bg-lb-nav text-white rounded-md hover:opacity-90 transition-opacity duration-150"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="max-w-7xl mx-auto px-md py-lg">
      <div className="mb-lg animate-fade-in-up">
        <h1 className="font-heading text-heading font-semibold text-lb-text">
          EASI: Evaluation of MLLMs
          <br />
          <em className="text-lb-primary italic">on Spatial Intelligence</em>
        </h1>
        <p className="mt-sm text-sm text-lb-text-muted">
          Last updated: {formattedDate} &middot; {data.length} models evaluated
        </p>
      </div>
      <OverviewClient data={data} />
    </div>
  );
}
