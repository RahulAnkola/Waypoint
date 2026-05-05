"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut, Sun, Moon } from "lucide-react";
import { applyTheme, resolveTheme, getStoredThemePref, setStoredThemePref } from "@/components/ThemeProvider";

const ALM = {
  bg: "#f4ede2",
  cream: "#faf3e7",
  ink: "#1f1a17",
  ink2: "#5c4f42",
  red: "#c25b3a",
  rule: "#d9cfc4",
};

function CompassMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" fill="transparent" />
      <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
      <polygon points="20,5 22,20 20,24 18,20" fill={ALM.red} />
      <polygon points="20,35 22,20 20,16 18,20" fill="currentColor" />
      <polygon points="5,20 20,18 24,20 20,22" fill="currentColor" opacity="0.4" />
      <polygon points="35,20 20,22 16,20 20,18" fill="currentColor" opacity="0.4" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <text x="20" y="10" textAnchor="middle" fontSize="5" fontFamily="serif" fill="currentColor">N</text>
    </svg>
  );
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) { setUsername(null); return; }
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setUsername(data?.username ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const sync = () => {
      const pref = getStoredThemePref();
      setIsDark(resolveTheme(pref) === "dark");
    };
    sync();
    window.addEventListener("waypoint-theme-change", sync);
    return () => window.removeEventListener("waypoint-theme-change", sync);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    applyTheme(next);
    setStoredThemePref(next);
    window.dispatchEvent(new Event("waypoint-theme-change"));
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const bg = "var(--alm-bg)";
  const ink = "var(--alm-ink)";
  const ink2 = "var(--alm-ink2)";
  const red = "var(--alm-red)";
  const rule = "var(--alm-rule)";
  const cream = "var(--alm-cream)";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: bg }}>
      {/* Editorial top strip — home page only */}
      {pathname === "/" && (
        <div
          style={{
            borderBottom: `1px solid ${rule}`,
            padding: "5px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: ink2, textTransform: "uppercase" }}>
            The Road-Trip Almanac · Issue 04
          </span>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: red, textTransform: "uppercase" }}>
            ★ Free · No Ads · Forever ★
          </span>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: ink2, textTransform: "uppercase" }}>
            N 36°06′ · W 112°06′
          </span>
        </div>
      )}

      {/* Main nav */}
      <nav style={{ borderBottom: `2px solid ${ink}`, padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: ink }}>
            <CompassMark size={32} />
            <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 22, letterSpacing: "0.08em", color: ink, lineHeight: 1 }}>
              WAYPOINT
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <AlmNavLink href="/planner" active={isActive("/planner")} ink={ink} red={red} rule={rule}>
              Planner
            </AlmNavLink>
            {user && (
              <AlmNavLink href="/trips" active={isActive("/trips")} ink={ink} red={red} rule={rule}>
                My Trips
              </AlmNavLink>
            )}
            <AlmNavLink href="/about" active={isActive("/about")} ink={ink} red={red} rule={rule}>
              About
            </AlmNavLink>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <>
                <Link
                  href="/profile"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: ink2,
                    textDecoration: "none",
                    maxWidth: 160,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title="Edit profile"
                >
                  {username || user.email}
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: red,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  <LogOut style={{ width: 12, height: 12 }} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: ink,
                    textDecoration: "none",
                    padding: "6px 14px",
                    border: `2px solid ${rule}`,
                    borderRadius: 3,
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: cream,
                    background: ink,
                    textDecoration: "none",
                    padding: "6px 14px",
                    border: `2px solid ${ink}`,
                    borderRadius: 3,
                    boxShadow: `3px 3px 0 ${red}`,
                  }}
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: "transparent",
                border: `1px solid ${rule}`,
                borderRadius: 3,
                padding: 6,
                cursor: "pointer",
                color: ink2,
                display: "flex",
                alignItems: "center",
                marginLeft: 4,
              }}
            >
              {isDark
                ? <Sun style={{ width: 14, height: 14 }} />
                : <Moon style={{ width: 14, height: 14 }} />
              }
            </button>
          </div>

        </div>
      </nav>
    </header>
  );
}

function AlmNavLink({
  href,
  active,
  ink,
  red,
  rule,
  children,
}: {
  href: string;
  active?: boolean;
  ink: string;
  red: string;
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: 700,
        color: active ? red : ink,
        textDecoration: "none",
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        borderRight: `1px solid ${rule}`,
        borderLeft: "none",
        position: "relative",
        transition: "color 150ms",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: red,
          }}
        />
      )}
      {children}
    </Link>
  );
}

