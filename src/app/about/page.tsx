import Link from "next/link";
import DeveloperCard from "@/components/DeveloperCard";
import AlmRotatingQuote from "@/components/AlmRotatingQuote";

const ALM_QUOTES = [
  { text: "Finally, a planner that gets out of your way. Mapped a 10-stop trip in under 20 minutes.", name: "Priya M.", origin: "Salt Lake City → Denver" },
  { text: "The AI suggested this tiny diner off-route that became the highlight of the whole trip.", name: "Jordan C.", origin: "Austin → New Orleans" },
  { text: "Planned the whole Pacific Coast run with it. Weather, tolls, alternatives — everything in one place.", name: "Sofía R.", origin: "LA → Portland" },
];

const FEATURES = [
  ["Multi-stop route planning", "Real Google Maps directions across origin, destination, and any number of stops."],
  ["Per-leg route alternatives", "Compare roads, times, and distances for each segment."],
  ["AI trip assistant", "Chat while planning, get real place suggestions, add stops in one tap."],
  ["Weather forecasts", "Per-stop weather for your travel date — driving conditions visible up front."],
  ["Toll cost estimates", "Per-leg costs with a running total for the trip."],
  ["Departure & arrival", "Live arrival recalculated from your departure time."],
  ["Dark mode + units", "Mi/km preference and a dark theme that survives the dashboard."],
  ["Drag & drop reordering", "Reshape the trip without re-typing anything."],
  ["Trip sharing", "Send a unique invite link — plan together, no account required to view."],
  ["Save & sync", "Free account stores trips across devices and browsers."],
  ["Per-leg progress", "Check legs off as you drive."],
  ["One-tap handoff", "Open any leg or the full route in Google, Apple Maps, or Waze."],
];

const TECH_STACK = [
  ["Next.js 16", "App Router · server & client", "◆"],
  ["Supabase", "PostgreSQL + auth", "✱"],
  ["Google Maps API", "Directions · Places · Geocoding", "◉"],
  ["Gemini AI", "Trip assistant + suggestions", "★"],
  ["Resend", "Transactional email", "✉"],
  ["Open-Meteo", "Weather forecasts", "☀"],
  ["Tailwind CSS", "Utility-first styling", "~"],
  ["TypeScript", "End-to-end type safety", "<>"],
  ["Vercel", "Edge hosting · analytics", "▲"],
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)" }}>

      {/* ── HERO ── */}
      <div
        style={{
          padding: "56px 28px 48px",
          borderBottom: "2px solid var(--alm-ink)",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 40,
          alignItems: "end",
          maxWidth: 1100,
          margin: "0 auto",
        }}
        className="about-hero-grid"
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 16 }}>
            ◆ The Story · Issue 04 ◆
          </div>
          <h1
            className="alm-display"
            style={{
              fontSize: "clamp(52px, 8vw, 96px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              margin: 0,
              fontWeight: 400,
            }}
          >
            Built on the<br />
            <em style={{ color: "var(--alm-red)" }}>shoulder</em><br />
            of every road.
          </h1>
        </div>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: "var(--alm-ink2)",
            margin: 0,
            borderLeft: "3px solid var(--alm-red)",
            paddingLeft: 20,
          }}
        >
          Waypoint is a road-trip planner I built to scratch my own itch — one place to plot routes, compare alternatives, check weather, track tolls, and now chat with an AI that actually knows the road. No ads. No paywalls. Just the tool I wanted to exist.
        </p>
      </div>

      {/* ── DEVELOPER DOSSIER ── */}
      <div style={{ background: "var(--alm-cream)", borderBottom: "2px solid var(--alm-ink)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>The Driver</div>
              <h2 className="alm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>Behind the wheel</h2>
            </div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ Dossier</div>
          </div>
          <DeveloperCard />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ background: "var(--alm-bg)", borderBottom: "2px solid var(--alm-ink)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>What it does</div>
              <h2 className="alm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>The kit, line by line</h2>
            </div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ 12 entries</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 40, borderTop: "2px solid var(--alm-ink)" }} className="features-ledger">
            {FEATURES.map(([t, d], i) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom: "1px solid var(--alm-rule)",
                }}
              >
                <div
                  className="alm-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--alm-red)",
                    fontWeight: 700,
                    paddingTop: 2,
                    minWidth: 28,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="alm-display" style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--alm-ink)" }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--alm-ink2)", lineHeight: 1.55, marginTop: 3 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TECH STACK ── */}
      <div style={{ background: "var(--alm-cream)", borderBottom: "2px solid var(--alm-ink)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>Built with</div>
              <h2 className="alm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>Passport stamps</h2>
            </div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ Stack</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="stack-grid">
            {TECH_STACK.map(([t, d, g]) => (
              <div
                key={t}
                style={{
                  background: "var(--alm-bg)",
                  border: "2px solid var(--alm-ink)",
                  borderRadius: 4,
                  padding: 18,
                  position: "relative",
                  boxShadow: "3px 3px 0 var(--alm-ink)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "2px solid var(--alm-amber)",
                    color: "var(--alm-amber)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontFamily: "var(--font-display, Georgia, serif)",
                  }}
                >
                  {g}
                </div>
                <div className="alm-display" style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", maxWidth: "70%", color: "var(--alm-ink)" }}>{t}</div>
                <div style={{ fontSize: 13, color: "var(--alm-ink2)", marginTop: 6, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUOTES (dark) ── */}
      <div className="alm-on-ink" style={{ padding: "72px 28px", background: "#1f1a17", borderBottom: "2px solid #1f1a17" }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>★ FROM THE ROAD ★</div>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <AlmRotatingQuote quotes={ALM_QUOTES} dark interval={6000} />
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: "56px 28px", background: "var(--alm-cream)", borderBottom: "2px solid var(--alm-ink)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div>
            <h3 className="alm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--alm-ink)" }}>
              Ready to plan your next adventure?
            </h3>
            <div style={{ fontSize: 14, color: "var(--alm-ink2)", marginTop: 8 }}>No account required to start. Free, forever.</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/planner" className="alm-btn-primary">Open the Planner →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
