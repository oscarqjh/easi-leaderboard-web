"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Submit" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-lb-surface border-b border-lb-border">
      <div className="max-w-7xl mx-auto px-md flex items-center justify-between h-14">
        <Link
          href="/leaderboard"
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
        </nav>
      </div>
    </header>
  );
}
