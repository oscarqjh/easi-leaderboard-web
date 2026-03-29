"use client";

import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { id: "authentication", label: "Authentication" },
  { id: "get-apiauthcallback", label: "GET /api/auth/callback", method: "GET" },
  { id: "get-apileaderboard", label: "GET /api/leaderboard", method: "GET" },
  { id: "post-apisubmit", label: "POST /api/submit", method: "POST" },
  { id: "post-apisubmitwithfile", label: "POST /api/submit-with-file", method: "POST" },
  { id: "examples", label: "Usage Examples", indent: true },
];

export default function ApiDocsSidebar() {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="hidden lg:block w-48 flex-shrink-0">
      <div className="sticky top-20">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-lb-text-muted mb-3">
          On this page
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1.5 ${item.indent ? "pl-5" : "pl-3"} text-xs transition-colors duration-150 border-l-2 ${
                  activeId === item.id
                    ? "border-lb-primary text-lb-primary font-medium"
                    : "border-transparent text-lb-text-muted hover:text-lb-text-secondary hover:border-lb-border-emphasis"
                }`}
              >
                {item.method ? (
                  <span className="font-mono">
                    <span className={`text-[9px] font-bold ${item.method === "GET" ? "text-emerald-500" : "text-blue-500"}`}>
                      {item.method}
                    </span>{" "}
                    <span className="text-[11px]">{item.label.replace(`${item.method} `, "")}</span>
                  </span>
                ) : (
                  item.label
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
