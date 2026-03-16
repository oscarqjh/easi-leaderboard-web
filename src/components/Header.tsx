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
    <header className="bg-lb-header-bg text-lb-header-fg">
      <div className="max-w-7xl mx-auto px-md flex items-center justify-between h-14">
        <Link
          href="/leaderboard"
          className="font-heading font-bold text-lg tracking-tight hover:opacity-80 transition-opacity duration-150"
        >
          EASI Leaderboard
        </Link>
        <nav className="flex items-center gap-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-colors duration-150
                  focus-ring
                  ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-lb-header-fg/70 hover:text-white hover:bg-white/5"
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
