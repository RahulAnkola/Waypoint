"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut, Sun, Moon, Menu, X, Home, Map, BookOpen, User as UserIcon, Star, Mail, LogIn, UserPlus } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
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

  const menuLinks = [
    { href: "/", label: "Home", icon: <Home style={{ width: 15, height: 15 }} /> },
    { href: "/planner", label: "Planner", icon: <Map style={{ width: 15, height: 15 }} /> },
    ...(user ? [{ href: "/trips", label: "My Trips", icon: <BookOpen style={{ width: 15, height: 15 }} /> }] : []),
    ...(user ? [{ href: "/profile", label: "Profile", icon: <UserIcon style={{ width: 15, height: 15 }} /> }] : []),
    { href: "/about", label: "About", icon: <BookOpen style={{ width: 15, height: 15 }} /> },
    { href: "/contact", label: "Contact Us", icon: <Mail style={{ width: 15, height: 15 }} /> },
    { href: "/reviews", label: "Leave a Review", icon: <Star style={{ width: 15, height: 15 }} /> },
  ];

  return (
    <>
    {/* ── Drawer overlay backdrop ── */}
    {menuOpen && (
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(31,26,23,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />
    )}

    {/* ── Slide-in drawer ── */}
    <div style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: 280,
      background: bg,
      borderRight: `2px solid ${ink}`,
      zIndex: 201,
      transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 280ms cubic-bezier(0.32,0.72,0,1)",
      display: "flex", flexDirection: "column",
      boxShadow: menuOpen ? `6px 0 0 ${ALM.red}` : "none",
    }}>
      {/* Drawer header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, borderBottom: `2px solid ${ink}`, flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 18, letterSpacing: "0.08em", color: ink }}>WAYPOINT</span>
        <button onClick={() => setMenuOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: ink2, display: "flex", padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
        {menuLinks.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 20px",
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: active ? ALM.red : ink,
                borderLeft: active ? `3px solid ${ALM.red}` : "3px solid transparent",
                background: active ? `rgba(194,91,58,0.06)` : "transparent",
                transition: "all 150ms",
              }}
            >
              <span style={{ color: active ? ALM.red : ink2, flexShrink: 0 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: auth actions */}
      <div style={{ borderTop: `2px solid ${ALM.rule}`, padding: "16px 20px", flexShrink: 0 }}>
        {user ? (
          <button
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "12px 0",
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase",
              fontWeight: 700, color: ALM.red,
            }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Sign out
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px", textDecoration: "none",
              fontFamily: "var(--font-mono, monospace)", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
              color: ink, border: `2px solid ${ALM.rule}`, borderRadius: 3,
            }}>
              <LogIn style={{ width: 13, height: 13 }} /> Sign in
            </Link>
            <Link href="/auth/signup" onClick={() => setMenuOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px", textDecoration: "none",
              fontFamily: "var(--font-mono, monospace)", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
              color: ALM.cream, background: ink, border: `2px solid ${ink}`,
              borderRadius: 3, boxShadow: `3px 3px 0 ${ALM.red}`,
            }}>
              <UserPlus style={{ width: 13, height: 13 }} /> Sign up
            </Link>
          </div>
        )}
      </div>
    </div>

    <header className="site-header" style={{ top: 0, zIndex: 50, background: bg }}>
      {/* Main nav */}
      <nav style={{ borderBottom: `2px solid ${ink}`, padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
          {/* Left controls: hamburger + theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Open menu"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: `1px solid ${rule}`,
                borderRadius: 3, padding: 6, cursor: "pointer", color: ink2,
              }}
            >
              <Menu style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: `1px solid ${rule}`,
                borderRadius: 3, padding: 6, cursor: "pointer", color: ink2,
              }}
            >
              {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
          </div>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: ink }}>
            <CompassMark size={32} />
            <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 22, letterSpacing: "0.08em", color: ink, lineHeight: 1 }}>
              WAYPOINT
            </span>
          </Link>

          {/* Nav links */}
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 0 }}>
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
          <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

          </div>

        </div>
      </nav>
    </header>
    </>
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

