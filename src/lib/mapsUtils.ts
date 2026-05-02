import type { MapsPreference, DistanceUnit } from "@/types";

export type MapsApp = "google" | "apple" | "waze";

export const MAPS_PREF_KEY = "waypoint-maps-pref";

export const MAPS_APP_OPTIONS: { id: MapsApp; label: string }[] = [
  { id: "google", label: "Google Maps" },
  { id: "apple",  label: "Apple Maps"  },
  { id: "waze",   label: "Waze"        },
];

export interface MapStop {
  address: string;
  lat: number;
  lng: number;
}

/** Build a navigation URL for the given app and list of stops. */
export function buildMapsUrl(app: MapsApp, stops: MapStop[]): string {
  if (stops.length < 2) return "#";
  const from = stops[0];
  const to   = stops[stops.length - 1];

  switch (app) {
    case "apple": {
      // Apple Maps supports multiple destinations via repeated daddr params
      const daddrs = stops.slice(1).map(s => `daddr=${encodeURIComponent(s.address)}`).join("&");
      return `https://maps.apple.com/?saddr=${encodeURIComponent(from.address)}&${daddrs}&dirflg=d`;
    }

    case "waze":
      // Waze has no multi-stop URL support — route to the final destination with origin hint
      return `https://waze.com/ul?ll=${to.lat}%2C${to.lng}&navigate=yes&from=${from.lat}%2C${from.lng}`;

    case "google":
    default: {
      const params = new URLSearchParams({
        origin: from.address,
        destination: to.address,
        travelmode: "driving",
      });
      if (stops.length > 2) {
        params.set("waypoints", stops.slice(1, -1).map(s => s.address).join("|"));
      }
      return `https://www.google.com/maps/dir/?api=1&${params}`;
    }
  }
}

/** Read the persisted maps preference from localStorage (client-only). */
export function getMapsPreference(): MapsPreference {
  if (typeof window === "undefined") return "google";
  const v = localStorage.getItem(MAPS_PREF_KEY);
  return v && ["google", "apple", "waze", "ask"].includes(v)
    ? (v as MapsPreference)
    : "google";
}

/** Persist the maps preference to localStorage (client-only). */
export function setMapsPreferenceLocal(pref: MapsPreference): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAPS_PREF_KEY, pref);
}

/* ─── Distance unit helpers ─── */
export const DISTANCE_UNIT_KEY = "waypoint-distance-unit";

/** Read the persisted distance unit from localStorage (client-only). */
export function getDistanceUnitLocal(): DistanceUnit {
  if (typeof window === "undefined") return "mi";
  const v = localStorage.getItem(DISTANCE_UNIT_KEY);
  return v === "km" ? "km" : "mi";
}

/** Persist the distance unit to localStorage (client-only). */
export function setDistanceUnitLocal(unit: DistanceUnit): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISTANCE_UNIT_KEY, unit);
}

/**
 * Convert a stored distance string (always stored as "X mi") to the
 * preferred display unit.
 */
export function formatStoredDistance(distStr: string, unit: DistanceUnit): string {
  const miles = parseFloat(distStr);
  if (isNaN(miles)) return distStr;
  if (unit === "km") return `${(miles * 1.60934).toFixed(0)} km`;
  return `${miles.toFixed(0)} mi`;
}

/** Convert raw meters from the Google Maps API to a display string. */
export function metersToDistance(meters: number, unit: DistanceUnit): string {
  if (unit === "km") return `${(meters / 1000).toFixed(0)} km`;
  return `${(meters * 0.000621371).toFixed(0)} mi`;
}
