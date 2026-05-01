"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trip } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink, Trash2, ArrowRight, Navigation,
  Map, Loader2, CheckCircle2, Circle, Clock, ChevronRight, MapPin,
} from "lucide-react";

function buildGoogleMapsUrl(trip: Trip): string {
  const stops = [trip.origin, ...trip.waypoints, trip.destination];
  const params = new URLSearchParams({ origin: stops[0].address, destination: stops[stops.length - 1].address, travelmode: "driving" });
  // Note: pass raw addresses — URLSearchParams.toString() handles encoding.
  // Pre-encoding here causes double-encoding (e.g. "Columbus, OH" → "Columbus%2C%20OH" in the URL bar).
  if (stops.length > 2) params.set("waypoints", stops.slice(1, -1).map(s => s.address).join("|"));
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const STOP_COLORS = ["bg-emerald-500", "bg-violet-400", "bg-amber-400", "bg-red-500"];

function TripCard({ trip, onDelete, onToggleComplete }: {
  trip: Trip;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${trip.name}"?`)) return;
    setDeleting(true);
    await createClient().from("trips").delete().eq("id", trip.id);
    onDelete(trip.id);
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    const val = !trip.completed;
    const legCount = Math.max(0, [trip.origin, ...trip.waypoints, trip.destination].length - 1);
    try {
      localStorage.setItem(`waypoint-legs-${trip.id}`, JSON.stringify(Array(legCount).fill(val)));
    } catch {
      // Ignore local storage failures; DB state remains source of truth.
    }
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
      className={`lift relative block bg-white border rounded-2xl p-5 transition-all duration-200 animate-slide-up group cursor-pointer overflow-hidden ${
        trip.completed
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
      }`}
    >
      {/* Soft gradient sheen on hover (function-respectful — only on hover). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base truncate transition-colors ${trip.completed ? "text-gray-400 line-through" : "text-gray-900 group-hover:text-blue-700"}`}>
              {trip.name}
            </h3>
            {trip.completed && (
              <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">Done</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(trip.created_at)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Stops */}
      <div className="relative pl-4 space-y-1.5 mb-3">
        <div className="absolute left-1 top-1.5 bottom-1.5 w-px bg-gradient-to-b from-emerald-300 via-violet-300 to-red-300" />
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ring-2 ring-white ${STOP_COLORS[Math.min(i, STOP_COLORS.length - 1)]}`} />
            <p className={`text-xs truncate ${i === 0 || i === stops.length - 1 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
              {stop.address.split(",")[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Timing chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-[11px] font-semibold bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-100">
          <MapPin className="w-2.5 h-2.5" /> {stopCount} stop{stopCount !== 1 ? "s" : ""}
        </span>
        {hasTiming && (
          <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
            {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`}
          </span>
        )}
        {trip.departure_time && (
          <span className="text-[11px] font-semibold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-violet-100">
            <Clock className="w-2.5 h-2.5" /> {formatTime12(trip.departure_time)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`btn-tap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
            trip.completed
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
        >
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : trip.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          {trip.completed ? "Completed" : "Mark done"}
        </button>

        <button
          onClick={e => { e.stopPropagation(); window.open(buildGoogleMapsUrl(trip), "_blank"); }}
          className="btn-tap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Maps
        </button>

        <button
          onClick={e => { e.stopPropagation(); router.push(`/planner?trip=${trip.id}`); }}
          className="btn-tap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-all"
        >
          <Map className="w-3 h-3" />
          Plan
        </button>
      </div>
    </div>
  );
}

type Filter = "all" | "active" | "completed";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  active: "Active",
  completed: "Completed",
};

export default function TripsList({ trips: initialTrips }: { trips: Trip[] }) {
  const [trips, setTrips] = useState(initialTrips);
  const [filter, setFilter] = useState<Filter>("all");

  const handleDelete = (id: string) => setTrips(p => p.filter(t => t.id !== id));
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
      <div className="text-center py-20 animate-fade-in bg-white/70 backdrop-blur-sm border border-gray-100 rounded-3xl">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200/40 rounded-full blur-2xl animate-pulse-glow" />
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-full shadow-lg">
              <Navigation className="w-9 h-9 text-white" />
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No trips yet</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Head to the planner to map your first road trip — pick stops, choose a route, and save it for later.
        </p>
        <Link
          href="/planner"
          className="btn-shine btn-tap inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:shadow-xl transition-shadow"
        >
          <ArrowRight className="w-4 h-4" /> Go to Planner
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 animate-fade-in">
        <div className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full p-1 shadow-sm">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-tap px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {FILTER_LABELS[f]}
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 animate-fade-in bg-white/60 border border-gray-100 rounded-2xl">
          No {filter} trips yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((trip, i) => (
            <div key={trip.id} style={{ animationDelay: `${i * 60}ms` }}>
              <TripCard trip={trip} onDelete={handleDelete} onToggleComplete={handleToggle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
