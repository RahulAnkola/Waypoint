"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const FEATURED_QUOTE = {
  text: "Replaced my five-tab planning ritual. The AI suggested a roadside diner in Kanab I'd have driven straight past — best pie of the trip.",
  name: "Maya R.",
  origin: "Salt Lake → Zion",
};

const RECENT_QUOTES = [
  { text: FEATURED_QUOTE.text, name: FEATURED_QUOTE.name, origin: FEATURED_QUOTE.origin },
  { text: "The toll estimates saved me from a nasty surprise on I-70. Rerouted around the worst of it before I even left the driveway.", name: "Jordan C.", origin: "Denver → Kansas City" },
  { text: "Planned a 12-stop Southwest loop. Drag-and-drop reorder made it feel like shuffling index cards.", name: "Sofía R.", origin: "Phoenix → Albuquerque" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid var(--alm-rule)",
  borderRadius: 3,
  background: "transparent",
  color: "var(--alm-ink)",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "var(--alm-ink2)",
  display: "block",
  marginBottom: 6,
};

export default function ReviewsPage() {
  const [name, setName] = useState("");
  const [trip, setTrip] = useState("");
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [quoteIdx, setQuoteIdx] = useState(0);

  const displayStars = hovered || stars;
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Perfect"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars) { setError("Please select a rating"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, message: note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)", minHeight: "calc(100vh - 64px)" }}>

      {/* Page header */}
      <div style={{ borderBottom: "2px solid var(--alm-ink)", padding: "56px 28px 48px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 16 }}>
          ★ Postcard from the road ★
        </div>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 400, lineHeight: 1, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Leave a <em style={{ color: "var(--alm-red)" }}>review</em>
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--alm-ink2)", maxWidth: 520, margin: "0 auto" }}>
          Hand-written notes, the kind you&apos;d mail home. Tell us how Waypoint held up on the road — the good, the wrong-turn, the unexpectedly perfect detour.
        </p>
      </div>

      {/* Two-column body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }} className="reviews-grid">

        {/* LEFT — postcard form */}
        <div style={{ border: "2px solid var(--alm-ink)", borderRadius: 4, background: "var(--alm-cream)", boxShadow: "4px 4px 0 var(--alm-rule)", overflow: "hidden" }}>

          {/* Form header */}
          <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 6 }}>★ Postcard ★</div>
              <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 24, fontWeight: 400, margin: 0, letterSpacing: "-0.01em" }}>From the road</h2>
            </div>
            {/* Stamp */}
            <div style={{
              width: 68, height: 80, border: "2px dashed var(--alm-red)", borderRadius: 2,
              background: "var(--alm-red)", display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 4, color: "var(--alm-cream)", flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" fill="transparent" />
                <polygon points="20,5 22,20 20,24 18,20" fill="currentColor" />
                <polygon points="20,35 22,20 20,16 18,20" fill="rgba(255,255,255,0.4)" />
                <circle cx="20" cy="20" r="2.5" fill="currentColor" />
                <text x="20" y="10" textAnchor="middle" fontSize="5" fontFamily="serif" fill="currentColor">N</text>
              </svg>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.1em" }}>5¢</div>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{ margin: "20px 24px", borderTop: "1.5px dashed var(--alm-rule)" }} />

          {done ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <p style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 22, marginBottom: 8 }}>Postcard received.</p>
              <p style={{ fontSize: 13, color: "var(--alm-ink2)", lineHeight: 1.6 }}>
                Thanks — we read every single one. Goes straight to Rahul.
              </p>
              <button
                onClick={() => { setDone(false); setStars(0); setName(""); setTrip(""); setNote(""); }}
                style={{ marginTop: 24, fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, background: "var(--alm-ink)", color: "var(--alm-cream)", border: "2px solid var(--alm-ink)", borderRadius: 3, padding: "10px 20px", cursor: "pointer", boxShadow: "3px 3px 0 var(--alm-red)" }}
              >
                Write another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Maya R." style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Where was the trip</label>
                <input value={trip} onChange={e => setTrip(e.target.value)} placeholder="Salt Lake → Zion, March '26" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Overall Rating <span style={{ color: "var(--alm-red)" }}>*</span></label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }} onMouseLeave={() => setHovered(0)}>
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHovered(i)}
                      onClick={() => setStars(i)}
                      style={{
                        width: 40, height: 40, border: "none", borderRadius: 3, cursor: "pointer",
                        background: i <= displayStars ? "var(--alm-red)" : "var(--alm-rule)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 150ms",
                      }}
                    >
                      <Star style={{ width: 18, height: 18, color: i <= displayStars ? "var(--alm-cream)" : "var(--alm-ink2)", fill: i <= displayStars ? "var(--alm-cream)" : "none" }} />
                    </button>
                  ))}
                  {displayStars > 0 && (
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.1em", color: "var(--alm-ink2)", marginLeft: 4 }}>
                      {displayStars} / 5 · {LABELS[displayStars].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>The Note</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={5}
                  placeholder="What worked? What surprised you? What should we fix?"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {error && <p style={{ fontSize: 12, color: "var(--alm-red)", marginBottom: 12 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em",
                    textTransform: "uppercase", fontWeight: 700, background: "var(--alm-red)",
                    color: "var(--alm-cream)", border: "2px solid var(--alm-ink)", borderRadius: 3,
                    padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1, boxShadow: "3px 3px 0 var(--alm-ink)",
                  }}
                >
                  {loading ? "Mailing…" : "≈ Mail the Postcard →"}
                </button>
                <button
                  type="button"
                  style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em",
                    textTransform: "uppercase", fontWeight: 700, background: "transparent",
                    color: "var(--alm-ink)", border: "2px solid var(--alm-ink)", borderRadius: 3,
                    padding: "10px 20px", cursor: "pointer",
                  }}
                >
                  Save Draft
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT — featured quote + prompts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Featured quote card */}
          <div style={{ border: "2px solid var(--alm-ink)", borderRadius: 4, background: "var(--alm-cream)", padding: 28, boxShadow: "4px 4px 0 var(--alm-rule)" }}>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 16 }}>
              From recent postcards
            </div>
            <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 28, lineHeight: 1.3, color: "var(--alm-ink)", marginBottom: 20 }}>
              &ldquo;{RECENT_QUOTES[quoteIdx].text}&rdquo;
            </div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              — {RECENT_QUOTES[quoteIdx].name} · {RECENT_QUOTES[quoteIdx].origin}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {RECENT_QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIdx(i)}
                  style={{
                    width: i === quoteIdx ? 24 : 8, height: 8, borderRadius: 4, border: "none",
                    background: i === quoteIdx ? "var(--alm-red)" : "var(--alm-rule)",
                    cursor: "pointer", padding: 0, transition: "width 300ms, background 300ms",
                  }}
                />
              ))}
            </div>
          </div>

          {/* What to tell us */}
          <div style={{ border: "2px solid var(--alm-rule)", borderRadius: 4, background: "var(--alm-cream)", padding: 24 }}>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: "var(--alm-ink2)", textTransform: "uppercase", marginBottom: 16 }}>
              What to tell us
            </div>
            {[
              ["What surprised you", "A detour, a stop, a feature."],
              ["What broke", "Confusing flow, missing data, slow leg."],
              ["What you wish existed", "Camping picks, EV stops, audio guide."],
            ].map(([title, hint], i) => (
              <div key={title} style={{ paddingBottom: 14, marginBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? "1px dashed var(--alm-rule)" : "none" }}>
                <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 16, fontWeight: 400, color: "var(--alm-ink)", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, color: "var(--alm-ink2)" }}>{hint}</div>
              </div>
            ))}
            <p style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 13, fontStyle: "italic", color: "var(--alm-ink2)", marginTop: 16, marginBottom: 0 }}>
              Reviews go straight to Rahul (the only developer).
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .reviews-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
