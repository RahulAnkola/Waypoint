"use client";

import { useState } from "react";
import ContactModal from "./ContactModal";

export default function DeveloperCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: "var(--alm-bg)",
          border: "2px solid var(--alm-ink)",
          borderRadius: 4,
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          overflow: "hidden",
          boxShadow: "5px 5px 0 var(--alm-ink)",
        }}
        className="dev-card-grid"
      >
        {/* Left: photo placeholder */}
        <div
          style={{
            padding: 24,
            borderRight: "2px solid var(--alm-ink)",
            background: "var(--alm-cream)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1.1",
              background: "repeating-linear-gradient(135deg, var(--alm-rule) 0 8px, var(--alm-cream) 8px 16px)",
              border: "2px solid var(--alm-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              className="alm-display"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--alm-red)",
                color: "var(--alm-cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                border: "2px solid var(--alm-ink)",
              }}
            >
              R
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-mono, monospace)", fontSize: 9, letterSpacing: "0.18em", color: "var(--alm-ink2)" }}>
              PHOTO · WPT/01
            </div>
          </div>

          {/* Metadata dossier */}
          <div
            style={{
              marginTop: 14,
              width: "100%",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--alm-ink2)",
            }}
          >
            {[
              ["Role", "Full-stack dev"],
              ["Base", "The road"],
              ["Since", "2026"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: "1px dashed var(--alm-rule)",
                }}
              >
                <span>{k}</span>
                <span style={{ color: "var(--alm-ink)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: bio */}
        <div style={{ padding: 32 }}>
          <h3
            className="alm-display"
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              margin: "0 0 4px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              color: "var(--alm-ink)",
            }}
          >
            Rahul Ankola
          </h3>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--alm-red)",
              marginBottom: 20,
            }}
          >
            Full-stack developer · road-trip enthusiast
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--alm-ink2)", marginTop: 0, marginBottom: 20 }}>
            Waypoint started as a personal project to scratch my own itch — bouncing between Google Maps tabs, weather apps, and notepads while planning road trips. I wanted one clean place to plan routes, compare alternatives, check the weather, track progress, and now even chat with an AI that actually knows the road.
          </p>
          <button
            onClick={() => setOpen(true)}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--alm-cream)",
              background: "var(--alm-ink)",
              border: "2px solid var(--alm-ink)",
              borderRadius: 3,
              padding: "8px 18px",
              cursor: "pointer",
              boxShadow: "3px 3px 0 var(--alm-red)",
            }}
          >
            ✉ Leave a message
          </button>
        </div>
      </div>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
