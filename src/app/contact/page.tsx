"use client";

import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

const TOPICS = ["Bug Report", "Feature Wish", "Account Help", "Press / Partnership", "Just Saying Hi"];


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

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Bug Report");
  const [subject, setSubject] = useState("");
  const [letter, setLetter] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("message", `[${topic}] ${subject ? `${subject}\n\n` : ""}${letter}`);
      if (attachment) fd.append("attachment", attachment);
      const res = await fetch("/api/contact", { method: "POST", body: fd });
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
          ★ Dispatch Desk ★
        </div>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 400, lineHeight: 1, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Get in <em style={{ color: "var(--alm-red)" }}>touch.</em>
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--alm-ink2)", maxWidth: 520, margin: "0 auto" }}>
          Bug report? Feature wish? Story from the road? Drop a line. Goes straight to Rahul — usually answered within a day.
        </p>
      </div>

      {/* Two-column body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px 80px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 40, alignItems: "start" }} className="contact-grid">

        {/* LEFT — address card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "2px solid var(--alm-ink)", borderRadius: 4, background: "var(--alm-cream)", padding: 24, boxShadow: "4px 4px 0 var(--alm-rule)" }}>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 12 }}>★ The Address ★</div>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 28, fontWeight: 400, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Waypoint Co.</h2>
            <div style={{ fontSize: 14, color: "var(--alm-ink2)", lineHeight: 1.8 }}>
              Mile-marker 04<br />
              The open road<br />
              United States, Earth
            </div>
          </div>
        </div>

        {/* RIGHT — letter form */}
        <div style={{ border: "2px solid var(--alm-ink)", borderRadius: 4, background: "var(--alm-cream)", overflow: "hidden", boxShadow: "4px 4px 0 var(--alm-rule)" }}>

          {/* Form header */}
          <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>≈ Write a letter</div>
              <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: "-0.02em" }}>To: Waypoint Dispatch</h2>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.1em" }}>Date · {today}</div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", letterSpacing: "0.1em" }}>Reply · within 48h</div>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{ margin: "20px 24px", borderTop: "1.5px dashed var(--alm-rule)" }} />

          {done ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <p style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 22, marginBottom: 8 }}>Dispatch received.</p>
              <p style={{ fontSize: 13, color: "var(--alm-ink2)", lineHeight: 1.6 }}>
                Thanks for reaching out — we read every message personally.
              </p>
              <button
                onClick={() => { setDone(false); setName(""); setEmail(""); setSubject(""); setLetter(""); setAttachment(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ marginTop: 24, fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, background: "var(--alm-ink)", color: "var(--alm-cream)", border: "2px solid var(--alm-ink)", borderRadius: 3, padding: "10px 20px", cursor: "pointer", boxShadow: "3px 3px 0 var(--alm-red)" }}
              >
                Write another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px" }}>

              {/* Name + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="Maya R." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@road.example" style={inputStyle} />
                </div>
              </div>

              {/* Topic buttons */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>What&apos;s this about</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      style={{
                        fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.14em",
                        textTransform: "uppercase", fontWeight: 700, padding: "6px 12px",
                        border: "2px solid var(--alm-ink)", borderRadius: 3, cursor: "pointer",
                        background: topic === t ? "var(--alm-red)" : "transparent",
                        color: topic === t ? "var(--alm-cream)" : "var(--alm-ink)",
                        boxShadow: topic === t ? "2px 2px 0 var(--alm-ink)" : "none",
                        transition: "all 150ms",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Briefly: what should I know?" style={inputStyle} />
              </div>

              {/* Letter */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>The Letter</label>
                <textarea
                  value={letter}
                  onChange={e => setLetter(e.target.value)}
                  required
                  rows={6}
                  placeholder="Tell me what's going on. Steps, screenshots, links — anything helps."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Attach area */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,.pdf,.txt"
                style={{ display: "none" }}
                onChange={e => setAttachment(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: "1.5px dashed var(--alm-rule)", borderRadius: 3, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "border-color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--alm-red)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--alm-rule)")}
              >
                <span style={{ color: "var(--alm-red)", fontSize: 16 }}>✎</span>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--alm-red)", fontWeight: 700 }}>Attach</span>
                {attachment ? (
                  <span style={{ fontSize: 13, color: "var(--alm-ink)", fontFamily: "var(--font-mono, monospace)" }}>
                    {attachment.name}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setAttachment(null); if (fileRef.current) fileRef.current.value = ""; }}
                      style={{ marginLeft: 8, color: "var(--alm-red)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
                    >✕</button>
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--alm-ink2)" }}>Screenshot, recording, or trip ID — optional but helpful.</span>
                )}
              </div>

              {error && <p style={{ fontSize: 12, color: "var(--alm-red)", marginBottom: 12 }}>{error}</p>}

              {/* Bottom bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--alm-ink2)" }}>
                  ✱ I read every letter myself.
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, background: "transparent", color: "var(--alm-ink)", border: "2px solid var(--alm-ink)", borderRadius: 3, padding: "10px 16px", cursor: "pointer" }}
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, background: "var(--alm-red)", color: "var(--alm-cream)", border: "2px solid var(--alm-ink)", borderRadius: 3, padding: "10px 16px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "3px 3px 0 var(--alm-ink)", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {loading ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Send style={{ width: 12, height: 12 }} />}
                    {loading ? "Sending…" : "≈ Send Dispatch →"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
