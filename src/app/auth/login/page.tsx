"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const PERKS = [
  ["☑", "Unlimited saved trips, synced across devices"],
  ["☑", "AI companion that suggests real, named stops"],
  ["☑", "Trip sharing — plan together with one link"],
  ["☑", "Per-leg progress, weather, and toll estimates"],
  ["✗", "Ads · paywalls · feature gates · ever"],
];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/planner";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", minHeight: "calc(100vh - 100px)", background: "var(--alm-bg)" }} className="auth-grid">
      {/* LEFT — dark poster */}
      <div
        style={{
          background: "var(--alm-ink)",
          color: "var(--alm-cream)",
          padding: "56px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "2px solid var(--alm-ink)",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginTop: 16 }}>
            ★ Welcome Back ★
          </div>
          <h1
            className="alm-display"
            style={{
              fontSize: "clamp(52px, 8vw, 88px)",
              lineHeight: 0.9,
              margin: "16px 0 20px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            Welcome <em style={{ color: "var(--alm-red)" }}>back</em>,<br />traveler.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, opacity: 0.75, maxWidth: 380, margin: 0 }}>
            Pick up exactly where you left off — every trip, every leg, every note.
          </p>
        </div>

        {/* Member perks */}
        <div
          style={{
            background: "rgba(250,243,231,0.07)",
            border: "1px solid rgba(250,243,231,0.18)",
            borderRadius: 4,
            padding: 18,
            marginTop: 32,
          }}
        >
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 12 }}>
            What you get
          </div>
          {PERKS.map(([g, t], i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 13 }}>
              <span style={{ color: g === "✗" ? "rgba(250,243,231,0.3)" : "var(--alm-red)", width: 14, textAlign: "center", flexShrink: 0 }}>{g}</span>
              <span style={{ opacity: g === "✗" ? 0.4 : 0.9 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — form */}
      <div
        style={{
          padding: "56px 40px",
          background: "var(--alm-bg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: "inline-flex",
            border: "2px solid var(--alm-ink)",
            borderRadius: 3,
            overflow: "hidden",
            alignSelf: "flex-start",
            marginBottom: 32,
          }}
        >
          <Link
            href="/auth/signup"
            style={{
              padding: "10px 24px",
              background: "var(--alm-cream)",
              color: "var(--alm-ink)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 700,
              textTransform: "uppercase",
              textDecoration: "none",
              borderRight: "2px solid var(--alm-ink)",
              display: "block",
            }}
          >
            Sign up
          </Link>
          <span
            style={{
              padding: "10px 24px",
              background: "var(--alm-ink)",
              color: "var(--alm-cream)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 700,
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Log in
          </span>
        </div>

        <h2 className="alm-display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 8px", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--alm-ink)" }}>
          Keys, please.
        </h2>
        <p style={{ fontSize: 14, color: "var(--alm-ink2)", margin: "0 0 28px" }}>
          Sign in to access your road log and saved trips.
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 16, maxWidth: 440 }}>
          <AlmField label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@road.example"
              style={inputStyle}
            />
          </AlmField>

          <AlmField label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </AlmField>

          {error && (
            <div style={{ background: "rgba(194,91,58,0.1)", border: "1.5px solid var(--alm-red)", borderRadius: 3, padding: "10px 14px", fontSize: 13, color: "var(--alm-red)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--alm-cream)",
              background: loading ? "var(--alm-ink2)" : "var(--alm-ink)",
              border: "2px solid var(--alm-ink)",
              borderRadius: 3,
              padding: "12px 24px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "4px 4px 0 var(--alm-red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              transition: "box-shadow 120ms, transform 120ms",
            }}
          >
            {loading ? (
              <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Signing in…</>
            ) : (
              "↗ Sign in"
            )}
          </button>
        </form>

        {/* Fine print */}
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "var(--alm-cream)",
            border: "1.5px dashed var(--alm-rule)",
            borderRadius: 3,
            fontSize: 12,
            color: "var(--alm-ink2)",
            lineHeight: 1.55,
            maxWidth: 440,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", color: "var(--alm-red)", textTransform: "uppercase" }}>※ Fine print ·</span>{" "}
          We don&apos;t sell your data, we don&apos;t show ads, and we don&apos;t spam you.
        </div>
      </div>
    </div>
  );
}

function AlmField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--alm-ink2)", fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "var(--alm-cream)",
  border: "2px solid var(--alm-ink)",
  borderRadius: 3,
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 13,
  color: "var(--alm-ink)",
  outline: "none",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
