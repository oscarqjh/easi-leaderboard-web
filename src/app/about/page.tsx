"use client";

import { useState } from "react";

export default function AboutPage() {
  const [copied, setCopied] = useState(false);

  const citation = `@article{easi2025,
  title={EASI: Holistic Evaluation of Multimodal LLMs on Spatial Intelligence},
  author={LMMs-Lab},
  year={2025},
  journal={arXiv preprint}
}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-md py-lg">
      <div className="animate-fade-in-up space-y-lg">
        <div>
          <h1 className="font-heading text-heading font-semibold text-lb-text mb-md">
            About EASI
          </h1>
          <p className="text-body text-lb-text-secondary leading-relaxed">
            EASI (Evaluation of Spatial Intelligence) is a comprehensive benchmark
            suite designed to evaluate the spatial reasoning capabilities of
            Multimodal Large Language Models (MLLMs). It aggregates 8 core benchmarks
            (EASI-8) and additional extended benchmarks to provide a holistic view of
            spatial understanding.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-sm">
            EASI-8 Benchmarks
          </h2>
          <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-lb-border">
                  <th className="px-4 py-3 text-left font-semibold text-lb-text-muted uppercase text-xs tracking-wider">
                    Benchmark
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-lb-text-muted uppercase text-xs tracking-wider">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-lb-text-muted uppercase text-xs tracking-wider">
                    Focus
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["VSI-Bench", "Acc.", "Visual-Spatial Intelligence"],
                  ["MMSI-Bench", "Acc.", "Multi-Modal Spatial Intelligence"],
                  ["MindCube-Tiny", "Acc.", "Mental Rotation & Cube Folding"],
                  ["ViewSpatial", "Acc.", "View-based Spatial Reasoning"],
                  ["SITE", "CAA", "Spatial Intelligence in Text & Environment"],
                  ["BLINK", "Acc.", "Spatial Perception from Images"],
                  ["3DSRBench", "Acc.", "3D Spatial Reasoning"],
                  ["EmbSpatial", "Acc.", "Embodied Spatial Understanding"],
                ].map(([name, metric, focus]) => (
                  <tr
                    key={name}
                    className="border-b border-lb-border/60 hover:bg-lb-primary-light transition-colors duration-150"
                  >
                    <td className="px-4 py-2.5 font-medium text-lb-text">
                      {name}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-lb-text-secondary">
                      {metric}
                    </td>
                    <td className="px-4 py-2.5 text-lb-text-secondary">
                      {focus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-sm">
            Links
          </h2>
          <div className="flex flex-wrap gap-sm">
            {[
              {
                label: "GitHub",
                href: "https://github.com/EvolvingLMMs-Lab",
              },
              {
                label: "HuggingFace Space",
                href: "https://huggingface.co/spaces/lmms-lab-si/EASI-Leaderboard",
              },
              {
                label: "Paper",
                href: "#",
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-lb-surface border border-lb-border rounded-md text-sm font-medium text-lb-text-secondary
                  hover:border-lb-border-emphasis hover:text-lb-text hover:shadow-md transition-all duration-150"
              >
                {link.label} &rarr;
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-subheading font-semibold text-lb-text mb-sm">
            Citation
          </h2>
          <div className="relative bg-lb-surface border border-lb-border rounded-lg shadow-sm p-md">
            <pre className="font-mono text-xs text-lb-text overflow-x-auto whitespace-pre">
              {citation}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1 text-xs font-medium rounded-md
                bg-lb-nav text-white hover:opacity-90 transition-opacity duration-150"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
