export interface TollEstimate {
  amount: number;     // USD
  currency: string;
  hasTolls: boolean;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(originLat: number, originLng: number, destLat: number, destLng: number): string {
  return `toll_${originLat.toFixed(3)}_${originLng.toFixed(3)}_${destLat.toFixed(3)}_${destLng.toFixed(3)}`;
}

interface CacheEntry { data: TollEstimate; ts: number }

function readCache(key: string): TollEstimate | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) { localStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

function writeCache(key: string, data: TollEstimate) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

export async function fetchTollEstimate(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<TollEstimate | null> {
  const key = cacheKey(originLat, originLng, destLat, destLng);
  const cached = readCache(key);
  if (cached) return cached;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "routes.travelAdvisory.tollInfo",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
          destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
          travelMode: "DRIVE",
          extraComputations: ["TOLLS"],
          routeModifiers: { avoidTolls: false },
        }),
      }
    );

    if (!res.ok) return null;
    const json = await res.json();

    const tollInfo = json.routes?.[0]?.travelAdvisory?.tollInfo;
    if (!tollInfo || !tollInfo.estimatedPrice?.length) {
      // Route exists but has no tolls
      const result: TollEstimate = { amount: 0, currency: "USD", hasTolls: false };
      writeCache(key, result);
      return result;
    }

    const price = tollInfo.estimatedPrice[0];
    const amount = parseFloat(price.units ?? "0") + (price.nanos ?? 0) / 1_000_000_000;
    const result: TollEstimate = { amount: parseFloat(amount.toFixed(2)), currency: price.currencyCode ?? "USD", hasTolls: amount > 0 };
    writeCache(key, result);
    return result;
  } catch {
    return null;
  }
}

export function formatToll(estimate: TollEstimate): string {
  if (!estimate.hasTolls) return "No tolls";
  return `~$${estimate.amount.toFixed(2)}`;
}
