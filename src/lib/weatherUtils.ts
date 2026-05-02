export interface WeatherData {
  tempF: number;
  rainPct: number;
  windMph: number;
  wmoCode: number;
}

// WMO weather code → emoji + label
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

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function cacheKey(lat: number, lng: number, date: string): string {
  return `wm_${lat.toFixed(2)}_${lng.toFixed(2)}_${date}`;
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
 * Determine the forecast date based on arrivalTime24.
 * If arrival time is more than 3 h in the past (relative to now), use tomorrow.
 */
function forecastDate(arrivalTime24: string | null): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (!arrivalTime24) return today;

  const [h, m] = arrivalTime24.split(":").map(Number);
  const arrMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes - arrMinutes > 3 * 60) {
    // arrival is more than 3h in the past → use tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  return today;
}

export async function fetchWeather(
  lat: number,
  lng: number,
  arrivalTime24: string | null
): Promise<WeatherData | null> {
  const date = forecastDate(arrivalTime24);
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
    url.searchParams.set("forecast_days", "1");

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();

    const hourly = json.hourly;
    if (!hourly || !hourly.time) return null;

    // Pick the hour closest to arrival time, or noon if none given
    let targetHour = 12;
    if (arrivalTime24) targetHour = parseInt(arrivalTime24.split(":")[0], 10);

    // Find index for target hour
    const idx = hourly.time.findIndex((t: string) => {
      const h = new Date(t).getHours();
      return h === targetHour;
    });
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
