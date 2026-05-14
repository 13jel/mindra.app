"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Tab = {
  href: string;
  key: "today" | "workout" | "patterns" | "calendar" | "profile";
  match: (path: string) => boolean;
};

const TABS: readonly Tab[] = [
  {
    href: "/today",
    key: "today",
    match: (p) => p === "/today",
  },
  {
    href: "/workout",
    key: "workout",
    match: (p) => p.startsWith("/workout"),
  },
  {
    href: "/patterns",
    key: "patterns",
    match: (p) => p.startsWith("/patterns"),
  },
  {
    href: "/calendar",
    key: "calendar",
    match: (p) => p.startsWith("/calendar"),
  },
  {
    href: "/profile",
    key: "profile",
    match: (p) => p === "/profile",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elev/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-screen-sm">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  "transition-colors",
                  active ? "text-accent" : "text-fg-muted hover:text-fg",
                ].join(" ")}
                data-tap
              >
                <Icon name={tab.key} active={active} />
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Icon({
  name,
  active,
}: {
  name: Tab["key"];
  active: boolean;
}) {
  const sw = active ? 2 : 1.5;
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "today":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "workout":
      return (
        <svg {...props}>
          <path d="M6 8v8M3 12h3M18 8v8M21 12h-3M9 7v10M15 7v10" />
        </svg>
      );
    case "patterns":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
  }
}