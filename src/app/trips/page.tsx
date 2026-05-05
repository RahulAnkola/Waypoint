import Link from "next/link";
import { redirect } from "next/navigation";

import TripsList from "@/components/TripsList";
import JoinTripButton from "@/components/JoinTripButton";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types";

export default async function TripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/trips");

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (trips as Trip[] | null) ?? [];
  const ownList = list.filter((t) => t.user_ids?.[0] === user.id);
  const total = ownList.length;
  const active = ownList.filter((t) => !t.completed).length;
  const completed = ownList.filter((t) => t.completed).length;

  return (
    <div style={{ background: "var(--alm-bg)", color: "var(--alm-ink)", minHeight: "calc(100vh - 100px)" }}>

      {/* ── Masthead ── */}
      <div
        style={{
          padding: "40px 28px 32px",
          borderBottom: "2px solid var(--alm-ink)",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 32,
          alignItems: "end",
          maxWidth: 1100,
          margin: "0 auto",
        }}
        className="trips-header"
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>
            ★ Your Road Log ★
          </div>
          <h1
            className="alm-display"
            style={{
              fontSize: "clamp(52px, 8vw, 80px)",
              lineHeight: 0.9,
              margin: "0 0 12px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            My <em style={{ color: "var(--alm-red)" }}>Trips</em>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--alm-ink2)", margin: 0, maxWidth: 440 }}>
            Every route you&apos;ve mapped — pick up where you left off, mark them done, or kick off a new adventure.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <JoinTripButton />
          <Link href="/planner" className="alm-btn-primary">
            + New trip
          </Link>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {total > 0 && (
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "24px 28px",
            borderBottom: "2px solid var(--alm-ink)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="trips-stats"
        >
          {[
            ["TOTAL TRIPS", String(total), "All your road plans", "var(--alm-ink)"],
            ["ACTIVE", String(active), "On the road or planned", "var(--alm-red)"],
            ["COMPLETED", String(completed), "Filed in the log", "var(--alm-green)"],
          ].map(([k, v, sub, c]) => (
            <div
              key={k}
              style={{
                background: "var(--alm-cream)",
                border: "2px solid var(--alm-ink)",
                borderRadius: 4,
                padding: 16,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: c }} />
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--alm-ink2)", marginTop: 4 }}>{k}</div>
              <div className="alm-display" style={{ fontSize: 40, lineHeight: 1, marginTop: 6, letterSpacing: "-0.02em", color: "var(--alm-ink)" }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--alm-ink2)", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Trips list ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px", background: "var(--alm-cream)" }}>
        {error ? (
          <div
            style={{
              background: "rgba(194,91,58,0.08)",
              border: "2px solid var(--alm-red)",
              borderRadius: 4,
              padding: "20px 24px",
              color: "var(--alm-red)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 13,
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load trips.</p>
            <p style={{ opacity: 0.7 }}>{error.message}</p>
          </div>
        ) : (
          <TripsList trips={list} userId={user.id} />
        )}
      </div>
    </div>
  );
}
