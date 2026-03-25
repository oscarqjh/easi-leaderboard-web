"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { CAPABILITIES, BENCHMARKS } from "@/lib/constants";
import { useReveal } from "@/hooks/useReveal";

const EASI8_BENCHMARKS = BENCHMARKS.filter((b) => b.isEasi8);

const BENCHMARK_DETAILS: Record<string, string> = {
  "VSI-Bench": "Visual-Spatial Intelligence",
  "MMSI-Bench": "Multi-Modal Spatial Intelligence",
  "MindCube-Tiny": "Mental Rotation & Cube Folding",
  "ViewSpatial": "View-based Spatial Reasoning",
  "SITE": "Spatial Intelligence in Text & Environment",
  "BLINK": "Spatial Perception from Images",
  "3DSRBench": "3D Spatial Reasoning",
  "EmbSpatial": "Embodied Spatial Understanding",
};

export default function AboutPage() {
  const intro = useReveal();
  const caps = useReveal();
  const bench = useReveal();
  const cite = useReveal();
  const links = useReveal();

  const [copied, setCopied] = useState(false);

  const citation = `@article{easi2025,
  title={Holistic Evaluation of Multimodal LLMs on Spatial Intelligence},
  author={Cai, Zhongang and Wang, Yubo and Sun, Qingping and Wang, Ruisi and Gu, Chenyang and Yin, Wanqi and Lin, Zhiqian and Yang, Zhitao and Wei, Chen and Shi, Xuanke and Deng, Kewang and Han, Xiaoyang and Chen, Zukai and Li, Jiaqi and Fan, Xiangyu and Deng, Hanming and Lu, Lewei and Li, Bo and Liu, Ziwei and Wang, Quan and Lin, Dahua and Yang, Lei},
  journal={arXiv preprint arXiv:2508.13142},
  year={2025}
}`;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [citation]);

  return (
    <div className="min-h-screen">
      {/* ── Intro ── */}
      <section
        ref={intro.ref}
        className={`bg-lb-bg py-16 px-md transition-all duration-700 ease-out ${
          intro.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-heading text-heading font-bold text-lb-text">About EASI</h1>
            
          </div>

          <p className="text-body text-lb-text-secondary leading-relaxed mb-6 max-w-3xl">
            EASI is a holistic evaluation framework for assessing Multimodal Large Language Models
            on spatial intelligence. It provides comprehensive coverage across six core dimensions
            of spatial reasoning, grounded in cognitive science.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/leaderboard"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-lb-nav text-white hover:opacity-90 transition-opacity duration-150 focus-ring"
            >
              View Leaderboard
            </Link>
            <Link
              href="/submit"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg border-2 border-lb-primary text-lb-primary hover:bg-lb-primary-light transition-colors duration-150 focus-ring"
            >
              Submit a Model
            </Link>
          </div>
        </div>
      </section>

      {/* ── Six Capabilities ── */}
      <section
        ref={caps.ref}
        className="relative bg-lb-surface py-16 px-md overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #c4b5fd 0.75px, transparent 0.75px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-2">
            Taxonomy of Spatial Capabilities
          </h2>
          <p className="text-lb-text-secondary mb-10 max-w-2xl text-sm leading-relaxed">
            Six core dimensions of spatial intelligence, derived from cognitive science,
            that structure the EASI evaluation framework.
          </p>

          <div
            className={`bg-lb-surface rounded-xl border border-lb-border shadow-lg overflow-hidden transition-all duration-800 ease-out ${
              caps.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap, i) => {
                const numeral = String(i + 1).padStart(2, "0");
                const isLastCol3 = (i + 1) % 3 === 0;
                const isLastCol2 = (i + 1) % 2 === 0;
                return (
                  <div
                    key={cap.abbr}
                    className={`group relative transition-all duration-600 ease-out
                      ${caps.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                      border-lb-border
                      ${i < 3 ? "lg:border-b" : ""}
                      ${i < 4 ? "sm:border-b" : "sm:border-b-0"}
                      ${i < 5 ? "border-b" : "border-b-0"}
                      ${!isLastCol3 ? "lg:border-r" : ""}
                      ${!isLastCol2 ? "sm:border-r" : "sm:border-r-0"}
                    `}
                    style={{
                      transitionDelay: caps.visible ? `${200 + i * 120}ms` : "0ms",
                    }}
                  >
                    <div className="relative p-6 sm:p-8">
                      <span
                        className="absolute top-3 right-4 font-heading font-bold text-[3rem] leading-none select-none pointer-events-none"
                        style={{ color: "rgba(30, 27, 75, 0.04)" }}
                      >
                        {numeral}
                      </span>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[0.6rem] font-mono font-medium text-lb-text-muted tracking-wider">
                          ({String.fromCharCode(97 + i)})
                        </span>
                        <span className="text-[0.6rem] font-mono font-medium text-lb-text-muted tracking-wider uppercase">
                          {cap.abbr}
                        </span>
                      </div>

                      <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-5 bg-white rounded-lg">
                        <Image
                          src={`/${cap.abbr}.png`}
                          alt={`${cap.title} — ${cap.description}`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 160px"
                        />
                      </div>

                      <div className="w-8 h-px bg-lb-border-emphasis mx-auto mb-3" />

                      <h3 className="font-heading font-semibold text-lb-text text-sm text-center mb-1">
                        {cap.title}
                      </h3>
                      <p className="text-xs text-lb-text-secondary leading-relaxed text-center">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benchmarks ── */}
      <section
        ref={bench.ref}
        className={`bg-lb-bg py-16 px-md transition-all duration-700 ease-out ${
          bench.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-2">
            EASI-8 Benchmarks
          </h2>
          <p className="text-lb-text-secondary mb-8 max-w-2xl text-sm">
            Eight curated benchmarks providing comprehensive coverage of spatial reasoning tasks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EASI8_BENCHMARKS.map((b, i) => (
              <div
                key={b.id}
                className={`border border-lb-border rounded-lg p-4 bg-lb-surface hover:shadow-md transition-all duration-500 ease-out ${
                  bench.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
                style={{
                  transitionDelay: bench.visible ? `${i * 60}ms` : "0ms",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm text-lb-text">
                    {b.name}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-lb-primary-light text-lb-primary">
                    {b.metric}
                  </span>
                </div>
                <p className="text-xs text-lb-text-muted leading-relaxed">
                  {BENCHMARK_DETAILS[b.name] ?? "Spatial reasoning evaluation"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Citation ── */}
      <section
        ref={cite.ref}
        className={`bg-lb-surface py-16 px-md transition-all duration-700 ease-out ${
          cite.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-6">
            Citation
          </h2>
          <div className="relative bg-lb-bg border border-lb-border rounded-lg shadow-sm p-md">
            <pre className="font-mono text-xs text-lb-text overflow-x-auto whitespace-pre leading-relaxed">
              {citation}
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
      <section
        ref={links.ref}
        className={`bg-lb-bg border-t border-lb-border py-12 px-md transition-all duration-700 ease-out ${
          links.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
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
                icon: (
                  <span className="text-sm">🤗</span>
                ),
              },
            ].map((link) => (
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
