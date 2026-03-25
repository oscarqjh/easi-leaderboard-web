"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import OverviewClient from "@/components/OverviewClient";
import { ModelEntry } from "@/lib/types";

const CITATION = `@article{easi2025,
  title={Holistic Evaluation of Multimodal LLMs on Spatial Intelligence},
  author={Cai, Zhongang and Wang, Yubo and Sun, Qingping and Wang, Ruisi and Gu, Chenyang and Yin, Wanqi and Lin, Zhiqian and Yang, Zhitao and Wei, Chen and Shi, Xuanke and Deng, Kewang and Han, Xiaoyang and Chen, Zukai and Li, Jiaqi and Fan, Xiangyu and Deng, Hanming and Lu, Lewei and Li, Bo and Liu, Ziwei and Wang, Quan and Lin, Dahua and Yang, Lei},
  journal={arXiv preprint arXiv:2508.13142},
  year={2025}
}`;

const EXTERNAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/EvolvingLMMs-Lab/EASI",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
  {
    label: "arXiv Paper",
    href: "https://arxiv.org/abs/2508.13142",
    icon: (
      <img src="/arxiv-logomark-small.svg" alt="arXiv" className="w-4 h-4" />
    ),
  },
  {
    label: "HuggingFace",
    href: "https://huggingface.co/spaces/lmms-lab-si/EASI-Leaderboard",
    icon: <span className="text-sm">🤗</span>,
  },
];

export default function LeaderboardPage() {
  const [data, setData] = useState<ModelEntry[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [capabilityMap, setCapabilityMap] = useState<Record<string, Record<string, string[]>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(CITATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

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
            setCapabilityMap(json.capabilityMap || {});
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
    <div>
      <div className="max-w-7xl mx-auto px-md py-lg">
        <div className="mb-lg animate-fade-in-up">
          <h1 className="font-heading text-heading font-semibold text-lb-text">
            EASI: Evaluation of MLLMs
            <br />
            <em className="text-lb-primary italic">on Spatial Intelligence</em>
          </h1>
          <p className="mt-sm text-sm text-lb-text-muted mb-4">
            Last updated: {formattedDate} &middot; {data.length} models evaluated
          </p>
          <p className="text-sm text-lb-text-secondary leading-relaxed max-w-3xl">
            Comprehensive benchmark for spatial intelligence across six cognitive dimensions.
            Have evaluation results? <Link href="/submit" className="text-lb-primary font-medium hover:underline underline-offset-2">Submit your model</Link> to appear on the leaderboard.
          </p>
        </div>
        <OverviewClient data={data} capabilityMap={capabilityMap} />
      </div>

      {/* ── Citation ── */}
      <section className="bg-lb-surface py-16 px-md">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-6">
            Citation
          </h2>
          <div className="relative bg-lb-bg border border-lb-border rounded-lg shadow-sm p-md">
            <pre className="font-mono text-xs text-lb-text overflow-x-auto whitespace-pre leading-relaxed">
              {CITATION}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1 text-xs font-medium rounded-md bg-lb-nav text-white hover:opacity-90 transition-opacity duration-150 focus-ring"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Links ── */}
      <section className="bg-lb-bg border-t border-lb-border py-12 px-md">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {EXTERNAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-lb-surface border border-lb-border rounded-lg text-sm font-medium text-lb-text-secondary hover:border-lb-border-emphasis hover:text-lb-text hover:shadow-md transition-all duration-150 focus-ring"
              >
                {link.icon}
                {link.label}
                <span className="text-lb-text-muted">&rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
