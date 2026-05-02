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

const STOP_COLORS = ["bg-emerald-500", "bg-violet-400", "bg-amber-400", "bg-red-500"];

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
      // Last person — actually delete the row
      await db.from("trips").delete().eq("id", trip.id);
    } else {
      // Remove self from user_ids; if owner leaves, index 1 is promoted automatically
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
      className={`lift relative block bg-white dark:bg-gray-800 border rounded-2xl p-5 transition-all duration-200 animate-slide-up group cursor-pointer overflow-hidden ${
        trip.completed
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl"
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-base truncate transition-colors ${trip.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400"}`}>
              {trip.name}
            </h3>
            {trip.completed && (
              <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">Done</span>
            )}
            {isParty && (
              <span className="shrink-0 inline-flex items-center gap-1 bg-violet-100 text-violet-600 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                <Users className="w-2.5 h-2.5" /> Party
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(trip.created_at)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Share button — only for owners */}
          {isOwner && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-xs font-medium ${copied ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" : "text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5"}`}
              title={trip.share_code ? "Copy share link" : "Share trip"}
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 shrink-0" /><span>Copied!</span></>
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {/* Delete/Leave — available to everyone */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title={userIds.length > 1 ? "Leave trip" : "Delete trip"}
          >
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
            <p className={`text-xs truncate ${i === 0 || i === stops.length - 1 ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
              {stop.address.split(",")[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Timing chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-[11px] font-semibold bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-100 dark:border-gray-600">
          <MapPin className="w-2.5 h-2.5" /> {stopCount} stop{stopCount !== 1 ? "s" : ""}
        </span>
        {hasTiming && (
          <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
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
              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
        >
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : trip.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          {trip.completed ? "Completed" : "Mark done"}
        </button>

        <MapsButton
          stops={stops}
          className="btn-tap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Maps
        </MapsButton>

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
      <div className="text-center py-20 animate-fade-in bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-3xl">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200/40 rounded-full blur-2xl animate-pulse-glow" />
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-full shadow-lg">
              <Navigation className="w-9 h-9 text-white" />
            </div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No trips yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
          Head to the planner to map your first road trip — pick stops, choose a route, and save it for later.
        </p>
        <Link href="/planner" className="btn-shine btn-tap inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:shadow-xl transition-shadow">
          <ArrowRight className="w-4 h-4" /> Go to Planner
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 animate-fade-in">
        <div className="inline-flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-full p-1 shadow-sm">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-tap px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {FILTER_LABELS[f]}
                <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 animate-fade-in bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl">
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
