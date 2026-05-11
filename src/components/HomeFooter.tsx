import Link from "next/link";

export default function HomeFooter() {
  return (
    <>
      <footer
        className="desktop-footer"
        style={{
          background: "var(--alm-cream)",
          borderTop: "2px solid var(--alm-ink)",
          padding: "48px 28px 28px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Top row: 4-column grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 40,
              paddingBottom: 36,
              borderBottom: "1px solid var(--alm-rule)",
            }}
            className="footer-grid"
          >
            {/* Brand column */}
            <div>
              <div
                className="alm-display"
                style={{ fontSize: 36, color: "var(--alm-ink)", letterSpacing: "0.04em", marginBottom: 12 }}
              >
                WAYPOINT
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--alm-ink2)", maxWidth: 280, margin: "0 0 16px" }}>
                A road-trip planner built for the open road — with AI, weather, and everything in between. Free, forever.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href="/reviews"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--alm-ink)",
                    background: "transparent",
                    border: "1.5px solid var(--alm-rule)",
                    borderRadius: 3,
                    padding: "6px 12px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  ★ Leave a review
                </Link>
                <Link
                  href="/contact"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--alm-red)",
                    background: "transparent",
                    border: "1.5px solid var(--alm-red)",
                    borderRadius: 3,
                    padding: "6px 12px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  ✉ Contact us
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--alm-ink2)", marginBottom: 14, fontWeight: 700 }}>Navigate</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Planner", "/planner"],
                  ["My Trips", "/trips"],
                  ["About", "/about"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      color: "var(--alm-ink)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "var(--alm-red)", fontSize: 10 }}>→</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--alm-ink2)", marginBottom: 14, fontWeight: 700 }}>Account</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Sign up", "/auth/signup"],
                  ["Log in", "/auth/login"],
                  ["Profile", "/profile"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      color: "var(--alm-ink)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "var(--alm-red)", fontSize: 10 }}>→</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Fine print */}
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--alm-ink2)", marginBottom: 14, fontWeight: 700 }}>The Fine Print</div>
              <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", lineHeight: 1.65 }}>
                No ads.<br />
                No paywalls.<br />
                No feature gates.<br />
                No spam. Ever.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--alm-ink2)" }}>
              © {new Date().getFullYear()} Waypoint · All roads lead somewhere
            </span>
          </div>
        </div>
      </footer>

    </>
  );
}
