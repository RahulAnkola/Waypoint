"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trip } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink, Trash2, ArrowRight, Navigation,
  Map, Loader2, CheckCircle2, Circle, Clock, ChevronRight, MapPin, Share2, Check, Users,
} from "lucide-react";
import MapsButton from "@/components/MapsButton";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const STOP_DOT_COLORS = ["var(--alm-green)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-red)"];

function TripCard({
  trip, userId, onRemove, onToggleComplete,
}: {
  trip: Trip;
  userId: string;
  onRemove: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const userIds: string[] = trip.user_ids ?? [];
  const isOwner = userIds[0] === userId;
  const isParty = userIds.length > 1;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (trip.share_code) {
      await navigator.clipboard.writeText(`${window.location.origin}/trips/join/${trip.share_code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      router.push(`/trips/${trip.id}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isLast = userIds.length <= 1;
    const msg = isLast
      ? `Delete "${trip.name}"? This can't be undone.`
      : `Leave "${trip.name}"? You'll be removed from the trip.`;
    if (!confirm(msg)) return;
    setDeleting(true);
    const db = createClient();
    if (isLast) {
      await db.from("trips").delete().eq("id", trip.id);
    } else {
      const next = userIds.filter((id) => id !== userId);
      await db.from("trips").update({ user_ids: next }).eq("id", trip.id);
    }
    onRemove(trip.id);
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    const val = !trip.completed;
    const legCount = Math.max(0, [trip.origin, ...trip.waypoints, trip.destination].length - 1);
    try {
      localStorage.setItem(`waypoint-legs-${trip.id}`, JSON.stringify(Array(legCount).fill(val)));
    } catch { /* ignore */ }
    await createClient().from("trips").update({ completed: val }).eq("id", trip.id);
    onToggleComplete(trip.id, val);
    setToggling(false);
  };

  const stops = [trip.origin, ...trip.waypoints, trip.destination];
  const totalSeconds = (trip.leg_routes ?? []).reduce((a, l) => a + l.durationSeconds, 0);
  const totalH = Math.floor(totalSeconds / 3600), totalM = Math.round((totalSeconds % 3600) / 60);
  const hasTiming = totalSeconds > 0;
  const stopCount = stops.length;

  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="group cursor-pointer animate-slide-up"
      style={{
        position: "relative",
        background: trip.completed ? "rgba(74,124,89,0.06)" : "var(--alm-cream)",
        border: `2px solid ${trip.completed ? "var(--alm-green)" : "var(--alm-rule)"}`,
        borderRadius: 4,
        padding: 20,
        transition: "box-shadow 200ms, border-color 200ms",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!trip.completed) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--alm-ink)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "4px 4px 0 var(--alm-red)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = trip.completed ? "var(--alm-green)" : "var(--alm-rule)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top accent bar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          background: trip.completed ? "var(--alm-green)" : "var(--alm-red)",
          opacity: trip.completed ? 1 : 0,
          transition: "opacity 200ms",
        }}
        className="group-hover:opacity-100"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="alm-display"
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: trip.completed ? "var(--alm-ink2)" : "var(--alm-ink)",
                textDecoration: trip.completed ? "line-through" : "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 150ms",
              }}
            >
              {trip.name}
            </h3>
            {trip.completed && (
              <span
                style={{
                  flexShrink: 0,
                  background: "rgba(74,124,89,0.12)",
                  color: "var(--alm-green)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  border: "1px solid var(--alm-green)",
                  borderRadius: 2,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Done
              </span>
            )}
            {isParty && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  flexShrink: 0,
                  background: "rgba(192,138,53,0.12)",
                  color: "var(--alm-amber)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  border: "1px solid var(--alm-amber)",
                  borderRadius: 2,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                <Users className="w-2.5 h-2.5" /> Party
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--alm-ink2)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
            {trip.departure_date
              ? formatDate(trip.departure_date + "T12:00:00")
              : formatDate(trip.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isOwner && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1 rounded transition-all text-xs font-medium"
              style={{
                color: copied ? "var(--alm-green)" : "var(--alm-rule)",
                background: copied ? "rgba(74,124,89,0.1)" : "transparent",
                fontFamily: "var(--font-mono, monospace)",
              }}
              onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; }}
              onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-rule)"; }}
              title={trip.share_code ? "Copy share link" : "Share trip"}
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 shrink-0" /><span>Copied!</span></>
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded transition-all"
            style={{ color: "var(--alm-rule)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,91,58,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-rule)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            title={userIds.length > 1 ? "Leave trip" : "Delete trip"}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          <ChevronRight
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: "var(--alm-rule)" }}
          />
        </div>
      </div>

      {/* Stops */}
      <div className="relative pl-4 space-y-1.5 mb-3">
        <div
          className="absolute left-1 top-1.5 bottom-1.5 w-px"
          style={{ background: "var(--alm-rule)" }}
        />
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: STOP_DOT_COLORS[Math.min(i === stops.length - 1 ? 3 : i, 3)],
                boxShadow: "0 0 0 2px var(--alm-cream)",
              }}
            />
            <p style={{
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: (i === 0 || i === stops.length - 1) ? "var(--alm-ink)" : "var(--alm-ink2)",
              fontWeight: (i === 0 || i === stops.length - 1) ? 600 : 400,
            }}>
              {stop.address.split(",")[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Timing chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: "var(--alm-bg)",
            color: "var(--alm-ink2)",
            padding: "2px 8px",
            border: "1px solid var(--alm-rule)",
            borderRadius: 2,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          <MapPin className="w-2.5 h-2.5" /> {stopCount} stop{stopCount !== 1 ? "s" : ""}
        </span>
        {hasTiming && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(58,95,138,0.08)",
              color: "var(--alm-blue)",
              padding: "2px 8px",
              border: "1px solid rgba(58,95,138,0.2)",
              borderRadius: 2,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`}
          </span>
        )}
        {trip.departure_time && (
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(192,138,53,0.1)",
              color: "var(--alm-amber)",
              padding: "2px 8px",
              border: "1px solid rgba(192,138,53,0.25)",
              borderRadius: 2,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <Clock className="w-2.5 h-2.5" /> {formatTime12(trip.departure_time)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            borderRadius: 4,
            border: `2px solid ${trip.completed ? "var(--alm-green)" : "var(--alm-rule)"}`,
            background: trip.completed ? "rgba(74,124,89,0.1)" : "transparent",
            color: trip.completed ? "var(--alm-green)" : "var(--alm-ink2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
          onMouseEnter={(e) => {
            if (!trip.completed) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-green)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-green)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(74,124,89,0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (!trip.completed) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-rule)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-ink2)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }
          }}
        >
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : trip.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          {trip.completed ? "Completed" : "Mark done"}
        </button>

        <MapsButton
          stops={stops}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            borderRadius: 4,
            border: "2px solid var(--alm-ink)",
            background: "var(--alm-ink)",
            color: "var(--alm-cream)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          <ExternalLink className="w-3 h-3" />
          Maps
        </MapsButton>

        <button
          onClick={e => { e.stopPropagation(); router.push(`/planner?trip=${trip.id}`); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            borderRadius: 4,
            border: "2px solid var(--alm-rule)",
            background: "transparent",
            color: "var(--alm-ink2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-ink)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--alm-rule)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-ink2)";
          }}
        >
          <Map className="w-3 h-3" />
          Plan
        </button>
      </div>
    </div>
  );
}

type Filter = "all" | "active" | "completed";
const FILTER_LABELS: Record<Filter, string> = { all: "All", active: "Active", completed: "Completed" };

export default function TripsList({
  trips: initialTrips,
  userId,
}: {
  trips: Trip[];
  userId: string;
}) {
  const [trips, setTrips] = useState(initialTrips);
  const [filter, setFilter] = useState<Filter>("all");

  const handleRemove = (id: string) => setTrips(p => p.filter(t => t.id !== id));
  const handleToggle = (id: string, completed: boolean) =>
    setTrips(p => p.map(t => (t.id === id ? { ...t, completed } : t)));

  const counts: Record<Filter, number> = {
    all: trips.length,
    active: trips.filter(t => !t.completed).length,
    completed: trips.filter(t => t.completed).length,
  };

  const filtered = trips.filter(t =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed
  );

  if (trips.length === 0) {
    return (
      <div
        className="animate-fade-in"
        style={{
          textAlign: "center",
          padding: "80px 24px",
          border: "2px solid var(--alm-rule)",
          borderRadius: 4,
          background: "var(--alm-cream)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--alm-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "4px 4px 0 var(--alm-red)",
            }}
          >
            <Navigation style={{ width: 32, height: 32, color: "var(--alm-cream)" }} />
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>
          ★ Road log empty ★
        </div>
        <h3 className="alm-display" style={{ fontSize: 28, fontWeight: 400, color: "var(--alm-ink)", marginBottom: 8 }}>No trips yet</h3>
        <p style={{ color: "var(--alm-ink2)", fontSize: 14, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
          Head to the planner to map your first road trip — pick stops, choose a route, and save it for later.
        </p>
        <Link href="/planner" className="alm-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ArrowRight className="w-4 h-4" /> Go to Planner
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-0 mb-6 animate-fade-in" style={{ borderBottom: "2px solid var(--alm-rule)" }}>
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? "var(--alm-red)" : "var(--alm-ink2)",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--alm-red)" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
              }}
            >
              {FILTER_LABELS[f]}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 2,
                  background: isActive ? "var(--alm-red)" : "var(--alm-rule)",
                  color: isActive ? "var(--alm-cream)" : "var(--alm-ink2)",
                }}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          className="animate-fade-in"
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--alm-ink2)",
            border: "2px solid var(--alm-rule)",
            borderRadius: 4,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 13,
          }}
        >
          No {filter} trips yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((trip, i) => (
            <div key={trip.id} style={{ animationDelay: `${i * 60}ms` }}>
              <TripCard
                trip={trip}
                userId={userId}
                onRemove={handleRemove}
                onToggleComplete={handleToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
