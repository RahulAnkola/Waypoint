"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ExternalLink, Clock, Route, CheckCircle2, Circle,
  MapPin, Map,
} from "lucide-react";
import type { Trip, LegRoute } from "@/types";
import { createClient } from "@/lib/supabase/client";

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

/** First segment of an address, capped at `max` chars */
function city(address: string, max = 18): string {
  const c = address.split(",")[0].trim();
  return c.length <= max ? c : c.slice(0, max - 1) + "…";
}

function buildFullGmapsUrl(stops: { address: string }[]): string {
  if (stops.length < 2) return "#";
  const params = new URLSearchParams({
    origin: stops[0].address,
    destination: stops[stops.length - 1].address,
    travelmode: "driving",
  });
  if (stops.length > 2) {
    // Pass raw addresses — URLSearchParams handles encoding once.
    params.set("waypoints", stops.slice(1, -1).map(s => s.address).join("|"));
  }
  return `https://www.google.com/maps/dir/?api=1&${params}`;
}

function buildLegGmapsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;
}

const STOP_COLORS = ["bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-red-500"];
const STOP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* ─── component ─── */
export default function TripDetailClient({ trip }: { trip: Trip }) {
  const stops = [trip.origin, ...trip.waypoints, trip.destination];
  const legRoutes: LegRoute[] = trip.leg_routes ?? [];
  const depTime = trip.departure_time ?? null;
  const legCount = stops.length - 1; // number of route segments
  const [isCompleted, setIsCompleted] = useState(trip.completed);
  const isSyncingCompletion = useRef(false);

  /* cumulative arrival times */
  const stopTimes: string[] = [];
  if (depTime) {
    let cur = depTime;
    stopTimes.push(cur);
    legRoutes.forEach(leg => { cur = addSeconds(cur, leg.durationSeconds); stopTimes.push(cur); });
  }

  /* totals */
  const totalSeconds = legRoutes.reduce((a, l) => a + l.durationSeconds, 0);
  const totalMiles   = legRoutes.reduce((a, l) => a + parseFloat(l.distance), 0);
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.round((totalSeconds % 3600) / 60);

  /* per-leg completion — indexed by leg index, persisted to localStorage */
  const [doneLegs, setDoneLegs] = useState<boolean[]>(() => Array(legCount).fill(trip.completed));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`waypoint-legs-${trip.id}`);
      if (raw) {
        const parsed: boolean[] = JSON.parse(raw);
        setDoneLegs(parsed.length === legCount ? parsed : Array(legCount).fill(false));
      } else if (trip.completed) {
        const completedLegs = Array(legCount).fill(true);
        setDoneLegs(completedLegs);
        localStorage.setItem(`waypoint-legs-${trip.id}`, JSON.stringify(completedLegs));
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
      const { error } = await createClient()
        .from("trips")
        .update({ completed: nextCompleted })
        .eq("id", trip.id);
      if (error) setIsCompleted(prev => !prev);
      isSyncingCompletion.current = false;
    })();
  }, [pct, legCount, isCompleted, trip.id]);

  const fullGmapsUrl = buildFullGmapsUrl(stops);
  const hasMultipleLegs = stops.length > 2;

  /* progress bar color */
  const barColor = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400";
  const pctLabel = pct === 100
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : pct > 0
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{formatDate(trip.created_at)}</p>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 shrink-0 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )}
      </div>

      {/* ── Summary pills ── */}
      {legRoutes.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-4 mb-5">
          <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-blue-100">
            {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`} drive
          </span>
          <span className="bg-gray-50 text-gray-600 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200">
            {totalMiles.toFixed(0)} mi total
          </span>
          {stops.length > 1 && (
            <span className="bg-gray-50 text-gray-600 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200">
              {stops.length} stops · {legCount} leg{legCount > 1 ? "s" : ""}
            </span>
          )}
          {depTime && stopTimes.length > 0 && (
            <span className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime12(depTime)} → {formatTime12(stopTimes[stopTimes.length - 1])}
            </span>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      {legCount > 0 && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Trip progress
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pctLabel}`}>
              {doneLegCount} / {legCount} legs · {pct}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Google Maps section ── */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5" /> Open in Google Maps
        </p>

        {/* Full route */}
        <a
          href={fullGmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-gray-900 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all mb-2"
        >
          <span className="flex items-center gap-2 min-w-0">
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Full route&nbsp;
              <span className="opacity-60 font-normal">
                {city(stops[0].address)} → {city(stops[stops.length - 1].address)}
              </span>
            </span>
          </span>
          <span className="text-xs text-gray-400 shrink-0 ml-2">{stops.length} stops</span>
        </a>

        {/* Per-leg buttons — only when 3+ stops (= 2+ legs) */}
        {hasMultipleLegs && (
          <div className={`grid gap-2 ${legCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {stops.slice(0, -1).map((stop, i) => (
              <a
                key={i}
                href={buildLegGmapsUrl(stop.address, stops[i + 1].address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 active:scale-[0.97] transition-all truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {city(stop.address, 12)} → {city(stops[i + 1].address, 12)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Itinerary timeline ── */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-300 via-violet-300 to-red-300" />

        <div className="space-y-0">
          {stops.map((stop, i) => {
            const isLast = i === stops.length - 1;
            const leg = legRoutes.find(l => l.legIndex === i);
            const arriveTime = stopTimes[i];
            const colorClass = STOP_COLORS[Math.min(i, STOP_COLORS.length - 1)];
            const legDone = !isLast && (doneLegs[i] ?? false);

            return (
              <div key={i}>
                {/* Stop row — no check on stop, just info */}
                <div className="flex gap-4 items-start relative">
                  <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md border-2 border-white z-10 relative`}>
                    {STOP_LABELS[i] ?? i + 1}
                  </div>
                  <div className="flex-1 pb-6 pt-1.5 min-w-0">
                    <p className="font-semibold text-gray-900 text-base leading-snug truncate">
                      {stop.address}
                    </p>
                    {arriveTime && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {i === 0 ? "Depart" : "Arrive"} {formatTime12(arriveTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leg connector card — with completion toggle */}
                {!isLast && leg && (
                  <div className="ml-[52px] mb-2 -mt-3 relative z-10">
                    <div className={`border rounded-2xl px-3 py-2.5 shadow-sm transition-colors ${
                      legDone
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-gray-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        {/* Completion toggle */}
                        <button
                          onClick={() => toggleLeg(i)}
                          title={legDone ? "Mark leg as not done" : "Mark leg as done"}
                          className={`shrink-0 transition-all hover:scale-110 active:scale-95 ${
                            legDone ? "text-emerald-500" : "text-gray-300 hover:text-gray-400"
                          }`}
                        >
                          {legDone
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <Circle className="w-5 h-5" />
                          }
                        </button>

                        {/* Route info */}
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <Route className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${legDone ? "text-emerald-700" : "text-gray-800"}`}>
                              via {leg.summary}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {leg.distance} · {leg.duration}
                            </p>
                          </div>
                        </div>

                        {/* Maps link */}
                        <a
                          href={buildLegGmapsUrl(stop.address, stops[i + 1].address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Maps
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* No route data yet */}
                {!isLast && !leg && (
                  <div className="ml-[52px] mb-2 -mt-3">
                    <div className="border border-dashed border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-400">
                      Route not selected — open in planner to choose
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <Link
          href={`/planner?trip=${trip.id}`}
          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-semibold text-sm hover:bg-blue-100 active:scale-[0.98] transition-all border border-blue-100"
        >
          <MapPin className="w-4 h-4" />
          Edit in Planner
        </Link>
      </div>
    </div>
  );
}
