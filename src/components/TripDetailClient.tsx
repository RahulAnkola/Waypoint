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

const STOP_COLORS = ["bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-red-500"];
const STOP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* ─── Notes auto-save panel ─── */
function NotesPanel({ tripId, initial }: { tripId: string; initial: string | null }) {
  const [text, setText] = useState(initial ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = async (val: string) => {
    setStatus("saving");
    await createClient()
      .from("trips")
      .update({ notes: val.trim() || null })
      .eq("id", tripId);
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Notes
        </span>
        <span className="text-[10px] font-semibold">
          {status === "saving" && (
            <span className="flex items-center gap-1 text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </span>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Jot down packing reminders, hotel bookings, food stops, anything…"
        rows={8}
        className="w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed resize-none bg-transparent outline-none placeholder:text-gray-300"
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" /> Packing / Checklist
        </span>
        {items.length > 0 && (
          <span className="text-[10px] font-semibold text-gray-400">
            {done}/{items.length}
          </span>
        )}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <ul className="divide-y divide-gray-50 dark:divide-gray-700 max-h-52 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 px-3 py-2 group">
              <button
                onClick={() => toggleItem(item.id)}
                className={`shrink-0 transition-colors ${item.done ? "text-emerald-500" : "text-gray-300 hover:text-gray-400"}`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>
              <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="shrink-0 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-50 dark:border-gray-700">
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          placeholder="Add item (e.g. Gas up, Snacks)"
          className="flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-300 bg-transparent outline-none py-1"
        />
        <button
          onClick={addItem}
          disabled={!newText.trim()}
          className="shrink-0 p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type Member = { user_id: string; role: string; username: string | null };

/* Fetch display names via RPC (username → email prefix fallback, SECURITY DEFINER) */
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

/* ─── Party popup — reads user_ids directly from the trip, no extra DB call ─── */
function PartyPopup({ userIds }: { userIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfiles(userIds).then(setMembers);
  }, [userIds.join(",")]);

  // Close on outside click
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
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 bg-violet-100 text-violet-600 hover:bg-violet-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors"
      >
        <Users className="w-3 h-3" /> Party · {userIds.length}
      </button>

      {open && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 z-50 animate-fade-in"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> Trip party
          </p>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${m.role === "organiser" ? "bg-blue-500" : "bg-violet-400"}`}>
                  {(m.username ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{m.username ?? "Unknown"}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 capitalize">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Share panel (link only, no member list — members shown in PartyPopup) ─── */
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

  // joinPath is safe to render on both server and client (no window reference)
  const joinPath = shareCode ? `/trips/join/${shareCode}` : null;

  const copyLink = async () => {
    if (!joinPath) return;
    await navigator.clipboard.writeText(window.location.origin + joinPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-700">
        <Share2 className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Share trip</span>
      </div>
      <div className="p-4">
        {shareCode && joinPath ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Anyone with this link can join and edit:</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
              <span className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{joinPath}</span>
              <button onClick={copyLink} className="shrink-0 p-1 rounded-lg hover:bg-gray-200 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Generate a link so others can join and edit this trip.</p>
            <button
              onClick={generateCode}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              {generating ? "Generating…" : "Generate share link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Trip-level toll total ─── */
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

  if (loading) return <span className="inline-block h-7 w-24 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />;
  if (total === null) return null;
  return (
    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
      total > 0
        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
    }`}>
      💰 {total > 0 ? `~$${total.toFixed(2)} tolls` : "No tolls"}
    </span>
  );
}

/* ─── main component ─── */
export default function TripDetailClient({ trip }: { trip: Trip }) {
  const stops = [trip.origin, ...trip.waypoints, trip.destination];
  const legRoutes: LegRoute[] = trip.leg_routes ?? [];
  const depTime = trip.departure_time ?? null;
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

  /* cumulative arrival times */
  const stopTimes: string[] = [];
  if (depTime) {
    let cur = depTime;
    stopTimes.push(cur);
    legRoutes.forEach(leg => { cur = addSeconds(cur, leg.durationSeconds); stopTimes.push(cur); });
  }

  /* totals */
  const totalSeconds = legRoutes.reduce((a, l) => a + l.durationSeconds, 0);
  const totalMilesRaw = legRoutes.reduce((a, l) => a + parseFloat(l.distance), 0);
  const totalDistStr = distanceUnit === "km"
    ? `${(totalMilesRaw * 1.60934).toFixed(0)} km`
    : `${totalMilesRaw.toFixed(0)} mi`;
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.round((totalSeconds % 3600) / 60);

  /* per-leg completion */
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

  /* sync completion to DB when progress hits 0% or 100% */
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
  const barColor = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400";
  const pctPill  = pct === 100
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : pct > 0
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <>
      {/* ── Header (full width) ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{trip.name}</h1>
            <PartyPopup userIds={trip.user_ids ?? []} />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">{formatDate(trip.created_at)}</p>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 shrink-0 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )}
      </div>

      {/* ── Summary pills (full width) ── */}
      {legRoutes.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap mb-2">
            <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-blue-100">
              {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`} drive
            </span>
            <span className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
              {totalDistStr} total
            </span>
            {stops.length > 1 && (
              <span className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                {stops.length} stops · {legCount} leg{legCount > 1 ? "s" : ""}
              </span>
            )}
            {depTime && stopTimes.length > 0 && (
              <span className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTime12(depTime)} → {formatTime12(stopTimes[stopTimes.length - 1])}
              </span>
            )}
            <TripTollTotal stops={stops} legRoutes={legRoutes} />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-5">
            Toll estimates are approximate and may vary. Actual tolls depend on vehicle class and payment method.
          </p>
        </>
      )}

      {/* ── Two-column grid on large screens ── */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

        {/* ══ LEFT: timeline ══ */}
        <div>
          {/* Progress bar */}
          {legCount > 0 && (
            <div className="mb-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip progress</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pctPill}`}>
                  {doneLegCount} / {legCount} legs · {pct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Itinerary timeline */}
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-300 via-violet-300 to-red-300" />
            <div className="space-y-0">
              {stops.map((stop, i) => {
                const isLast  = i === stops.length - 1;
                const leg     = legRoutes.find(l => l.legIndex === i);
                const arrTime = stopTimes[i];
                const color   = STOP_COLORS[Math.min(i, STOP_COLORS.length - 1)];
                const legDone = !isLast && (doneLegs[i] ?? false);

                return (
                  <div key={i}>
                    {/* Stop row */}
                    <div className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md border-2 border-white z-10 relative`}>
                        {STOP_LABELS[i] ?? i + 1}
                      </div>
                      <div className="flex-1 pb-6 pt-1.5 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-base leading-snug">{stop.address}</p>
                        {arrTime && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {i === 0 ? "Depart" : "Arrive"} {formatTime12(arrTime)}
                            </span>
                          </div>
                        )}
                        <WeatherBadge lat={stop.lat} lng={stop.lng} arrivalTime24={arrTime ?? null} />
                      </div>
                    </div>

                    {/* Leg connector */}
                    {!isLast && leg && (
                      <div className="ml-[52px] mb-2 -mt-3 relative z-10">
                        <div className={`border rounded-2xl px-3 py-2.5 shadow-sm transition-colors ${
                          legDone ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600"
                        }`}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleLeg(i)}
                              title={legDone ? "Unmark leg" : "Mark leg done"}
                              className={`shrink-0 transition-all hover:scale-110 active:scale-95 ${
                                legDone ? "text-emerald-500" : "text-gray-300 hover:text-gray-400"
                              }`}
                            >
                              {legDone
                                ? <CheckCircle2 className="w-5 h-5" />
                                : <Circle className="w-5 h-5" />
                              }
                            </button>
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                              <Route className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${legDone ? "text-emerald-700" : "text-gray-800 dark:text-gray-100"}`}>
                                  via {leg.summary}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
                              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Maps
                            </MapsButton>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isLast && !leg && (
                      <div className="ml-[52px] mb-2 -mt-3">
                        <div className="border border-dashed border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500">
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
        <div className="mt-8 lg:mt-0 space-y-5 lg:sticky lg:top-24">

          {/* Maps section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5" /> Open in Maps
            </p>

            {/* Full route */}
            <MapsButton
              stops={stops}
              pickerAlign="left"
              className="flex items-center justify-between w-full bg-gray-900 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all mb-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Full route{" "}
                  <span className="opacity-60 font-normal">
                    {city(stops[0].address)} → {city(stops[stops.length - 1].address)}
                  </span>
                </span>
              </span>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{stops.length} stops</span>
            </MapsButton>

            {/* Per-leg list */}
            {hasMultipleLegs && (
              <div className="flex flex-col gap-1.5 mt-2">
                {stops.slice(0, -1).map((stop, i) => (
                  <MapsButton
                    key={i}
                    stops={[stop, stops[i + 1]]}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-[0.98] transition-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{city(stop.address, 16)} → {city(stops[i + 1].address, 16)}</span>
                  </MapsButton>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <NotesPanel tripId={trip.id} initial={trip.notes ?? null} />

          {/* Checklist */}
          <ChecklistPanel tripId={trip.id} initial={trip.checklist ?? null} />

          {/* Edit in Planner */}
          <Link
            href={`/planner?trip=${trip.id}`}
            className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-3 rounded-xl font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-[0.98] transition-all border border-blue-100 dark:border-blue-800"
          >
            <MapPin className="w-4 h-4" />
            Edit in Planner
          </Link>

          {/* Share — organiser only */}
          {isOwner && <SharePanel trip={trip} />}

          {/* Back link — only visible in the sidebar on desktop */}
          <Link
            href="/trips"
            className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Back to My Trips
          </Link>
        </div>
      </div>
    </>
  );
}
