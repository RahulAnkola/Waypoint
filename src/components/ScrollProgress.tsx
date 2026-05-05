"use client";

import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const next = max > 0 ? (root.scrollTop / max) * 100 : 0;
      setPct(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 2,
        pointerEvents: "none",
        background: "var(--alm-rule)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(to right, var(--alm-red), var(--alm-amber))",
          transition: "width 120ms linear",
          boxShadow: "0 0 6px rgba(194,91,58,0.5)",
        }}
      />
    </div>
  );
}
