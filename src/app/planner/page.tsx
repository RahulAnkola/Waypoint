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
import { getDistanceUnitLocal, formatStoredDistance, getMapsPreference, buildMapsUrl } from "@/lib/mapsUtils";
import type { MapsApp } from "@/lib/mapsUtils";
import {
  Plus, Trash2, ExternalLink, Save, Loader2,
  AlertCircle, CheckCircle2, Clock, Navigation,
  ChevronUp, ChevronDown, Route, Copy, Pencil,
  GripVertical, Banknote,
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
const TollBadge = dynamic(() => import("@/components/TollBadge"), { ssr: false });
const AiChat = dynamic(() => import("@/components/AiChat"), { ssr: false });
import { fetchTollEstimate } from "@/lib/tollUtils";
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
        <div
          className="w-3 h-3 rounded-full z-10 transition-colors"
          style={{
            background: overlay ? "var(--alm-red)" : "var(--alm-amber)",
            border: "2px solid var(--alm-cream)",
            boxShadow: "0 1px 4px rgba(31,26,23,0.18)",
          }}
        />
        {!overlay && (
          <div className="w-px mt-1" style={{ height: 36, background: "var(--alm-rule)" }} />
        )}
      </div>
      <div
        className={`flex gap-2 items-end`}
        style={overlay ? {
          background: "var(--alm-cream)",
          borderRadius: 4,
          border: "2px solid var(--alm-ink)",
          boxShadow: "4px 4px 0 var(--alm-red)",
          padding: "4px 8px",
        } : {}}
      >
        <div
          className={`mb-1 p-1.5 rounded transition-all shrink-0 touch-none ${
            overlay ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ color: overlay ? "var(--alm-red)" : "var(--alm-rule)" }}
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
          className="mb-0.5 p-2 rounded transition-all shrink-0"
          style={{ color: "var(--alm-rule)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,91,58,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-rule)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
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

function PlannerTollTotal({
  legs,
}: {
  legs: { originLat: number; originLng: number; destLat: number; destLng: number; durationSeconds: number }[];
}) {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!legs.length) { setLoading(false); return; }
    let cancelled = false;
    Promise.all(
      legs.map(l => fetchTollEstimate(l.originLat, l.originLng, l.destLat, l.destLng, l.durationSeconds))
    ).then((results) => {
      if (cancelled) return;
      const sum = results.reduce((acc, r) => acc + (r?.amount ?? 0), 0);
      setTotal(parseFloat(sum.toFixed(2)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs.map(l => `${l.originLat.toFixed(3)},${l.originLng.toFixed(3)},${l.durationSeconds}`).join("|")]);

  if (loading) return (
    <span
      className="inline-block h-4 w-16 rounded-full animate-pulse"
      style={{ background: "var(--alm-rule)" }}
    />
  );
  if (total === null) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
      style={{
        background: total > 0 ? "rgba(192,138,53,0.12)" : "rgba(31,26,23,0.06)",
        border: `1px solid ${total > 0 ? "var(--alm-amber)" : "var(--alm-rule)"}`,
        color: total > 0 ? "var(--alm-amber)" : "var(--alm-ink2)",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      <Banknote className="w-3 h-3 shrink-0" />
      {total > 0 ? `~$${total.toFixed(2)} est.` : "No tolls"}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "2px solid var(--alm-rule)",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--alm-ink)",
  background: "var(--alm-bg)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 150ms",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontFamily: "var(--font-mono, monospace)",
  fontWeight: 700,
  color: "var(--alm-ink2)",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  marginBottom: 6,
};

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
  const [departureDate, setDepartureDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [legInfos, setLegInfos] = useState<LegInfo[]>([]);
  const [selectedRoutePerLeg, setSelectedRoutePerLeg] = useState<number[]>([]);
  const [savedLegRoutes, setSavedLegRoutes] = useState<LegRoute[]>([]);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");
  const [mapsApp, setMapsApp] = useState<MapsApp>("google");
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");

  /* ── Resizable sidebar ── */
  const [sidebarWidth, setSidebarWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

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
    const pref = getMapsPreference();
    setMapsApp(pref === "ask" ? "google" : (pref as MapsApp));
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
    (data: { name: string; origin: PlaceResult; destination: PlaceResult; waypoints: PlaceResult[]; departure_time: string | null; departure_date: string | null; leg_routes: LegRoute[] }) => {
      setTripName(data.name);
      setOrigin(data.origin);
      setDestination(data.destination);
      setWaypoints(data.waypoints.map((p) => ({ id: newWpId(), place: p })));
      if (data.departure_time) setDepartureTime(data.departure_time);
      if (data.departure_date) setDepartureDate(data.departure_date);
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

  const tripContext = useMemo(() => {
    if (stops.length < 2) return {};
    const totalH = Math.floor(totalSeconds / 3600);
    const totalM = Math.round((totalSeconds % 3600) / 60);
    const legs = legInfos.map((leg) => {
      const sel = selectedRoutePerLeg[leg.legIndex] ?? 0;
      const route = leg.routes[sel];
      return {
        from: leg.from.split(",")[0],
        to: leg.to.split(",")[0],
        duration: route?.duration ?? "",
        distance: route?.distance ?? "",
        route: route?.summary ?? "",
      };
    });
    return {
      tripName: tripName || undefined,
      origin: stops[0].address,
      destination: stops[stops.length - 1].address,
      stops: stops.slice(1, -1).map(s => s.address),
      departureTime: departureTime ? (() => { const [h, m] = departureTime.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; })() : undefined,
      departureDate: departureDate || undefined,
      totalDuration: totalSeconds > 0 ? (totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`) : undefined,
      totalDistance: legs.map(l => l.distance).filter(Boolean).join(" + ") || undefined,
      legs,
    };
  }, [stops, legInfos, selectedRoutePerLeg, totalSeconds, tripName, departureTime, departureDate]);

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
      departure_date: departureDate || null,
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
      departure_date: departureDate || null,
    });

    setSavingNew(false);
    setSaveStatus(error ? "error" : "success");
    if (error) setSaveError(error.message ?? "Unknown error");
    if (!error) setTimeout(() => setSaveStatus("idle"), 3000);
  };

  if (loadError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 64px)", background: "var(--alm-bg)" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <AlertCircle style={{ width: 48, height: 48, color: "var(--alm-red)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--alm-ink)", marginBottom: 8 }}>Maps failed to load</h2>
          <p style={{ fontSize: 13, color: "var(--alm-ink2)" }}>Check your <code style={{ background: "var(--alm-rule)", padding: "2px 6px", borderRadius: 2 }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 64px)", gap: 12, background: "var(--alm-bg)" }}>
        <Loader2 style={{ width: 32, height: 32, color: "var(--alm-red)" }} className="animate-spin" />
        <p style={{ fontSize: 13, color: "var(--alm-ink2)", fontFamily: "var(--font-mono, monospace)" }}>Loading maps…</p>
      </div>
    );
  }

  return (
    <div ref={layoutRef} className="flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {tripId && <PlannerLoader tripId={tripId} onLoaded={handleTripLoaded} />}

      {/* ── Sidebar (resizable) ── */}
      <aside
        style={{
          width: sidebarWidth,
          background: "var(--alm-cream)",
          borderRight: "2px solid var(--alm-rule)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div
          className="animate-fade-in"
          style={{
            padding: "20px 20px 16px",
            borderBottom: "2px solid var(--alm-rule)",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, letterSpacing: "0.2em", color: "var(--alm-red)", textTransform: "uppercase", marginBottom: 6 }}>
            ★ Route planner ★
          </div>
          <h1
            className="alm-display"
            style={{ fontSize: 22, fontWeight: 400, color: "var(--alm-ink)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}
          >
            <Navigation style={{ width: 18, height: 18, color: "var(--alm-red)", flexShrink: 0 }} />
            Plan your route
          </h1>
          <p style={{ fontSize: 12, color: "var(--alm-ink2)", marginTop: 4, marginLeft: 26, fontFamily: "var(--font-mono, monospace)" }}>
            Enter your stops, pick routes, and go
          </p>
        </div>

        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* From */}
          <div className="relative pl-7">
            <div className="absolute left-0 top-7 flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full z-10"
                style={{
                  background: "var(--alm-green)",
                  border: "2px solid var(--alm-cream)",
                  boxShadow: "0 1px 4px rgba(31,26,23,0.18)",
                }}
              />
              {(waypoints.length > 0 || destination) && (
                <div className="w-px mt-1" style={{ height: 36, background: "var(--alm-rule)" }} />
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
              <div
                className="w-3 h-3 rounded-full z-10"
                style={{
                  background: "var(--alm-red)",
                  border: "2px solid var(--alm-cream)",
                  boxShadow: "0 1px 4px rgba(31,26,23,0.18)",
                }}
              />
            </div>
            <PlaceAutocomplete label="To" placeholder="Destination" value={destination} onChange={setDestination} />
          </div>

          {/* Add stop */}
          <button
            type="button"
            onClick={addWaypoint}
            className="flex items-center gap-2 text-sm font-medium ml-7 px-2 py-1.5 rounded transition-all group"
            style={{ color: "var(--alm-red)", fontFamily: "var(--font-mono, monospace)", fontSize: 12, letterSpacing: "0.05em" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,91,58,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add a stop
          </button>

          {/* Departure date + time */}
          {stops.length > 0 && (
            <div className="ml-7 space-y-2 animate-slide-up">
              {/* Date picker */}
              <div>
                <label style={labelStyle}>Departure date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
                />
              </div>
              {/* Time picker */}
              <div>
                <label style={labelStyle}>Departure time</label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col shrink-0">
                    <button
                      type="button"
                      onClick={() => stepTime(15)}
                      style={{
                        padding: "4px",
                        borderRadius: "4px 4px 0 0",
                        border: "2px solid var(--alm-rule)",
                        borderBottom: "1px solid var(--alm-rule)",
                        background: "var(--alm-bg)",
                        color: "var(--alm-ink2)",
                        cursor: "pointer",
                        transition: "all 150ms",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,91,58,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--alm-bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-ink2)"; }}
                      title="+15 min"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepTime(-15)}
                      style={{
                        padding: "4px",
                        borderRadius: "0 0 4px 4px",
                        border: "2px solid var(--alm-rule)",
                        borderTop: "1px solid var(--alm-rule)",
                        background: "var(--alm-bg)",
                        color: "var(--alm-ink2)",
                        cursor: "pointer",
                        transition: "all 150ms",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(194,91,58,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-red)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--alm-bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--alm-ink2)"; }}
                      title="-15 min"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                      style={{ color: "var(--alm-ink2)" }}
                    />
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36 }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
                    />
                  </div>
                </div>
              </div>
              {departureTime && departureDate && (
                <p style={{ fontSize: 11, color: "var(--alm-ink2)", marginLeft: 40, fontFamily: "var(--font-mono, monospace)" }}>
                  Leaving {new Date(departureDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {formatTime12(departureTime)}
                </p>
              )}
            </div>
          )}

          {/* ── Per-leg route selectors ── */}
          {legInfos.length > 0 && (
            <div className="ml-7 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 pt-1">
                <Route className="w-3.5 h-3.5" style={{ color: "var(--alm-ink2)" }} />
                <p style={{ ...labelStyle, margin: 0 }}>Route options per leg</p>
              </div>

              {legInfos.map((leg) => {
                const selIdx = selectedRoutePerLeg[leg.legIndex] ?? 0;
                const selRoute = leg.routes[selIdx];
                return (
                  <div
                    key={leg.legIndex}
                    style={{
                      background: "var(--alm-bg)",
                      borderRadius: 4,
                      padding: 12,
                      border: "2px solid var(--alm-rule)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-5 h-5 text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{
                          borderRadius: "50%",
                          background: "var(--alm-red)",
                          color: "var(--alm-cream)",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {leg.legIndex + 1}
                      </span>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--alm-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {truncateAddr(leg.from)} → {truncateAddr(leg.to)}
                      </p>
                    </div>

                    {leg.routes.length === 1 ? (
                      <p
                        className="flex items-center gap-1.5 flex-wrap"
                        style={{ fontSize: 12, color: "var(--alm-ink2)", padding: "0 4px" }}
                      >
                        <span>via {selRoute?.summary} · {selRoute?.duration} · {selRoute?.distance}</span>
                        {stops[leg.legIndex] && stops[leg.legIndex + 1] && (
                          <TollBadge
                            originLat={stops[leg.legIndex].lat} originLng={stops[leg.legIndex].lng}
                            destLat={stops[leg.legIndex + 1].lat} destLng={stops[leg.legIndex + 1].lng}
                            targetDurationSeconds={selRoute?.durationSeconds ?? 0}
                            compact
                          />
                        )}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {leg.routes.map((r) => (
                          <button
                            key={r.index}
                            onClick={() => handleLegRouteSelect(leg.legIndex, r.index)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-all active:scale-[0.97]"
                            style={r.index === selIdx ? {
                              background: "var(--alm-ink)",
                              color: "var(--alm-cream)",
                              border: "none",
                            } : {
                              background: "var(--alm-cream)",
                              color: "var(--alm-ink)",
                              border: "2px solid var(--alm-rule)",
                            }}
                          >
                            <span className="truncate mr-2">via {r.summary}</span>
                            <span className="shrink-0 opacity-80">{r.duration}</span>
                          </button>
                        ))}
                        {stops[leg.legIndex] && stops[leg.legIndex + 1] && (
                          <div className="pt-1 px-1">
                            <TollBadge
                              originLat={stops[leg.legIndex].lat} originLng={stops[leg.legIndex].lng}
                              destLat={stops[leg.legIndex + 1].lat} destLng={stops[leg.legIndex + 1].lng}
                              targetDurationSeconds={selRoute?.durationSeconds ?? 0}
                              compact
                            />
                          </div>
                        )}
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
              <div
                style={{
                  background: "var(--alm-bg)",
                  borderRadius: 4,
                  padding: 16,
                  border: "2px solid var(--alm-ink)",
                  boxShadow: "4px 4px 0 var(--alm-red)",
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ ...labelStyle, color: "var(--alm-red)" }}>Total distance</p>
                    <p
                      className="alm-display"
                      style={{ fontSize: 24, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}
                    >
                      {formatStoredDistance(
                        `${legInfos.reduce((acc, leg) => acc + parseFloat(leg.routes[selectedRoutePerLeg[leg.legIndex] ?? 0]?.distance ?? "0"), 0).toFixed(0)} mi`,
                        distanceUnit
                      )}
                    </p>
                  </div>
                  <div>
                    <p style={{ ...labelStyle, color: "var(--alm-red)" }}>Total drive time</p>
                    <p
                      className="alm-display"
                      style={{ fontSize: 24, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}
                    >
                      {(() => { const h = Math.floor(totalSeconds / 3600), m = Math.round((totalSeconds % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; })()}
                    </p>
                  </div>
                </div>
                {arrivalTime && (
                  <div
                    className="mt-3 pt-3 flex items-center gap-2"
                    style={{ borderTop: "1px solid var(--alm-rule)" }}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--alm-red)" }} />
                    <div>
                      <p style={{ ...labelStyle, color: "var(--alm-red)", margin: 0, marginBottom: 2 }}>Arrive around</p>
                      <p
                        className="alm-display"
                        style={{ fontSize: 20, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}
                      >
                        {arrivalTime}
                      </p>
                    </div>
                  </div>
                )}
                {stops.length >= 2 && legInfos.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--alm-rule)" }}>
                    <p style={{ ...labelStyle, color: "var(--alm-red)", marginBottom: 4 }}>Est. tolls</p>
                    <PlannerTollTotal
                      legs={stops.slice(0, -1).map((from, i) => ({
                        originLat: from.lat, originLng: from.lng,
                        destLat: stops[i + 1].lat, destLng: stops[i + 1].lng,
                        durationSeconds: legInfos[i]?.routes[selectedRoutePerLeg[i] ?? 0]?.durationSeconds ?? 0,
                      }))}
                    />
                    <p style={{ fontSize: 10, color: "var(--alm-ink2)", marginTop: 4, fontFamily: "var(--font-mono, monospace)" }}>
                      Estimates only · actual tolls may vary
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div
          className="animate-fade-in space-y-3"
          style={{
            padding: 20,
            borderTop: "2px solid var(--alm-rule)",
            background: "var(--alm-bg)",
          }}
        >
          <button
            type="button"
            onClick={() => window.open(buildMapsUrl(mapsApp, stops), "_blank", "noopener,noreferrer")}
            disabled={!canOpenMaps}
            className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--alm-ink)",
              color: "var(--alm-cream)",
              border: "2px solid var(--alm-ink)",
              borderRadius: 4,
              boxShadow: canOpenMaps ? "4px 4px 0 var(--alm-red)" : "none",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              letterSpacing: "0.05em",
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Open in {mapsApp === "apple" ? "Apple Maps" : mapsApp === "waze" ? "Waze" : "Google Maps"}
          </button>

          {user ? (
            <div className="space-y-2">
              {/* Editing badge */}
              {tripId && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--alm-amber)",
                    background: "rgba(192,138,53,0.1)",
                    border: "1px solid var(--alm-amber)",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <Pencil className="w-3 h-3 shrink-0" />
                  Editing saved trip
                </div>
              )}

              <input
                type="text"
                placeholder="Trip name (e.g. Route 66 Adventure)"
                value={tripName}
                onChange={(e) => { setTripName(e.target.value); setSaveStatus("idle"); setSaveError(""); }}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
              />

              {/* Primary save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving || savingNew}
                className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: saveStatus === "success" ? "var(--alm-green)" : "var(--alm-ink)",
                  color: "var(--alm-cream)",
                  border: `2px solid ${saveStatus === "success" ? "var(--alm-green)" : "var(--alm-ink)"}`,
                  borderRadius: 4,
                  boxShadow: (canSave && !saving && !savingNew) ? `4px 4px 0 ${saveStatus === "success" ? "var(--alm-green)" : "var(--alm-red)"}` : "none",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                  letterSpacing: "0.05em",
                }}
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "transparent",
                    color: "var(--alm-ink)",
                    border: "2px solid var(--alm-ink)",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 12,
                    letterSpacing: "0.05em",
                  }}
                >
                  {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  {savingNew ? "Saving…" : "Save as new trip"}
                </button>
              )}

              {saveStatus === "error" && (
                <div
                  className="animate-fade-in px-3 py-2"
                  style={{
                    background: "rgba(194,91,58,0.08)",
                    border: "2px solid var(--alm-red)",
                    borderRadius: 4,
                  }}
                >
                  <p style={{ color: "var(--alm-red)", fontSize: 12, fontWeight: 600 }}>Failed to save</p>
                  {saveError && <p style={{ color: "var(--alm-red)", fontSize: 11, marginTop: 2, wordBreak: "break-word", opacity: 0.8 }}>{saveError}</p>}
                </div>
              )}
            </div>
          ) : (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--alm-ink2)", fontFamily: "var(--font-mono, monospace)" }}>
              <a href="/auth/login" style={{ color: "var(--alm-red)", fontWeight: 600, textDecoration: "underline" }}>Log in</a> to save your trips
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
        style={{
          width: 6,
          flexShrink: 0,
          cursor: "col-resize",
          background: isResizing ? "var(--alm-red)" : "var(--alm-rule)",
          position: "relative",
          transition: "background 150ms",
        }}
        className="group"
        onMouseEnter={(e) => { if (!isResizing) (e.currentTarget as HTMLDivElement).style.background = "rgba(194,91,58,0.35)"; }}
        onMouseLeave={(e) => { if (!isResizing) (e.currentTarget as HTMLDivElement).style.background = "var(--alm-rule)"; }}
      >
        {/* Visual grip — appears on hover/drag */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-10 transition-opacity ${
            isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{
            borderRadius: 4,
            background: "var(--alm-cream)",
            border: "2px solid var(--alm-rule)",
            boxShadow: "1px 1px 0 var(--alm-rule)",
          }}
        >
          <GripVertical className="w-3 h-3" style={{ color: "var(--alm-ink2)" }} />
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 relative">
        <TripMap
          stops={stops}
          departureTime={departureTime}
          arrivalTime={arrivalTime}
          selectedRoutePerLeg={selectedRoutePerLeg}
          distanceUnit={distanceUnit}
          onLegRouteSelect={handleLegRouteSelect}
          onAllLegsLoaded={handleAllLegsLoaded}
        />
        {stops.length < 2 && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 pointer-events-none select-none"
            style={{
              borderRadius: 999,
              background: "rgba(250,243,231,0.92)",
              border: "2px solid var(--alm-rule)",
              boxShadow: "2px 2px 0 var(--alm-rule)",
              color: "var(--alm-ink2)",
              fontSize: 13,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <svg className="w-4 h-4 shrink-0" style={{ color: "var(--alm-red)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Enter origin and destination to chat with AI
          </div>
        )}
        {stops.length >= 2 && (
          <AiChat
            tripContext={tripContext}
            containerRef={mapContainerRef}
            onAddStop={(name, address) => {
              if (!window.google?.maps) return;
              new window.google.maps.Geocoder().geocode(
                { address: `${name}, ${address}` },
                (results, status) => {
                  if (status === "OK" && results?.[0]) {
                    const loc = results[0].geometry.location;
                    setWaypoints(prev => [
                      ...prev,
                      {
                        id: `wp-${++wpIdCounter.current}`,
                        place: {
                          address: results[0].formatted_address,
                          lat: loc.lat(),
                          lng: loc.lng(),
                        },
                      },
                    ]);
                  }
                }
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  return <Suspense><PlannerInner /></Suspense>;
}
