import Link from "next/link";
import RoadTrail from "@/components/RoadTrail";
import HomePageCarCursor from "@/components/HomePageCarCursor";
import AlmRotatingQuote from "@/components/AlmRotatingQuote";
import HeroRotatingHeadline from "@/components/HeroRotatingHeadline";
import { createClient } from "@/lib/supabase/server";

const ALM_QUOTES = [
  { text: <>Plan the scenic route, <em style={{ color: "var(--alm-red)", fontStyle: "normal" }}>not just</em> the fastest route.</> },
  { text: <>The road trip planner that respects <em style={{ color: "var(--alm-red)", fontStyle: "normal" }}>the detour.</em></> },
  { text: "Finally, a planner that gets out of your way. Mapped a 10-stop trip in under 20 minutes.", name: "Priya M.", origin: "Salt Lake City → Denver" },
  { text: "The AI suggested this tiny diner off-route that became the highlight of the whole trip.", name: "Jordan C.", origin: "Austin → New Orleans" },
  { text: "Planned the whole Pacific Coast run with it. Weather, tolls, alternatives — everything in one place.", name: "Sofía R.", origin: "LA → Portland" },
  { text: "Share link worked perfectly. My whole family was editing stops from their phones the night before.", name: "Marcus T.", origin: "Nashville → Asheville" },
  { text: "Simple. Fast. No fluff. I've tried every road-trip app and this is the one I keep coming back to.", name: "Ellie K.", origin: "Chicago → Upper Peninsula" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <HomePageCarCursor>
      <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)" }}>

        {/* ── HERO with RoadTrail ── */}
        <RoadTrail
          className="relative overflow-hidden road-trail-zone"
          style={{
            background: "var(--alm-bg)",
            borderBottom: "2px solid var(--alm-ink)",
            isolation: "isolate",
          }}
        >
          <div style={{ position: "relative", zIndex: 10 }}>
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "32px 28px 32px",
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 48,
                alignItems: "center",
              }}
              className="hero-grid"
            >
              {/* Left: copy */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    color: "var(--alm-red)",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  ◆ The Road-Trip Almanac · Issue 04 ◆
                </div>

                <HeroRotatingHeadline />

                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.6,
                    maxWidth: 480,
                    marginTop: 16,
                    color: "var(--alm-ink2)",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  Multi-stop routes, per-leg alternatives, weather, tolls, and an AI companion that reads like a glove-box guide. Built for drivers who'd rather see the country than the clock.
                </p>

                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                  <Link href="/planner" className="alm-btn-primary">
                    Start planning →
                  </Link>
                  {isLoggedIn ? (
                    <Link href="/trips" className="alm-btn-ghost">
                      My Trips
                    </Link>
                  ) : (
                    <Link href="/auth/signup" className="alm-btn-ghost">
                      Create account
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: ticket cards */}
              <div style={{ position: "relative" }}>
                {/* Main ticket */}
                <div
                  style={{
                    transform: "rotate(-2deg)",
                    background: "var(--alm-cream)",
                    border: "2px solid var(--alm-ink)",
                    borderRadius: 4,
                    padding: 24,
                    boxShadow: "6px 6px 0 var(--alm-ink)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textAlign: "center", marginBottom: 8 }}>★ THE OPEN ROAD ★</div>
                  <div className="alm-display" style={{ fontSize: 56, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1, color: "var(--alm-ink)" }}>WAY · PT</div>
                  <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: "var(--alm-ink2)", textAlign: "center", marginTop: 8 }}>EST. 2026 · MILES AHEAD</div>
                </div>

                {/* Trip ticket */}
                <div
                  style={{
                    marginTop: 20,
                    transform: "rotate(1.5deg)",
                    background: "var(--alm-cream)",
                    border: "2px solid var(--alm-ink)",
                    borderRadius: 4,
                    padding: 20,
                    boxShadow: "5px 5px 0 var(--alm-ink)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px dashed var(--alm-ink)",
                      paddingBottom: 8,
                      marginBottom: 10,
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--alm-ink2)",
                    }}
                  >
                    <span>From</span><span>Via · 5 Stops</span><span>To</span>
                  </div>
                  <div className="alm-display" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, marginBottom: 10, color: "var(--alm-ink)" }}>
                    <span>Boise</span>
                    <span style={{ color: "var(--alm-red)", fontSize: 16 }}>━ ━ ━</span>
                    <span>Yellowstone</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.14em", color: "var(--alm-ink2)", textTransform: "uppercase" }}>
                    <span>312 mi</span><span>5h 48m</span><span>~$8 tolls</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto 0",
                padding: "0 28px 28px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  border: "2px solid var(--alm-ink)",
                  background: "var(--alm-cream)",
                }}
                className="stats-grid"
              >
                {[
                  ["ZERO", "Ads, ever"],
                  ["∞", "Stops per trip"],
                  ["<60s", "Setup time"],
                  ["$0", "Cost — forever"],
                ].map(([n, l], i) => (
                  <div
                    key={i}
                    style={{
                      padding: "18px 20px",
                      borderRight: i < 3 ? "2px solid var(--alm-ink)" : "none",
                      textAlign: "center",
                    }}
                  >
                    <div className="alm-display" style={{ fontSize: 40, lineHeight: 1, color: "var(--alm-red)" }}>{n}</div>
                    <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--alm-ink2)", marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RoadTrail>

        {/* ── FEATURES ── */}
        <section style={{ background: "var(--alm-bg)", borderBottom: "2px solid var(--alm-ink)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 28px" }}>
            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>Chapter Two</div>
                <h2 className="alm-display" style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.95, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
                  Everything for <em style={{ color: "var(--alm-red)" }}>the trip.</em><br />Nothing you don&apos;t need.
                </h2>
              </div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ 02 · The Kit</div>
            </div>

            {/* Feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }} className="features-grid">
              {[
                { n: "01", t: "AI Companion", d: "Chat while you plan. It asks the right questions and suggests real, named places — diners, overlooks, weird museums.", isNew: true },
                { n: "02", t: "Weather + Tolls", d: "Per-stop weather forecasts for your travel date and a running toll estimate per leg.", isNew: false },
                { n: "03", t: "Smart Routing", d: "Origin, destination, and any number of stops. Real Google Maps directions with alternatives for every leg.", isNew: false },
                { n: "04", t: "Save & Share", d: "Free account syncs trips across devices. Share an invite link to plan with whoever's coming.", isNew: false },
              ].map((f) => (
                <div
                  key={f.n}
                  style={{
                    background: "var(--alm-cream)",
                    border: "2px solid var(--alm-ink)",
                    borderRadius: 4,
                    padding: 24,
                    position: "relative",
                    boxShadow: "5px 5px 0 var(--alm-ink)",
                  }}
                >
                  {f.isNew && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        right: 20,
                        background: "var(--alm-red)",
                        color: "var(--alm-cream)",
                        padding: "4px 10px",
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        border: "2px solid var(--alm-ink)",
                        borderRadius: 4,
                      }}
                    >
                      NEW
                    </div>
                  )}
                  <div className="alm-display" style={{ fontSize: 52, color: "var(--alm-red)", lineHeight: 1, marginBottom: 6 }}>{f.n}</div>
                  <h3 className="alm-display" style={{ fontSize: 28, margin: "0 0 8px", fontWeight: 400, letterSpacing: "-0.01em", color: "var(--alm-ink)" }}>{f.t}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--alm-ink2)", margin: 0 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ background: "var(--alm-cream)", borderBottom: "2px solid var(--alm-ink)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 28px" }}>
            {/* Section header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 48, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>Chapter Three</div>
                <h2 className="alm-display" style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 0.95, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
                  Three steps. <em style={{ color: "var(--alm-red)" }}>One open road.</em>
                </h2>
              </div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ 03 · The Method</div>
            </div>

            {/* Steps */}
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingTop: 12 }} className="steps-grid">
              {/* Dashed connector line */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 48,
                  left: "17%",
                  right: "17%",
                  height: 2,
                  borderTop: "2px dashed var(--alm-rule)",
                }}
              />
              {[
                ["I", "Drop your pins", "Origin, destination, and any worth-the-detour stops in between."],
                ["II", "Compare the legs", "Alternative roads with timing, distance, and tolls — pick the one that fits."],
                ["III", "Hit the road", "Hand it off to your nav app and check off legs as you drive."],
              ].map(([n, t, d]) => (
                <div key={n} style={{ textAlign: "center", padding: "0 24px", position: "relative" }}>
                  <div
                    className="alm-display"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--alm-bg)",
                      border: "2px solid var(--alm-ink)",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      color: "var(--alm-red)",
                      boxShadow: "3px 3px 0 var(--alm-ink)",
                    }}
                  >
                    {n}
                  </div>
                  <h3 className="alm-display" style={{ fontSize: 26, margin: "22px 0 8px", fontWeight: 400, color: "var(--alm-ink)" }}>{t}</h3>
                  <p style={{ fontSize: 14, color: "var(--alm-ink2)", lineHeight: 1.6, margin: 0, maxWidth: 240, marginInline: "auto" }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROTATING QUOTES ── */}
        <section style={{ background: "var(--alm-bg)", borderBottom: "2px solid var(--alm-ink)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40, borderBottom: "2px solid var(--alm-ink)", paddingBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>Field Notes</div>
                <h2 className="alm-display" style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 0.95, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
                  From the road
                </h2>
              </div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>§ 04 · Trip log entries</div>
            </div>
            <div style={{ maxWidth: 800 }}>
              <AlmRotatingQuote quotes={ALM_QUOTES} />
            </div>
          </div>
        </section>

        {/* ── DARK CTA BAND ── */}
        <section
          style={{
            background: "var(--alm-ink)",
            color: "var(--alm-cream)",
            padding: "88px 28px",
            textAlign: "center",
            borderBottom: "2px solid var(--alm-ink)",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 16 }}>★ ★ ★</div>
          <h2
            className="alm-display"
            style={{
              fontSize: "clamp(56px, 10vw, 96px)",
              lineHeight: 0.9,
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            Ready when <em style={{ color: "var(--alm-red)" }}>you are.</em>
          </h2>
          <p style={{ color: "rgba(250,243,231,0.65)", fontSize: 16, maxWidth: 440, margin: "20px auto 0", lineHeight: 1.6 }}>
            No account needed to start planning. Sign up to save your trips across devices.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/planner"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "var(--alm-ink)",
                background: "var(--alm-cream)",
                textDecoration: "none",
                padding: "12px 28px",
                border: "2px solid var(--alm-cream)",
                borderRadius: 4,
                boxShadow: "4px 4px 0 var(--alm-red)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Open the Planner →
            </Link>
            {isLoggedIn ? (
              <Link
                href="/trips"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--alm-cream)",
                  background: "transparent",
                  textDecoration: "none",
                  padding: "12px 28px",
                  border: "2px solid rgba(250,243,231,0.35)",
                  borderRadius: 4,
                }}
              >
                My Trips
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--alm-cream)",
                  background: "transparent",
                  textDecoration: "none",
                  padding: "12px 28px",
                  border: "2px solid rgba(250,243,231,0.35)",
                  borderRadius: 4,
                }}
              >
                Create account
              </Link>
            )}
          </div>
        </section>

      </div>
    </HomePageCarCursor>
  );
}
