"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, X } from "lucide-react";

export default function JoinTripButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: 300,
      zIndex: 9999,
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const popup = document.getElementById("join-trip-popup");
        if (popup && !popup.contains(e.target as Node)) setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleJoin = () => {
    const raw = input.trim();
    if (!raw) return;
    const match = raw.match(/\/trips\/join\/([A-Z0-9]+)/i);
    const code = match ? match[1] : raw.toUpperCase();
    router.push(`/trips/join/${code}`);
    setOpen(false);
    setInput("");
  };

  const popup = open ? (
    <div
      id="join-trip-popup"
      style={{
        ...popupStyle,
        background: "var(--alm-cream)",
        border: "2px solid var(--alm-ink)",
        borderRadius: 4,
        boxShadow: "4px 4px 0 var(--alm-red)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--alm-red)", fontWeight: 700 }}>
          ≈ Join a trip
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--alm-ink2)", display: "flex", padding: 2 }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--alm-ink2)", marginBottom: 12, lineHeight: 1.5 }}>
        Paste the full share link or just the code from your friend.
      </p>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
        placeholder="https://…/trips/join/ABCD1234"
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1.5px solid var(--alm-rule)",
          borderRadius: 3,
          background: "transparent",
          color: "var(--alm-ink)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          outline: "none",
          boxSizing: "border-box",
          marginBottom: 12,
        }}
      />
      <button
        onClick={handleJoin}
        disabled={!input.trim()}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          background: input.trim() ? "var(--alm-ink)" : "var(--alm-rule)",
          color: "var(--alm-cream)",
          border: "2px solid var(--alm-ink)",
          borderRadius: 3,
          padding: "10px 16px",
          cursor: input.trim() ? "pointer" : "not-allowed",
          boxShadow: input.trim() ? "3px 3px 0 var(--alm-red)" : "none",
          transition: "all 150ms",
        }}
      >
        Join Trip <ArrowRight style={{ width: 12, height: 12 }} />
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          background: "transparent",
          color: "var(--alm-ink)",
          border: "2px solid var(--alm-rule)",
          borderRadius: 3,
          padding: "10px 16px",
          cursor: "pointer",
          transition: "border-color 150ms, color 150ms",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-ink)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-rule)"; }}
      >
        <Users style={{ width: 14, height: 14 }} />
        Join trip
      </button>
      {typeof document !== "undefined" && popup
        ? createPortal(popup, document.body)
        : null}
    </>
  );
}
