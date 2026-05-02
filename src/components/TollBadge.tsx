"use client";

import { useEffect, useState } from "react";
import { fetchTollEstimate, formatToll } from "@/lib/tollUtils";
import type { TollEstimate } from "@/lib/tollUtils";
import { Banknote } from "lucide-react";

interface Props {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  /** Duration of the selected route in seconds — used to match the correct route alternative */
  targetDurationSeconds?: number;
  /** When true renders a compact inline chip instead of a full badge row */
  compact?: boolean;
}

export default function TollBadge({ originLat, originLng, destLat, destLng, targetDurationSeconds = 0, compact }: Props) {
  const [toll, setToll] = useState<TollEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTollEstimate(originLat, originLng, destLat, destLng, targetDurationSeconds).then((data) => {
      if (!cancelled) { setToll(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [originLat, originLng, destLat, destLng, targetDurationSeconds]);

  if (loading) {
    return <span className="inline-block h-4 w-14 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse align-middle" />;
  }
  if (!toll) return null;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        toll.hasTolls ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"
      }`}>
        <Banknote className="w-3 h-3 shrink-0" />
        {formatToll(toll)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
      toll.hasTolls
        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500"
    }`}>
      <Banknote className="w-3 h-3 shrink-0" />
      {formatToll(toll)}
      {toll.hasTolls && <span className="font-normal opacity-70">est.</span>}
    </span>
  );
}
