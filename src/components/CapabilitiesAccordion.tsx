"use client";

import { useState } from "react";
import Image from "next/image";
import { CAPABILITIES } from "@/lib/constants";
import { useReveal } from "@/hooks/useReveal";

export default function CapabilitiesAccordion() {
  const section = useReveal();
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <section
      ref={section.ref}
      className="relative py-20 px-md overflow-hidden"
      style={{ backgroundColor: "#1e1b4b" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-8 bg-white/20" />
          <span className="text-[0.7rem] font-mono font-medium tracking-[0.2em] uppercase text-white/50">
            Alternative A
          </span>
          <div className="h-px w-8 bg-white/20" />
        </div>

        <h2 className="font-heading text-heading font-semibold text-white text-center mb-2">
          Interactive Accordion
        </h2>
        <p className="text-center text-[#c4b5fd] mb-12 max-w-xl mx-auto text-sm leading-relaxed">
          Click a panel to explore each spatial capability in detail.
        </p>

        {/* Accordion panels */}
        <div className="flex flex-col gap-2">
          {CAPABILITIES.map((cap, i) => {
            const isExpanded = expandedIndex === i;
            const panelId = `accordion-panel-${cap.abbr}`;
            const headerId = `accordion-header-${cap.abbr}`;

            return (
              <div
                key={cap.abbr}
                className={`accordion-panel-reveal rounded-lg transition-colors duration-300 ${
                  isExpanded ? "bg-white/[0.07]" : "bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
                style={{
                  animationDelay: section.visible ? `${i * 100}ms` : "0ms",
                  opacity: section.visible ? undefined : 0,
                }}
              >
                {/* Header / trigger */}
                <button
                  id={headerId}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left focus-ring rounded-lg"
                >
                  {/* Left accent border */}
                  <div
                    className={`w-1 self-stretch rounded-full transition-colors duration-300 ${
                      isExpanded ? "bg-indigo-400" : "bg-transparent"
                    }`}
                  />

                  {/* Abbreviation watermark */}
                  <span
                    className="font-heading font-bold text-[2.5rem] leading-none select-none min-w-[72px]"
                    style={{ color: "rgba(196, 181, 253, 0.3)" }}
                  >
                    {cap.abbr}
                  </span>

                  {/* Title */}
                  <span className="flex-1 font-sans font-semibold text-white text-sm">
                    {cap.title}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expandable content — CSS grid row trick */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className="accordion-content-grid"
                  data-expanded={isExpanded}
                >
                  <div className="accordion-content-inner">
                    <div className="flex flex-col md:flex-row items-center gap-6 px-6 pb-6 pt-2">
                      {/* Illustration */}
                      <div
                        className="relative w-[180px] h-[180px] md:w-[200px] md:h-[200px] flex-shrink-0 transition-transform duration-500"
                        style={{
                          transform: isExpanded ? "translateX(0)" : "translateX(-30px)",
                          opacity: isExpanded ? 1 : 0,
                          transitionDelay: isExpanded ? "100ms" : "0ms",
                        }}
                      >
                        <Image
                          src={`/${cap.abbr}.png`}
                          alt={`${cap.title} illustration`}
                          fill
                          className="object-contain drop-shadow-[0_0_12px_rgba(129,140,248,0.25)]"
                          sizes="200px"
                        />
                      </div>

                      {/* Description */}
                      <p
                        className="text-[#c4b5fd] text-sm leading-relaxed transition-opacity duration-300"
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          transitionDelay: isExpanded ? "250ms" : "0ms",
                        }}
                      >
                        {cap.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
