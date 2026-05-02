export interface TollEstimate {
  amount: number;
  currency: string;
  hasTolls: boolean;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  targetSeconds: number
): string {
  // Include a bucketed duration so different selected routes get separate cache entries
  const bucket = Math.round(targetSeconds / 300); // 5-min buckets
  return `toll2_${originLat.toFixed(3)}_${originLng.toFixed(3)}_${destLat.toFixed(3)}_${destLng.toFixed(3)}_${bucket}`;
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

function parseMoney(price: { units?: string; nanos?: number }): number {
  return parseFloat(price.units ?? "0") + (price.nanos ?? 0) / 1_000_000_000;
}

/**
 * Fetch toll estimate for a single leg, matched to the user's selected route.
 *
 * We ask Routes API for alternatives and pick the route whose duration is
 * closest to the one the user selected in DirectionsService. This prevents
 * showing the toll for PA Turnpike when the user picked a US-322 route, etc.
 *
 * @param targetDurationSeconds Duration of the selected route in seconds.
 *   Pass 0 to use the first/default route (fallback).
 */
export async function fetchTollEstimate(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  targetDurationSeconds = 0
): Promise<TollEstimate | null> {
  const key = cacheKey(originLat, originLng, destLat, destLng, targetDurationSeconds);
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
          // Need duration to match routes; also request toll info
          "X-Goog-FieldMask": "routes.duration,routes.travelAdvisory.tollInfo",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
          destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
          travelMode: "DRIVE",
          computeAlternativeRoutes: true,
          extraComputations: ["TOLLS"],
          routeModifiers: { avoidTolls: false },
        }),
      }
    );

    if (!res.ok) return null;
    const json = await res.json();
    const routes: { duration?: string; travelAdvisory?: { tollInfo?: { estimatedPrice?: { units?: string; nanos?: number; currencyCode?: string }[] } } }[] = json.routes ?? [];
    if (!routes.length) return null;

    // Pick the route whose duration is closest to the selected route
    let bestRoute = routes[0];
    if (targetDurationSeconds > 0 && routes.length > 1) {
      let bestDiff = Infinity;
      for (const r of routes) {
        // duration comes back as "NNNs" (seconds with 's' suffix)
        const secs = parseInt(r.duration ?? "0", 10);
        const diff = Math.abs(secs - targetDurationSeconds);
        if (diff < bestDiff) { bestDiff = diff; bestRoute = r; }
      }
    }

    const tollInfo = bestRoute.travelAdvisory?.tollInfo;
    if (!tollInfo || !tollInfo.estimatedPrice?.length) {
      const result: TollEstimate = { amount: 0, currency: "USD", hasTolls: false };
      writeCache(key, result);
      return result;
    }

    const price = tollInfo.estimatedPrice[0];
    const amount = parseMoney(price);
    const result: TollEstimate = {
      amount: parseFloat(amount.toFixed(2)),
      currency: price.currencyCode ?? "USD",
      hasTolls: amount > 0,
    };
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
