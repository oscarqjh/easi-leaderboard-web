"use client";

import Image from "next/image";
import { CAPABILITIES } from "@/lib/constants";
import { useReveal } from "@/hooks/useReveal";

const GRID_AREAS = ["mm", "mm", "mr", "sr", "pt", "da", "cr", "cr"] as const;
const CELL_AREA: Record<string, string> = {
  MM: "mm",
  MR: "mr",
  SR: "sr",
  PT: "pt",
  DA: "da",
  CR: "cr",
};

export default function CapabilitiesBento() {
  const section = useReveal();

  return (
    <section
      ref={section.ref}
      className="relative bg-lb-bg py-20 px-md overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-8 bg-lb-border-emphasis" />
          <span className="text-[0.7rem] font-mono font-medium tracking-[0.2em] uppercase text-lb-text-muted">
            Alternative B
          </span>
          <div className="h-px w-8 bg-lb-border-emphasis" />
        </div>

        <h2 className="font-heading text-heading font-semibold text-lb-text text-center mb-2">
          Bento Mosaic
        </h2>
        <p className="text-center text-lb-text-secondary mb-12 max-w-xl mx-auto text-sm leading-relaxed">
          An asymmetric grid with clip-path reveal animations.
        </p>

        {/* Bento grid */}
        <div className="bento-grid grid gap-4">
          {CAPABILITIES.map((cap, i) => {
            const area = CELL_AREA[cap.abbr];
            const isHero = cap.abbr === "MM" || cap.abbr === "CR";

            return (
              <div
                key={cap.abbr}
                className={`bento-cell-${area} group relative rounded-xl overflow-hidden bg-lb-primary-light border border-lb-border cursor-pointer ${
                  isHero ? "lg:aspect-[2/1]" : "aspect-square"
                }`}
                tabIndex={0}
              >
                {/* Image with clip-path reveal */}
                <div
                  className="bento-image-container absolute inset-0"
                  data-revealed={section.visible}
                  style={{
                    transitionDelay: section.visible ? `${i * 150}ms` : "0ms",
                  }}
                >
                  <Image
                    src={`/${cap.abbr}.png`}
                    alt={`${cap.title} illustration`}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105 group-focus-within:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                {/* Default label (visible before hover) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="font-heading font-bold text-[3rem] leading-none select-none"
                    style={{ color: "rgba(99, 102, 241, 0.12)" }}
                  >
                    {cap.abbr}
                  </span>
                  <span className="font-heading font-semibold text-sm text-lb-text mt-2">
                    {cap.title}
                  </span>
                </div>

                {/* Hover/focus overlay with description */}
                <div className="bento-overlay absolute inset-x-0 bottom-0 h-[40%] bg-[#1e1b4b]/75 backdrop-blur-sm flex items-center px-5">
                  <div>
                    <h3 className="font-heading font-semibold text-white text-sm mb-1">
                      {cap.title}
                    </h3>
                    <p className="text-[#c4b5fd] text-xs leading-relaxed">
                      {cap.description}
                    </p>
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
