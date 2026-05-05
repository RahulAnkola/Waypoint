"use client";

import React, { useEffect, useState } from "react";

interface Quote {
  text: React.ReactNode;
  name?: string;
  origin?: string;
}

interface Props {
  quotes: Quote[];
  dark?: boolean;
  interval?: number;
}

export default function AlmRotatingQuote({ quotes, dark = false, interval = 5000 }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 350);
    }, interval);
    return () => clearInterval(t);
  }, [quotes.length, interval]);

  const q = quotes[idx];

  return (
    <div
      style={{
        transition: "opacity 350ms ease, transform 350ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "clamp(20px, 3vw, 30px)",
          lineHeight: 1.35,
          color: "var(--alm-ink)",
          fontStyle: "italic",
          margin: "0 0 20px",
          letterSpacing: "-0.01em",
        }}
      >
        {q.text}
      </p>
      {(q.name || q.origin) && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 24, height: 2, background: "var(--alm-red)" }} />
          <div>
            {q.name && <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--alm-ink)" }}>{q.name}</div>}
            {q.origin && <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--alm-ink2)", marginTop: 2 }}>{q.origin}</div>}
          </div>
        </div>
      )}
      {/* Dot indicators */}
      <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
        {quotes.map((_, i) => (
          <button
            key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true); }, 350); }}
            style={{
              width: i === idx ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === idx ? "var(--alm-red)" : "var(--alm-rule)",
              border: "none",
              cursor: "pointer",
              transition: "width 300ms ease, background 300ms ease",
              padding: 0,
            }}
            aria-label={`Quote ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
