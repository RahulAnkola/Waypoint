"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",        label: "Home",    icon: "⌂" },
  { href: "/planner", label: "Planner", icon: "◇" },
  { href: "/trips",   label: "Trips",   icon: "☰" },
  { href: "/profile", label: "Profile", icon: "◉" },
];

// Pages that should not show the tab bar
const EXCLUDED = ["/planner", "/auth"];

export default function MobileTabBar() {
  const pathname = usePathname();

  if (EXCLUDED.some(p => pathname?.startsWith(p))) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--alm-bg)",
        borderTop: "2px solid var(--alm-ink)",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        zIndex: 200,
      }}
      className="mobile-tabbar"
    >
      {TABS.map(({ href, label, icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              flex: 1,
              padding: "4px 0",
              color: active ? "var(--alm-red)" : "var(--alm-ink2)",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 400,
              }}
            >
              {label}
            </span>
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  width: 24,
                  height: 2,
                  background: "var(--alm-red)",
                  borderRadius: 1,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
