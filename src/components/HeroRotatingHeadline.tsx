"use client";

import { useState, useEffect } from "react";

const HEADLINES = [
  <>Pack the<br />map.<br /><em style={{ color: "var(--alm-red)" }}>Take</em><br />the long way.</>,
  <>Plan the<br />scenic<br /><em style={{ color: "var(--alm-red)" }}>route,</em><br />not just the fastest.</>,
  <>The planner<br />that respects<br /><em style={{ color: "var(--alm-red)" }}>the detour.</em></>,
  <>All roads<br />lead<br /><em style={{ color: "var(--alm-red)" }}>somewhere.</em></>,
];

export default function HeroRotatingHeadline() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % HEADLINES.length);
        setVisible(true);
      }, 400);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <h1
      className="alm-display"
      style={{
        fontSize: "clamp(64px, 10vw, 118px)",
        lineHeight: 0.87,
        letterSpacing: "-0.04em",
        margin: 0,
        fontWeight: 400,
        color: "var(--alm-ink)",
        transition: "opacity 400ms ease, transform 400ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        minHeight: "4.5em",
      }}
    >
      {HEADLINES[idx]}
    </h1>
  );
}
