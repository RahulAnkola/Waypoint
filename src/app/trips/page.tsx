import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Map as MapIcon, Navigation, Plus, Sparkles } from "lucide-react";

import AnimatedHeading from "@/components/AnimatedHeading";
import ScrollReveal from "@/components/ScrollReveal";
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

  // All trips visible to this user (RLS: auth.uid() = ANY(user_ids))
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (trips as Trip[] | null) ?? [];
  // Stats only for trips the user created (index 0)
  const ownList = list.filter((t) => t.user_ids?.[0] === user.id);
  const total = ownList.length;
  const active = ownList.filter((t) => !t.completed).length;
  const completed = ownList.filter((t) => t.completed).length;

  return (
    <div className="relative min-h-[calc(100vh-64px)] mesh-bg dark:bg-gray-900">
      {/* Ambient backdrop — subtle, professional */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-blue-200/40 blur-3xl animate-blob"
        />
        <div
          className="absolute top-40 -right-24 w-[26rem] h-[26rem] rounded-full bg-violet-200/40 blur-3xl animate-blob"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
        {/* ─── Header ─── */}
        <ScrollReveal variant="up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 mb-2">
                <Sparkles className="w-3 h-3" />
                Your road log
              </span>
              <AnimatedHeading
                text="My"
                gradientText="Trips"
                className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight"
              />
              <p className="text-gray-500 mt-2 max-w-md">
                <span className="text-gray-500 dark:text-gray-400">Every route you&apos;ve mapped — pick up where you left off, mark them done, or kick off a new adventure.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <JoinTripButton />
              <Link
                href="/planner"
                className="btn-shine btn-tap inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl transition-shadow"
              >
                <Plus className="w-4 h-4" />
                New trip
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Stats strip ─── */}
        {total > 0 && (
          <ScrollReveal variant="up" delay={80}>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <StatCard
                label="Total trips"
                value={total}
                accent="from-blue-500 to-indigo-500"
                icon={<MapIcon className="w-4 h-4" />}
              />
              <StatCard
                label="Active"
                value={active}
                accent="from-amber-500 to-orange-500"
                icon={<Navigation className="w-4 h-4" />}
              />
              <StatCard
                label="Completed"
                value={completed}
                accent="from-emerald-500 to-teal-500"
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
            </div>
          </ScrollReveal>
        )}

        {/* ─── Trips list ─── */}
        <ScrollReveal variant="up" delay={140}>
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-600 text-sm space-y-1">
              <p className="font-semibold">Failed to load trips.</p>
              <p className="text-red-400 text-xs font-mono">{error.message}</p>
            </div>
          ) : (
            <TripsList trips={list} userId={user.id} />
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="lift relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-400">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}
        >
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tabular-nums">
        {value}
      </p>
    </div>
  );
}
