"use client";

import { useEffect, useState } from "react";
import { fetchWeather, wmoToEmoji, wmoToLabel } from "@/lib/weatherUtils";
import type { WeatherData } from "@/lib/weatherUtils";
import { Wind, Droplets } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  arrivalTime24: string | null;
}

export default function WeatherBadge({ lat, lng, arrivalTime24 }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWeather(lat, lng, arrivalTime24).then((data) => {
      if (!cancelled) { setWeather(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [lat, lng, arrivalTime24]);

  if (loading) {
    return (
      <div className="mt-1.5 h-6 w-32 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }
  if (!weather) return null;

  const emoji = wmoToEmoji(weather.wmoCode);
  const label = wmoToLabel(weather.wmoCode);

  return (
    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
      {/* Condition pill */}
      <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
        <span>{emoji}</span>
        <span>{weather.tempF}°F</span>
        <span className="text-sky-400 dark:text-sky-500">·</span>
        <span>{label}</span>
      </span>

      {/* Rain probability */}
      {weather.rainPct > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[11px] text-blue-500 dark:text-blue-400 font-semibold">
          <Droplets className="w-3 h-3" />
          {weather.rainPct}%
        </span>
      )}

      {/* Wind */}
      {weather.windMph > 5 && (
        <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          <Wind className="w-3 h-3" />
          {weather.windMph} mph
        </span>
      )}
    </div>
  );
}
