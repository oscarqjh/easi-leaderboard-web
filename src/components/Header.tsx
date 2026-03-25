"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/submit", label: "Submit" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-lb-surface border-b border-lb-border">
      <div className="max-w-7xl mx-auto px-md flex items-center justify-between h-14">
        <Link
          href="/"
          className="font-heading font-semibold text-lg text-lb-text tracking-tight hover:opacity-70 transition-opacity duration-150"
        >
          EASI{" "}
          <span className="text-lb-primary">Leaderboard</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150
                  focus-ring
                  ${
                    isActive
                      ? "bg-lb-nav text-white"
                      : "text-lb-text-secondary hover:text-lb-text hover:bg-lb-primary-light"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-lb-border mx-1.5" />

          {/* External links — icon only */}
          <a
            href="https://github.com/EvolvingLMMs-Lab/EASI"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-lb-text-muted hover:text-lb-text hover:bg-lb-primary-light transition-all duration-150"
            title="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          {/* <a
            href="https://arxiv.org/abs/2508.13142"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-lb-text-muted hover:text-lb-text hover:bg-lb-primary-light transition-all duration-150"
            title="arXiv Paper"
          >
            <img src="/arxiv-logomark-small.svg" alt="arXiv" className="w-4 h-4" />
          </a>
          <a
            href="https://huggingface.co/spaces/lmms-lab-si/EASI-Leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-lb-primary-light transition-all duration-150"
            title="HuggingFace"
          >
            <span className="text-sm leading-none">🤗</span>
          </a> */}
        </nav>
      </div>
    </header>
  );
}
