"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import PlannerLoader from "@/components/PlannerLoader";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { PlaceResult, LegInfo, LegRoute, DistanceUnit } from "@/types";
import { getDistanceUnitLocal, formatStoredDistance } from "@/lib/mapsUtils";
import {
  Plus, Trash2, ExternalLink, Save, Loader2,
  AlertCircle, CheckCircle2, Clock, Navigation,
  ChevronUp, ChevronDown, Route, Copy, Pencil,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* Resizable sidebar bounds. */
const SIDEBAR_DEFAULT_WIDTH = 340;
const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_MAX_WIDTH = 720;
const SIDEBAR_WIDTH_STORAGE_KEY = "planner:sidebar-width";

const clampSidebarWidth = (w: number) =>
  Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, w));

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
const LIBRARIES: ("places" | "geometry")[] = ["places"];

function buildGoogleMapsUrl(stops: PlaceResult[]): string {
  if (stops.length < 2) return "";
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1);
  const params = new URLSearchParams({
    origin: origin.address,
    destination: destination.address,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    // Note: pass raw addresses — URLSearchParams.toString() handles encoding.
    // Pre-encoding here causes double-encoding in the final URL.
    params.set("waypoints", waypoints.map((w) => w.address).join("|"));
  }
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
}

function adjustTimeBy(time: string, delta: number): string {
  let h = 0, m = 0;
  if (time) { [h, m] = time.split(":").map(Number); }
  else {
    const now = new Date();
    h = now.getHours();
    m = Math.ceil(now.getMinutes() / 15) * 15;
    if (m >= 60) { m -= 60; h += 1; }
  }
  const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function computeArrival(time24: string, totalSeconds: number): string {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + Math.round(totalSeconds / 60);
  const ah = Math.floor(total / 60) % 24, am = total % 60;
  const period = ah >= 12 ? "PM" : "AM";
  return `${ah % 12 === 0 ? 12 : ah % 12}:${String(am).padStart(2, "0")} ${period}`;
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function truncateAddr(addr: string, max = 22): string {
  const city = addr.split(",")[0];
  return city.length <= max ? city : city.slice(0, max - 1) + "…";
}

/* ─── Sortable waypoint row ─── */
interface WaypointItem { id: string; place: PlaceResult | null; }

function WaypointRow({
  item, idx, onChange, onRemove, isDragging = false, overlay = false,
}: {
  item: WaypointItem;
  idx: number;
  onChange: (id: string, place: PlaceResult | null) => void;
  onRemove: (id: string) => void;
  isDragging?: boolean;
  overlay?: boolean;
}) {
  return (
    <div
      className={`relative pl-7 transition-all duration-200 ${
        isDragging && !overlay ? "opacity-30 scale-[0.98]" : ""
      } ${overlay ? "drop-shadow-2xl" : ""}`}
    >
      <div className="absolute left-0 top-7 flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-colors ${overlay ? "bg-blue-500" : "bg-violet-400"}`} />
        {!overlay && (
          <div className="w-px bg-gradient-to-b from-violet-300 to-blue-300 mt-1" style={{ height: 36 }} />
        )}
      </div>
      <div className={`flex gap-2 items-end ${overlay ? "bg-white rounded-xl border border-blue-200 px-2 py-1 shadow-xl ring-2 ring-blue-100" : ""}`}>
        <div
          className={`mb-1 p-1.5 rounded-lg transition-all shrink-0 touch-none ${
            overlay ? "text-blue-500 cursor-grabbing" : "text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab"
          }`}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <PlaceAutocomplete
            label={`Stop ${idx + 1}`}
            placeholder="Add a stop"
            value={item.place}
            onChange={(p) => onChange(item.id, p)}
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="mb-0.5 p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SortableWaypoint({
  item, idx, onChange, onRemove,
}: {
  item: WaypointItem;
  idx: number;
  onChange: (id: string, place: PlaceResult | null) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25,1,0.5,1)",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WaypointRow
        item={item}
        idx={idx}
        onChange={onChange}
        onRemove={onRemove}
        isDragging={isDragging}
      />
    </div>
  );
}

function PlannerInner() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const searchParams = useSearchParams();
  const tripId = searchParams.get("trip");

  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [waypoints, setWaypoints] = useState<WaypointItem[]>([]);
  const wpIdCounter = useRef(0);
  const newWpId = () => `wp-${++wpIdCounter.current}`;
  const [tripName, setTripName] = useState("");
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    const m = Math.ceil(now.getMinutes() / 15) * 15;
    const h = m >= 60 ? (now.getHours() + 1) % 24 : now.getHours();
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  });
  const [legInfos, setLegInfos] = useState<LegInfo[]>([]);
  const [selectedRoutePerLeg, setSelectedRoutePerLeg] = useState<number[]>([]);
  const [savedLegRoutes, setSavedLegRoutes] = useState<LegRoute[]>([]);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");

  /* ── Resizable sidebar ── */
  const [sidebarWidth, setSidebarWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (!Number.isNaN(n)) setSidebarWidth(clampSidebarWidth(n));
      }
    } catch { /* ignore */ }
    setDistanceUnit(getDistanceUnitLocal());
  }, []);

  // Persist whenever the user finishes adjusting.
  useEffect(() => {
    if (isResizing) return;
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
    } catch { /* ignore */ }
  }, [sidebarWidth, isResizing]);

  // Wire up document-level mouse listeners while a drag is in progress, so
  // the resize keeps tracking even if the cursor leaves the thin handle.
  useEffect(() => {
    if (!isResizing) return;
    const layout = layoutRef.current;
    const layoutLeft = layout ? layout.getBoundingClientRect().left : 0;

    const onMove = (e: MouseEvent) => {
      setSidebarWidth(clampSidebarWidth(e.clientX - layoutLeft));
    };
    const onUp = () => setIsResizing(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isResizing]);

  const handleTripLoaded = useCallback(
    (data: { name: string; origin: PlaceResult; destination: PlaceResult; waypoints: PlaceResult[]; departure_time: string | null; leg_routes: LegRoute[] }) => {
      setTripName(data.name);
      setOrigin(data.origin);
      setDestination(data.destination);
      setWaypoints(data.waypoints.map((p) => ({ id: newWpId(), place: p })));
      if (data.departure_time) setDepartureTime(data.departure_time);
      setSavedLegRoutes(data.leg_routes);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => l.subscription.unsubscribe();
  }, []);

  // Derived stops array
  const stops = useMemo<PlaceResult[]>(() => {
    const arr: PlaceResult[] = [];
    if (origin) arr.push(origin);
    waypoints.forEach((w) => { if (w.place) arr.push(w.place); });
    if (destination) arr.push(destination);
    return arr;
  }, [origin, waypoints, destination]);

  // Reset leg selections when stops change
  useEffect(() => {
    setLegInfos([]);
    setSelectedRoutePerLeg([]);
  }, [stops.length]);

  const handleAllLegsLoaded = useCallback((infos: LegInfo[]) => {
    setLegInfos(infos);
    setSelectedRoutePerLeg(infos.map((leg) => {
      const saved = savedLegRoutes.find((r) => r.legIndex === leg.legIndex);
      // Clamp to valid range in case routes available have changed
      const maxIdx = Math.max(0, leg.routes.length - 1);
      return Math.min(saved?.routeIndex ?? 0, maxIdx);
    }));
  }, [savedLegRoutes]);

  const handleLegRouteSelect = useCallback((legIndex: number, routeIndex: number) => {
    setSelectedRoutePerLeg((prev) => {
      const next = [...prev];
      next[legIndex] = routeIndex;
      return next;
    });
  }, []);

  // Total trip seconds (sum of selected routes)
  const totalSeconds = useMemo(() => {
    return legInfos.reduce((acc, leg) => {
      const sel = selectedRoutePerLeg[leg.legIndex] ?? 0;
      return acc + (leg.routes[sel]?.durationSeconds ?? 0);
    }, 0);
  }, [legInfos, selectedRoutePerLeg]);

  const arrivalTime = departureTime && totalSeconds > 0
    ? computeArrival(departureTime, totalSeconds)
    : undefined;

  const [activeWpId, setActiveWpId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const addWaypoint = () => setWaypoints((p) => [...p, { id: newWpId(), place: null }]);
  const removeWaypoint = (id: string) => setWaypoints((p) => p.filter((w) => w.id !== id));
  const updateWaypoint = (id: string, place: PlaceResult | null) =>
    setWaypoints((p) => p.map((w) => (w.id === id ? { ...w, place } : w)));
  const handleDragStart = (event: DragStartEvent) => setActiveWpId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveWpId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWaypoints((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === active.id);
        const newIndex = prev.findIndex((w) => w.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };
  const activeWp = waypoints.find((w) => w.id === activeWpId) ?? null;
  const activeWpIdx = waypoints.findIndex((w) => w.id === activeWpId);

  const stepTime = (delta: number) => setDepartureTime((t) => adjustTimeBy(t, delta));

  const canOpenMaps = stops.length >= 2;
  const canSave = user && stops.length >= 2 && tripName.trim();

  const buildLegRoutes = (): LegRoute[] =>
    legInfos.map((leg) => {
      const sel = selectedRoutePerLeg[leg.legIndex] ?? 0;
      const route = leg.routes[sel];
      return {
        legIndex: leg.legIndex,
        routeIndex: sel,
        summary: route?.summary ?? "",
        distance: route?.distance ?? "",
        duration: route?.duration ?? "",
        durationSeconds: route?.durationSeconds ?? 0,
      };
    });

  // RLS already scopes trips to the current user — just check name uniqueness
  const checkDuplicateName = async (name: string, excludeId?: string): Promise<boolean> => {
    const supabase = createClient();
    let q = supabase.from("trips").select("id").eq("name", name);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    return (data?.length ?? 0) > 0;
  };

  // Save changes to existing trip (or insert if new)
  const handleSave = async () => {
    if (!canSave || !origin || !destination) return;
    setSaving(true);
    setSaveStatus("idle");
    setSaveError("");

    const name = tripName.trim();
    const isDupe = await checkDuplicateName(name, tripId ?? undefined);
    if (isDupe) {
      setSaving(false);
      setSaveStatus("error");
      setSaveError(`A trip named "${name}" already exists.`);
      return;
    }

    const supabase = createClient();
    const payload = {
      name,
      origin,
      destination,
      waypoints: waypoints.filter((w) => w.place).map((w) => w.place!),
      leg_routes: buildLegRoutes(),
      departure_time: departureTime || null,
    };

    // UPDATE: don't touch user_ids (members stay as-is)
    const { error } = tripId
      ? await supabase.from("trips").update(payload).eq("id", tripId)
      : await supabase.from("trips").insert({ ...payload, user_id: user!.id, user_ids: [user!.id], completed: false });

    setSaving(false);
    setSaveStatus(error ? "error" : "success");
    if (error) setSaveError(error.message ?? "Unknown error");
    if (!error) setTimeout(() => setSaveStatus("idle"), 3000);
  };

  // Always inserts a brand-new trip
  const handleSaveAsNew = async () => {
    if (!canSave || !origin || !destination) return;
    setSavingNew(true);
    setSaveStatus("idle");
    setSaveError("");

    const name = tripName.trim();
    const isDupe = await checkDuplicateName(name);
    if (isDupe) {
      setSavingNew(false);
      setSaveStatus("error");
      setSaveError(`A trip named "${name}" already exists. Use a different name.`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("trips").insert({
      user_id: user!.id,
      user_ids: [user!.id],
      name,
      origin,
      destination,
      waypoints: waypoints.filter((w) => w.place).map((w) => w.place!),
      completed: false,
      leg_routes: buildLegRoutes(),
      departure_time: departureTime || null,
    });

    setSavingNew(false);
    setSaveStatus(error ? "error" : "success");
    if (error) setSaveError(error.message ?? "Unknown error");
    if (!error) setTimeout(() => setSaveStatus("idle"), 3000);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center p-8 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Maps failed to load</h2>
          <p className="text-gray-500 text-sm">Check your <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Loading maps…</p>
      </div>
    );
  }

  return (
    <div ref={layoutRef} className="flex h-[calc(100vh-64px)] overflow-hidden">
      {tripId && <PlannerLoader tripId={tripId} onLoaded={handleTripLoaded} />}

      {/* ── Sidebar (resizable) ── */}
      <aside
        style={{ width: sidebarWidth }}
        className="bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col overflow-y-auto shrink-0 shadow-sm">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 animate-fade-in">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            Plan your route
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 ml-7">Enter your stops, pick routes, and go</p>
        </div>

        <div className="p-5 space-y-3 flex-1">
          {/* From */}
          <div className="relative pl-7">
            <div className="absolute left-0 top-7 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-md z-10" />
              {(waypoints.length > 0 || destination) && (
                <div className="w-px bg-gradient-to-b from-emerald-300 to-violet-300 mt-1" style={{ height: 36 }} />
              )}
            </div>
            <PlaceAutocomplete label="From" placeholder="Starting point" value={origin} onChange={setOrigin} showCurrentLocation />
          </div>

          {/* Waypoints — drag to reorder */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={waypoints.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              {waypoints.map((wp, idx) => (
                <SortableWaypoint
                  key={wp.id}
                  item={wp}
                  idx={idx}
                  onChange={updateWaypoint}
                  onRemove={removeWaypoint}
                />
              ))}
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
              }}
            >
              {activeWp ? (
                <WaypointRow
                  item={activeWp}
                  idx={activeWpIdx}
                  onChange={() => {}}
                  onRemove={() => {}}
                  overlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* To */}
          <div className="relative pl-7">
            <div className="absolute left-0 top-7">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-md z-10" />
            </div>
            <PlaceAutocomplete label="To" placeholder="Destination" value={destination} onChange={setDestination} />
          </div>

          {/* Add stop */}
          <button type="button" onClick={addWaypoint} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium ml-7 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-all group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add a stop
          </button>

          {/* Departure time */}
          {stops.length > 0 && (
            <div className="ml-7 animate-slide-up delay-150">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1.5">Departure time</label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <button type="button" onClick={() => stepTime(15)} className="p-1 rounded-t-lg border border-gray-200 dark:border-gray-600 border-b-0 bg-white dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors" title="+15 min">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => stepTime(-15)} className="p-1 rounded-b-lg border border-gray-200 dark:border-gray-600 border-t-0 bg-white dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors" title="-15 min">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-gray-300 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 shadow-sm transition-all" />
                </div>
              </div>
              {departureTime && <p className="text-xs text-gray-400 dark:text-gray-400 mt-1.5 ml-10">Leaving at {formatTime12(departureTime)}</p>}
            </div>
          )}

          {/* ── Per-leg route selectors ── */}
          {legInfos.length > 0 && (
            <div className="ml-7 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 pt-1">
                <Route className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route options per leg</p>
              </div>

              {legInfos.map((leg) => {
                const selIdx = selectedRoutePerLeg[leg.legIndex] ?? 0;
                const selRoute = leg.routes[selIdx];
                return (
                  <div key={leg.legIndex} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {leg.legIndex + 1}
                      </span>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
                        {truncateAddr(leg.from)} → {truncateAddr(leg.to)}
                      </p>
                    </div>

                    {leg.routes.length === 1 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        via {selRoute?.summary} · {selRoute?.duration} · {selRoute?.distance}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {leg.routes.map((r) => (
                          <button
                            key={r.index}
                            onClick={() => handleLegRouteSelect(leg.legIndex, r.index)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                              r.index === selIdx
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-500"
                            }`}
                          >
                            <span className="truncate mr-2">via {r.summary}</span>
                            <span className="shrink-0 opacity-80">{r.duration}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total summary */}
          {totalSeconds > 0 && (
            <div className="ml-7 animate-pop-in">
              <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wide">Total distance</p>
                    <p className="text-xl font-extrabold text-blue-900 dark:text-blue-200">
                      {formatStoredDistance(
                        `${legInfos.reduce((acc, leg) => acc + parseFloat(leg.routes[selectedRoutePerLeg[leg.legIndex] ?? 0]?.distance ?? "0"), 0).toFixed(0)} mi`,
                        distanceUnit
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wide">Total drive time</p>
                    <p className="text-xl font-extrabold text-blue-900 dark:text-blue-200">
                      {(() => { const h = Math.floor(totalSeconds / 3600), m = Math.round((totalSeconds % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; })()}
                    </p>
                  </div>
                </div>
                {arrivalTime && (
                  <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wide">Arrive around</p>
                      <p className="text-lg font-extrabold text-blue-900 dark:text-blue-200">{arrivalTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 animate-fade-in">
          <button type="button" onClick={() => window.open(buildGoogleMapsUrl(stops), "_blank")} disabled={!canOpenMaps}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </button>

          {user ? (
            <div className="space-y-2">
              {/* Editing badge */}
              {tripId && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Pencil className="w-3 h-3 shrink-0" />
                  Editing saved trip
                </div>
              )}

              <input
                type="text"
                placeholder="Trip name (e.g. Route 66 Adventure)"
                value={tripName}
                onChange={(e) => { setTripName(e.target.value); setSaveStatus("idle"); setSaveError(""); }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm transition-all"
              />

              {/* Primary save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving || savingNew}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] shadow-sm ${
                  saveStatus === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : saveStatus === "success" ? "Saved!" : tripId ? "Save changes" : "Save trip"}
              </button>

              {/* Save as new — only visible when editing an existing trip */}
              {tripId && (
                <button
                  type="button"
                  onClick={handleSaveAsNew}
                  disabled={!canSave || saving || savingNew}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  {savingNew ? "Saving…" : "Save as new trip"}
                </button>
              )}

              {saveStatus === "error" && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 animate-fade-in">
                  <p className="text-red-600 text-xs font-semibold">Failed to save</p>
                  {saveError && <p className="text-red-500 text-[11px] mt-0.5 break-words">{saveError}</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400 dark:text-gray-400">
              <a href="/auth/login" className="text-blue-600 hover:underline font-semibold">Log in</a> to save your trips
            </p>
          )}
        </div>
      </aside>

      {/* ── Drag handle: drag to resize, double-click to reset ── */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        title="Drag to resize · Double-click to reset"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
        className={`group relative w-1.5 shrink-0 cursor-col-resize transition-colors ${
          isResizing ? "bg-blue-400" : "bg-gray-100 dark:bg-gray-700 hover:bg-blue-200"
        }`}
      >
        {/* Visual grip — appears on hover/drag */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm w-4 h-10 transition-opacity ${
            isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <GripVertical className="w-3 h-3 text-gray-500" />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <TripMap
          stops={stops}
          departureTime={departureTime}
          arrivalTime={arrivalTime}
          selectedRoutePerLeg={selectedRoutePerLeg}
          distanceUnit={distanceUnit}
          onLegRouteSelect={handleLegRouteSelect}
          onAllLegsLoaded={handleAllLegsLoaded}
        />
      </div>
    </div>
  );
}

export default function PlannerPage() {
  return <Suspense><PlannerInner /></Suspense>;
}
