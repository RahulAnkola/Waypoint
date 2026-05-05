"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Clock, Route, CheckCircle2, Circle, MapPin, Map,
  ExternalLink, FileText, Loader2, ChevronRight,
  Plus, Trash2, ListChecks, Share2, Copy, Check, Users,
} from "lucide-react";
import type { Trip, LegRoute, ChecklistItem, DistanceUnit } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getDistanceUnitLocal, formatStoredDistance } from "@/lib/mapsUtils";
import MapsButton from "@/components/MapsButton";
import WeatherBadge from "@/components/WeatherBadge";
import TollBadge from "@/components/TollBadge";
import { fetchTollEstimate } from "@/lib/tollUtils";
import { computeStopDate } from "@/lib/weatherUtils";

/* ─── helpers ─── */
function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function addSeconds(time24: string, seconds: number): string {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + Math.round(seconds / 60);
  const ah = Math.floor(total / 60) % 24, am = total % 60;
  return `${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function city(address: string, max = 18): string {
  const c = address.split(",")[0].trim();
  return c.length <= max ? c : c.slice(0, max - 1) + "…";
}

const STOP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const STOP_BG = ["var(--alm-green)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-red)"];

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--alm-ink2)",
};

const sideCard: React.CSSProperties = {
  background: "var(--alm-cream)",
  border: "2px solid var(--alm-rule)",
  borderRadius: 4,
  overflow: "hidden",
};

const sideCardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "12px 16px",
  borderBottom: "1px solid var(--alm-rule)",
  ...monoLabel,
};

/* ─── Notes auto-save panel ─── */
function NotesPanel({ tripId, initial }: { tripId: string; initial: string | null }) {
  const [text, setText] = useState(initial ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = async (val: string) => {
    setStatus("saving");
    await createClient().from("trips").update({ notes: val.trim() || null }).eq("id", tripId);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(val), 1200);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div style={sideCard}>
      <div style={{ ...sideCardHeader, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FileText style={{ width: 14, height: 14, color: "var(--alm-red)" }} />
          Notes · Glove Box
        </span>
        <span style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}>
          {status === "saving" && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--alm-ink2)" }}>
              <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> Saving…
            </span>
          )}
          {status === "saved" && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--alm-green)" }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Saved
            </span>
          )}
        </span>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Jot down packing reminders, hotel bookings, food stops, anything…"
        rows={6}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--alm-ink)",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ─── Checklist panel ─── */
function ChecklistPanel({ tripId, initial }: { tripId: string; initial: ChecklistItem[] | null }) {
  const [items, setItems] = useState<ChecklistItem[]>(initial ?? []);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = async (next: ChecklistItem[]) => {
    await createClient().from("trips").update({ checklist: next }).eq("id", tripId);
  };

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    const next = [...items, { id: crypto.randomUUID(), text, done: false }];
    setItems(next);
    setNewText("");
    persist(next);
    inputRef.current?.focus();
  };

  const toggleItem = (id: string) => {
    const next = items.map((it) => it.id === id ? { ...it, done: !it.done } : it);
    setItems(next);
    persist(next);
  };

  const deleteItem = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    persist(next);
  };

  const done = items.filter((i) => i.done).length;

  return (
    <div style={sideCard}>
      <div style={{ ...sideCardHeader, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ListChecks style={{ width: 14, height: 14, color: "var(--alm-red)" }} />
          Packing / Checklist
        </span>
        {items.length > 0 && (
          <span style={{ ...monoLabel, color: "var(--alm-ink2)" }}>{done}/{items.length}</span>
        )}
      </div>

      {items.length > 0 && (
        <ul style={{ maxHeight: 200, overflowY: "auto", borderBottom: "1px solid var(--alm-rule)" }}>
          {items.map((item) => (
            <li
              key={item.id}
              className="group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: "1px solid var(--alm-rule)",
              }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: item.done ? "var(--alm-green)" : "var(--alm-rule)",
                  padding: 0,
                  display: "flex",
                }}
              >
                {item.done ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <Circle style={{ width: 16, height: 16 }} />}
              </button>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: item.done ? "var(--alm-ink2)" : "var(--alm-ink)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--alm-rule)",
                  padding: 0,
                  display: "flex",
                  opacity: 0,
                }}
                className="group-hover:opacity-100"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-rule)"; (e.currentTarget as HTMLButtonElement).style.opacity = "0"; }}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          placeholder="+ Add item…"
          style={{
            flex: 1,
            fontSize: 13,
            color: "var(--alm-ink)",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={addItem}
          disabled={!newText.trim()}
          style={{
            flexShrink: 0,
            padding: 6,
            borderRadius: 3,
            background: "var(--alm-red)",
            color: "var(--alm-cream)",
            border: "none",
            cursor: newText.trim() ? "pointer" : "not-allowed",
            opacity: newText.trim() ? 1 : 0.3,
            display: "flex",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

type Member = { user_id: string; role: string; username: string | null };

async function fetchProfiles(userIds: string[]): Promise<Member[]> {
  if (userIds.length === 0) return [];
  const { data } = await createClient().rpc("get_user_display_names", { p_user_ids: userIds });
  const nameIndex: Record<string, string> = {};
  ((data as { id: string; display_name: string }[]) ?? []).forEach((r) => {
    nameIndex[r.id] = r.display_name;
  });
  return userIds.map((uid, idx) => ({
    user_id: uid,
    role: idx === 0 ? "organiser" : "member",
    username: nameIndex[uid] ?? "Unknown",
  }));
}

function PartyPopup({ userIds }: { userIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchProfiles(userIds).then(setMembers); }, [userIds.join(",")]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (userIds.length <= 1) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "rgba(192,138,53,0.12)",
          color: "var(--alm-amber)",
          border: "1px solid var(--alm-amber)",
          borderRadius: 3,
          padding: "2px 8px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <Users style={{ width: 12, height: 12 }} /> Party · {userIds.length}
      </button>

      {open && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 8px)",
            width: 220,
            background: "var(--alm-cream)",
            border: "2px solid var(--alm-ink)",
            borderRadius: 4,
            boxShadow: "4px 4px 0 var(--alm-red)",
            padding: 12,
            zIndex: 50,
          }}
          className="animate-fade-in"
        >
          <p style={{ ...monoLabel, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Users style={{ width: 12, height: 12 }} /> Trip party
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: m.role === "organiser" ? "var(--alm-red)" : "var(--alm-ink2)",
                    color: "var(--alm-cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {(m.username ?? "?")[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--alm-ink)" }}>{m.username ?? "Unknown"}</p>
                  <p style={{ ...monoLabel, fontSize: 9 }}>{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SharePanel({ trip }: { trip: Trip }) {
  const [shareCode, setShareCode] = useState<string | null>(trip.share_code ?? null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    await createClient().from("trips").update({ share_code: code }).eq("id", trip.id);
    setShareCode(code);
    setGenerating(false);
  };

  const joinPath = shareCode ? `/trips/join/${shareCode}` : null;

  const copyLink = async () => {
    if (!joinPath) return;
    await navigator.clipboard.writeText(window.location.origin + joinPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={sideCard}>
      <div style={sideCardHeader}>
        <Share2 style={{ width: 14, height: 14, color: "var(--alm-red)" }} />
        Share Trip
      </div>
      <div style={{ padding: 16 }}>
        {shareCode && joinPath ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, color: "var(--alm-ink2)" }}>Anyone with this link can join and edit:</p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--alm-bg)",
                border: "2px solid var(--alm-rule)",
                borderRadius: 4,
                padding: "6px 10px",
              }}
            >
              <span style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono, monospace)", color: "var(--alm-ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {joinPath}
              </span>
              <button
                onClick={copyLink}
                style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: copied ? "var(--alm-green)" : "var(--alm-ink2)", display: "flex" }}
              >
                {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: "var(--alm-ink2)", marginBottom: 10 }}>Generate a link so others can join and edit this trip.</p>
            <button
              onClick={generateCode}
              disabled={generating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "var(--alm-ink)",
                color: "var(--alm-cream)",
                border: "2px solid var(--alm-ink)",
                borderRadius: 4,
                padding: "8px 14px",
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.6 : 1,
                boxShadow: "3px 3px 0 var(--alm-red)",
              }}
            >
              {generating ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Share2 style={{ width: 14, height: 14 }} />}
              {generating ? "Generating…" : "Generate share link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TripTollTotal({ stops, legRoutes }: { stops: { lat: number; lng: number }[]; legRoutes: LegRoute[] }) {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stops.length < 2) { setLoading(false); return; }
    let cancelled = false;
    const legs = stops.slice(0, -1).map((from, i) => {
      const dur = legRoutes.find(l => l.legIndex === i)?.durationSeconds ?? 0;
      return fetchTollEstimate(from.lat, from.lng, stops[i + 1].lat, stops[i + 1].lng, dur);
    });
    Promise.all(legs).then((results) => {
      if (cancelled) return;
      const sum = results.reduce((acc, r) => acc + (r?.amount ?? 0), 0);
      const anyTolls = results.some((r) => r?.hasTolls);
      setTotal(anyTolls ? parseFloat(sum.toFixed(2)) : 0);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [stops, legRoutes]);

  if (loading) return (
    <span
      className="animate-pulse"
      style={{
        display: "inline-block",
        height: 28,
        width: 96,
        background: "var(--alm-rule)",
        borderRadius: 3,
      }}
    />
  );
  if (total === null) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "var(--font-mono, monospace)",
        padding: "4px 10px",
        border: `1px solid ${total > 0 ? "var(--alm-amber)" : "var(--alm-rule)"}`,
        borderRadius: 3,
        background: total > 0 ? "rgba(192,138,53,0.1)" : "transparent",
        color: total > 0 ? "var(--alm-amber)" : "var(--alm-ink2)",
      }}
    >
      {total > 0 ? `~$${total.toFixed(2)} tolls` : "No tolls"}
    </span>
  );
}

/* ─── main component ─── */
export default function TripDetailClient({ trip }: { trip: Trip }) {
  const stops = [trip.origin, ...trip.waypoints, trip.destination];
  const legRoutes: LegRoute[] = trip.leg_routes ?? [];
  const depTime = trip.departure_time ?? null;
  const depDate = trip.departure_date ?? null;
  const legCount = stops.length - 1;
  const [isCompleted, setIsCompleted] = useState(trip.completed);
  const isSyncingCompletion = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    setDistanceUnit(getDistanceUnitLocal());
  }, []);

  const userIds: string[] = trip.user_ids ?? [];
  const isOwner = !!currentUserId && userIds[0] === currentUserId;

  const stopTimes: string[] = [];
  if (depTime) {
    let cur = depTime;
    stopTimes.push(cur);
    legRoutes.forEach(leg => { cur = addSeconds(cur, leg.durationSeconds); stopTimes.push(cur); });
  }

  const stopDates: (string | undefined)[] = stops.map((_, i) => {
    if (!depDate || !depTime) return undefined;
    const elapsed = legRoutes.slice(0, i).reduce((a, l) => a + l.durationSeconds, 0);
    return computeStopDate(depDate, depTime, elapsed);
  });

  const totalSeconds = legRoutes.reduce((a, l) => a + l.durationSeconds, 0);
  const totalMilesRaw = legRoutes.reduce((a, l) => a + parseFloat(l.distance), 0);
  const totalDistStr = distanceUnit === "km"
    ? `${(totalMilesRaw * 1.60934).toFixed(0)} km`
    : `${totalMilesRaw.toFixed(0)} mi`;
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.round((totalSeconds % 3600) / 60);

  const [doneLegs, setDoneLegs] = useState<boolean[]>(() => Array(legCount).fill(trip.completed));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`waypoint-legs-${trip.id}`);
      if (raw) {
        const parsed: boolean[] = JSON.parse(raw);
        setDoneLegs(parsed.length === legCount ? parsed : Array(legCount).fill(false));
      } else if (trip.completed) {
        const all = Array(legCount).fill(true);
        setDoneLegs(all);
        localStorage.setItem(`waypoint-legs-${trip.id}`, JSON.stringify(all));
      }
    } catch { /* ignore */ }
  }, [trip.id, legCount, trip.completed]);

  const toggleLeg = (i: number) => {
    setDoneLegs(prev => {
      const next = [...prev];
      next[i] = !next[i];
      try { localStorage.setItem(`waypoint-legs-${trip.id}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const doneLegCount = doneLegs.filter(Boolean).length;
  const pct = legCount > 0 ? Math.round((doneLegCount / legCount) * 100) : 0;

  useEffect(() => {
    if (legCount <= 0) return;
    const nextCompleted = pct === 100;
    if (nextCompleted === isCompleted || isSyncingCompletion.current) return;
    isSyncingCompletion.current = true;
    setIsCompleted(nextCompleted);
    (async () => {
      const { error } = await createClient().from("trips").update({ completed: nextCompleted }).eq("id", trip.id);
      if (error) setIsCompleted(prev => !prev);
      isSyncingCompletion.current = false;
    })();
  }, [pct, legCount, isCompleted, trip.id]);

  const hasMultipleLegs = stops.length > 2;
  const barPct = pct;
  const barColor = pct === 100 ? "var(--alm-green)" : pct >= 50 ? "var(--alm-red)" : "var(--alm-amber)";

  return (
    <>
      {/* ── Masthead ── */}
      <div
        style={{
          paddingBottom: 28,
          borderBottom: "2px solid var(--alm-ink)",
          marginBottom: 32,
        }}
      >
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.3em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 8 }}>
          ★ Trip log ★
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="alm-display" style={{ fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 0.9, fontWeight: 400, letterSpacing: "-0.03em", margin: 0, color: "var(--alm-ink)" }}>
                {trip.name}
              </h1>
              <PartyPopup userIds={trip.user_ids ?? []} />
            </div>
            <p style={{ ...monoLabel, marginTop: 8, fontSize: 11 }}>
              {trip.departure_date
                ? formatDate(trip.departure_date + "T12:00:00")
                : formatDate(trip.created_at)}
            </p>
          </div>
          {isCompleted && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(74,124,89,0.1)",
                color: "var(--alm-green)",
                border: "2px solid var(--alm-green)",
                borderRadius: 3,
                padding: "6px 12px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                flexShrink: 0,
                marginTop: 4,
              }}
            >
              <CheckCircle2 style={{ width: 14, height: 14 }} /> Completed
            </span>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {legRoutes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              border: "2px solid var(--alm-ink)",
              background: "var(--alm-cream)",
              marginBottom: 8,
            }}
            className="trips-stats"
          >
            {[
              ["DRIVE TIME", totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`, "var(--alm-ink)"],
              ["DISTANCE", totalDistStr, "var(--alm-ink)"],
              ["STOPS", `${stops.length} · ${legCount} leg${legCount !== 1 ? "s" : ""}`, "var(--alm-ink)"],
              depTime && stopTimes.length > 0 ? ["SCHEDULE", `${formatTime12(depTime)} → ${formatTime12(stopTimes[stopTimes.length - 1])}`, "var(--alm-blue)"] : null,
              ["TOLLS", null, "var(--alm-amber)"],
            ].filter(Boolean).map((item, i, arr) => {
              const [label, val, color] = item as [string, string | null, string];
              return (
                <div
                  key={label}
                  style={{
                    padding: "14px 16px",
                    borderRight: i < arr.length - 1 ? "2px solid var(--alm-ink)" : "none",
                  }}
                >
                  <div style={{ ...monoLabel, fontSize: 9, marginBottom: 4 }}>{label}</div>
                  <div className="alm-display" style={{ fontSize: 22, lineHeight: 1, color, letterSpacing: "-0.01em" }}>
                    {label === "TOLLS" ? <TripTollTotal stops={stops} legRoutes={legRoutes} /> : val}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--alm-ink2)", fontStyle: "italic" }}>
            Toll estimates are approximate and may vary. Actual tolls depend on vehicle class and payment method.
          </p>
        </div>
      )}

      {/* ── Progress bar ── */}
      {legCount > 0 && (
        <div
          style={{
            background: "var(--alm-cream)",
            border: "2px solid var(--alm-rule)",
            borderRadius: 4,
            padding: "12px 16px",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={monoLabel}>Trip Progress</span>
            <span style={{ ...monoLabel, color: pct === 100 ? "var(--alm-green)" : pct > 0 ? "var(--alm-red)" : "var(--alm-ink2)" }}>
              {doneLegCount} / {legCount} Legs · {pct}%
            </span>
          </div>
          <div style={{ height: 6, background: "var(--alm-rule)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${barPct}%`,
                background: barColor,
                transition: "width 500ms ease",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

        {/* ══ LEFT: itinerary ══ */}
        <div>
          <div
            style={{
              background: "var(--alm-cream)",
              border: "2px solid var(--alm-ink)",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "4px 4px 0 var(--alm-ink)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "2px solid var(--alm-ink)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="alm-display" style={{ fontSize: 28, fontWeight: 400, margin: 0, color: "var(--alm-ink)" }}>
                The Itinerary
              </h2>
              <span style={monoLabel}>§ {stops.length} stops · {legCount} legs</span>
            </div>

            <div style={{ padding: "8px 20px 20px" }}>
              {stops.map((stop, i) => {
                const isLast = i === stops.length - 1;
                const leg = legRoutes.find(l => l.legIndex === i);
                const arrTime = stopTimes[i];
                const legDone = !isLast && (doneLegs[i] ?? false);
                const stopColor = STOP_BG[Math.min(i === stops.length - 1 ? STOP_BG.length - 1 : i, STOP_BG.length - 1)];

                return (
                  <div key={i} style={{ position: "relative" }}>
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        style={{
                          position: "absolute",
                          left: 18,
                          top: 44,
                          bottom: 0,
                          width: 2,
                          background: "var(--alm-rule)",
                        }}
                      />
                    )}

                    {/* Stop row */}
                    <div style={{ display: "flex", gap: 14, paddingTop: 20 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: stopColor,
                          color: "var(--alm-cream)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                          border: "2px solid var(--alm-ink)",
                          boxShadow: "2px 2px 0 var(--alm-ink)",
                          zIndex: 1,
                          position: "relative",
                        }}
                      >
                        {STOP_LETTERS[i] ?? String(i + 1)}
                      </div>
                      <div style={{ flex: 1, paddingBottom: leg ? 0 : 16, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--alm-ink)", margin: 0, lineHeight: 1.3 }}>
                          {stop.address}
                        </p>
                        {arrTime && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <Clock style={{ width: 12, height: 12, color: "var(--alm-ink2)", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "var(--alm-ink2)", fontFamily: "var(--font-mono, monospace)" }}>
                              {i === 0 ? "Depart" : "Arrive"} {formatTime12(arrTime)}
                            </span>
                          </div>
                        )}
                        <WeatherBadge lat={stop.lat} lng={stop.lng} arrivalTime24={arrTime ?? null} date={stopDates[i]} />
                      </div>
                    </div>

                    {/* Leg connector */}
                    {!isLast && leg && (
                      <div style={{ marginLeft: 52, marginTop: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            border: `2px solid ${legDone ? "var(--alm-green)" : "var(--alm-rule)"}`,
                            borderRadius: 4,
                            padding: "10px 12px",
                            background: legDone ? "rgba(74,124,89,0.06)" : "var(--alm-bg)",
                            transition: "border-color 200ms",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => toggleLeg(i)}
                              title={legDone ? "Unmark leg" : "Mark leg done"}
                              style={{
                                flexShrink: 0,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: legDone ? "var(--alm-green)" : "var(--alm-rule)",
                                padding: 0,
                                display: "flex",
                                transition: "color 150ms",
                              }}
                            >
                              {legDone ? <CheckCircle2 style={{ width: 20, height: 20 }} /> : <Circle style={{ width: 20, height: 20 }} />}
                            </button>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                              <Route style={{ width: 14, height: 14, color: "var(--alm-red)", marginTop: 2, flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: legDone ? "var(--alm-green)" : "var(--alm-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  via {leg.summary}
                                </p>
                                <p style={{ fontSize: 12, color: "var(--alm-ink2)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <span>{formatStoredDistance(leg.distance, distanceUnit)} · {leg.duration}</span>
                                  <TollBadge
                                    originLat={stop.lat} originLng={stop.lng}
                                    destLat={stops[i + 1].lat} destLng={stops[i + 1].lng}
                                    targetDurationSeconds={leg?.durationSeconds ?? 0}
                                    compact
                                  />
                                </p>
                              </div>
                            </div>
                            <MapsButton
                              stops={[stop, stops[i + 1]]}
                              style={{
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 10,
                                fontFamily: "var(--font-mono, monospace)",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                background: "var(--alm-ink)",
                                color: "var(--alm-cream)",
                                border: "2px solid var(--alm-ink)",
                                borderRadius: 3,
                                padding: "5px 10px",
                                cursor: "pointer",
                              }}
                            >
                              <ExternalLink style={{ width: 12, height: 12 }} /> Maps
                            </MapsButton>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isLast && !leg && (
                      <div style={{ marginLeft: 52, marginTop: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            border: "2px dashed var(--alm-rule)",
                            borderRadius: 4,
                            padding: "10px 14px",
                            fontSize: 12,
                            color: "var(--alm-ink2)",
                            fontStyle: "italic",
                          }}
                        >
                          Route not selected — open in planner to choose
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ RIGHT: sidebar ══ */}
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-24" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Edit in Planner */}
          <Link
            href={`/planner?trip=${trip.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "var(--alm-red)",
              color: "var(--alm-cream)",
              border: "2px solid var(--alm-ink)",
              borderRadius: 4,
              padding: "12px",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "4px 4px 0 var(--alm-ink)",
              transition: "opacity 150ms",
            }}
          >
            <MapPin style={{ width: 14, height: 14 }} />
            ✎ Edit in Planner
          </Link>

          {/* Maps section */}
          <div style={sideCard}>
            <div style={sideCardHeader}>
              <Map style={{ width: 14, height: 14, color: "var(--alm-red)" }} />
              Open in Maps
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <MapsButton
                stops={stops}
                pickerAlign="left"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "var(--alm-ink)",
                  color: "var(--alm-cream)",
                  border: "2px solid var(--alm-ink)",
                  borderRadius: 4,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0 var(--alm-red)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <ExternalLink style={{ width: 14, height: 14, flexShrink: 0 }} />
                  Full route{" "}
                  <span style={{ opacity: 0.6, fontWeight: 400 }}>
                    {city(stops[0].address)} → {city(stops[stops.length - 1].address)}
                  </span>
                </span>
                <span style={{ fontSize: 10, opacity: 0.6, flexShrink: 0, marginLeft: 8 }}>{stops.length} stops</span>
              </MapsButton>

              {hasMultipleLegs && stops.slice(0, -1).map((stop, i) => (
                <MapsButton
                  key={i}
                  stops={[stop, stops[i + 1]]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    background: "var(--alm-bg)",
                    color: "var(--alm-ink)",
                    border: "2px solid var(--alm-rule)",
                    borderRadius: 4,
                    padding: "7px 12px",
                    fontSize: 11,
                    fontFamily: "var(--font-mono, monospace)",
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ↗ {city(stop.address, 16)} → {city(stops[i + 1].address, 16)}
                  </span>
                  <span style={{ marginLeft: "auto", flexShrink: 0, color: "var(--alm-red)" }}>open</span>
                </MapsButton>
              ))}
            </div>
          </div>

          <NotesPanel tripId={trip.id} initial={trip.notes ?? null} />
          <ChecklistPanel tripId={trip.id} initial={trip.checklist ?? null} />
          {isOwner && <SharePanel trip={trip} />}

          <Link
            href="/trips"
            style={{
              display: "none",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--alm-ink2)",
              textDecoration: "none",
            }}
            className="lg:flex"
          >
            <ChevronRight style={{ width: 14, height: 14, transform: "rotate(180deg)" }} />
            Back to My Trips
          </Link>
        </div>
      </div>
    </>
  );
}
