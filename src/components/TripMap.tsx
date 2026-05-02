"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import type { PlaceResult, LegInfo, RouteOption, DistanceUnit } from "@/types";
import { metersToDistance } from "@/lib/mapsUtils";
import { Clock } from "lucide-react";

interface LegResult {
  legIndex: number;
  directions: google.maps.DirectionsResult;
  routes: RouteOption[];
}

interface Props {
  stops: PlaceResult[];
  departureTime?: string;
  arrivalTime?: string;
  selectedRoutePerLeg: number[];
  distanceUnit?: DistanceUnit;
  onLegRouteSelect: (legIndex: number, routeIndex: number) => void;
  onAllLegsLoaded?: (legInfos: LegInfo[]) => void;
}

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 39.5, lng: -98.35 };
const mapOptions: google.maps.MapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
};

const STOP_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#f43f5e", "#ef4444"];
const ALT_COLORS = ["#7c3aed", "#059669", "#d97706"];

// Always stores distances as "X mi" internally; display conversion happens at render time.
function parseRoutes(result: google.maps.DirectionsResult): RouteOption[] {
  return result.routes.map((route, index) => {
    let meters = 0, seconds = 0;
    route.legs.forEach((l) => { meters += l.distance?.value ?? 0; seconds += l.duration?.value ?? 0; });
    const miles = (meters * 0.000621371).toFixed(0);
    const h = Math.floor(seconds / 3600), m = Math.round((seconds % 3600) / 60);
    return { index, distance: `${miles} mi`, duration: h > 0 ? `${h}h ${m}m` : `${m}m`, summary: route.summary, durationSeconds: seconds };
  });
}

function stopLabel(i: number, total: number) {
  if (i === 0) return "A";
  if (i === total - 1) return String.fromCharCode(65 + i);
  return String.fromCharCode(65 + i);
}

export default function TripMap({ stops, departureTime, arrivalTime, selectedRoutePerLeg, distanceUnit = "mi", onLegRouteSelect, onAllLegsLoaded }: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Imperative polyline management — `@react-google-maps/api`'s <Polyline>
  // component does not reliably remove its underlying Google polyline on
  // unmount, nor push option changes (color, weight, zIndex) once mounted.
  // Both bugs cause "ghost" route lines to remain highlighted after the
  // user changes stops or selects a different route alternative.
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Tear down anything from the previous render before drawing new lines.
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    legResults.forEach((leg) => {
      const selIdx = selectedRoutePerLeg[leg.legIndex] ?? 0;
      leg.directions.routes.forEach((route, ridx) => {
        const isSelected = ridx === selIdx;
        const polyline = new window.google.maps.Polyline({
          path: route.overview_path,
          strokeColor: isSelected
            ? "#2563eb"
            : ALT_COLORS[ridx % ALT_COLORS.length],
          strokeWeight: isSelected ? 6 : 4,
          strokeOpacity: isSelected ? 0.95 : 0.35,
          zIndex: isSelected ? 10 : 1,
          clickable: !isSelected,
          map,
        });

        if (!isSelected) {
          polyline.addListener("click", () => {
            onLegRouteSelect(leg.legIndex, ridx);
          });
        }

        polylinesRef.current.push(polyline);
      });
    });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, legResults, selectedRoutePerLeg, onLegRouteSelect]);

  // Stable key for stops to avoid infinite re-fetches
  const stopsKey = stops.map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join("|");

  useEffect(() => {
    if (stops.length < 2 || !window.google) {
      setLegResults([]);
      return;
    }

    // Clear stale results immediately so any previous polylines
    // are removed from the map before the new directions arrive.
    // Without this, switching e.g. from [A,C] to [A,B,C] could leave
    // the old A→C polyline lingering until the new fetches finish.
    setLegResults([]);

    let cancelled = false;
    const service = new window.google.maps.DirectionsService();

    const fetches = stops.slice(0, -1).map((from, i) => {
      const to = stops[i + 1];
      return new Promise<LegResult | null>((resolve) => {
        service.route(
          {
            origin: { lat: from.lat, lng: from.lng },
            destination: { lat: to.lat, lng: to.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
          },
          (result, status) => {
            if (cancelled) { resolve(null); return; }
            if (status === "OK" && result) {
              resolve({ legIndex: i, directions: result, routes: parseRoutes(result) });
            } else {
              resolve(null);
            }
          }
        );
      });
    });

    Promise.all(fetches).then((results) => {
      if (cancelled) return;
      const valid = results.filter(Boolean) as LegResult[];
      setLegResults(valid);
      setError(valid.length === 0 ? "Could not calculate route. Check your locations." : null);

      onAllLegsLoaded?.(
        valid.map((r) => ({
          legIndex: r.legIndex,
          from: stops[r.legIndex].address,
          to: stops[r.legIndex + 1].address,
          routes: r.routes,
        }))
      );
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey]);

  // Fit map to all stops
  useEffect(() => {
    if (!map || stops.length === 0) return;
    if (stops.length === 1) { map.setCenter({ lat: stops[0].lat, lng: stops[0].lng }); map.setZoom(12); return; }
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 60);
  }, [map, stopsKey, legResults.length]);

  // Compute totals from selected routes
  const totals = useMemo(() => {
    if (legResults.length === 0) return null;
    let totalSeconds = 0, totalMiles = 0;
    legResults.forEach((leg) => {
      const r = leg.routes[selectedRoutePerLeg[leg.legIndex] ?? 0];
      if (r) {
        totalSeconds += r.durationSeconds;
        totalMiles += parseFloat(r.distance); // stored as "X mi"
      }
    });
    const h = Math.floor(totalSeconds / 3600), m = Math.round((totalSeconds % 3600) / 60);
    // Convert miles → preferred unit for display
    const distStr = distanceUnit === "km"
      ? `${(totalMiles * 1.60934).toFixed(0)} km`
      : `${totalMiles.toFixed(0)} mi`;
    return { duration: h > 0 ? `${h}h ${m}m` : `${m}m`, distance: distStr };
  }, [legResults, selectedRoutePerLeg, distanceUnit]);

  return (
    <div className="relative w-full h-full">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={4} onLoad={onLoad} onUnmount={onUnmount} options={mapOptions}>
        {/* Route polylines (selected + alternatives) are rendered
            imperatively in the useEffect above. */}

        {/* Custom stop markers */}
        {stops.map((stop, i) => (
          <Marker
            key={`marker-${i}`}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{ text: stopLabel(i, stops.length), color: "white", fontWeight: "bold", fontSize: "12px" }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 13,
              fillColor: STOP_COLORS[Math.min(i, STOP_COLORS.length - 1)],
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2.5,
            }}
          />
        ))}
      </GoogleMap>

      {/* Overlay — total summary */}
      {totals && (
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 animate-scale-in min-w-[190px]">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            {stops.length - 1} leg{stops.length > 2 ? "s" : ""} · total
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Distance</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totals.distance}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Drive time</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totals.duration}</p>
            </div>
          </div>
          {arrivalTime && (
            <div className="flex items-center gap-1.5 mt-3 py-2 px-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Arrive ~{arrivalTime}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm shadow-lg animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
}
