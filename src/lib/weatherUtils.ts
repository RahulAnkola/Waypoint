export interface WeatherData {
  tempF: number;
  rainPct: number;
  windMph: number;
  wmoCode: number;
}

export function wmoToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export function wmoToLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function cacheKey(lat: number, lng: number, date: string): string {
  return `wm2_${lat.toFixed(2)}_${lng.toFixed(2)}_${date}`;
}

interface CacheEntry { data: WeatherData; ts: number }

function readCache(key: string): WeatherData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) { localStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

function writeCache(key: string, data: WeatherData) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

/**
 * Compute the calendar date for a stop given departure date/time and elapsed seconds.
 * Used when a departure date is explicitly set.
 */
export function computeStopDate(
  departureDate: string,
  departureTime24: string,
  elapsedSeconds: number
): string {
  const [h, m] = departureTime24.split(":").map(Number);
  const base = new Date(`${departureDate}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
  base.setSeconds(base.getSeconds() + elapsedSeconds);
  return base.toISOString().slice(0, 10);
}

/**
 * Fallback: guess the forecast date from arrival time alone.
 * If the arrival time is more than 3h in the past, assume tomorrow.
 */
function guessForecastDate(arrivalTime24: string | null): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (!arrivalTime24) return today;
  const [h, m] = arrivalTime24.split(":").map(Number);
  const arrMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes - arrMinutes > 3 * 60) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  return today;
}

export async function fetchWeather(
  lat: number,
  lng: number,
  arrivalTime24: string | null,
  /** Explicit YYYY-MM-DD date. When provided, skips the guess logic. */
  explicitDate?: string
): Promise<WeatherData | null> {
  const date = explicitDate ?? guessForecastDate(arrivalTime24);
  const key = cacheKey(lat, lng, date);
  const cached = readCache(key);
  if (cached) return cached;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,windspeed_10m,weathercode");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("windspeed_unit", "mph");
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();

    const hourly = json.hourly;
    if (!hourly || !hourly.time) return null;

    let targetHour = 12;
    if (arrivalTime24) targetHour = parseInt(arrivalTime24.split(":")[0], 10);

    const idx = hourly.time.findIndex((t: string) => new Date(t).getHours() === targetHour);
    const i = idx >= 0 ? idx : Math.min(12, hourly.time.length - 1);

    const data: WeatherData = {
      tempF: Math.round(hourly.temperature_2m[i] ?? 0),
      rainPct: Math.round(hourly.precipitation_probability[i] ?? 0),
      windMph: Math.round(hourly.windspeed_10m[i] ?? 0),
      wmoCode: hourly.weathercode[i] ?? 0,
    };

    writeCache(key, data);
    return data;
  } catch {
    return null;
  }
}
