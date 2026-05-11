"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Plus, Trash2, ExternalLink, Save, Loader2, CheckCircle2,
  Clock, ChevronUp, ChevronDown, Copy, Pencil,
  Banknote, Sparkles, GripVertical, MapPin,
} from "lucide-react";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import type { PlaceResult, LegInfo, DistanceUnit, LegRoute } from "@/types";
import type { MapsApp } from "@/lib/mapsUtils";
import { buildMapsUrl, formatStoredDistance } from "@/lib/mapsUtils";
import { fetchTollEstimate } from "@/lib/tollUtils";
import AiChat from "@/components/AiChat";
import type { User } from "@supabase/supabase-js";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragStartEvent, DragOverlay, defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
const TollBadge = dynamic(() => import("@/components/TollBadge"), { ssr: false });

/* ── Utilities ── */
function computeArrival(time24: string, totalSec: number): string {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + Math.round(totalSec / 60);
  const ah = Math.floor(total / 60) % 24, am = total % 60;
  return `${ah % 12 === 0 ? 12 : ah % 12}:${String(am).padStart(2, "0")} ${ah >= 12 ? "PM" : "AM"}`;
}
function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function city(addr: string) { return addr.split(",")[0]; }
function stepLetter(i: number) { return String.fromCharCode(65 + i); }

const STOP_COLORS = ["var(--alm-green)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-amber)", "var(--alm-red)"];
function stopColor(idx: number, total: number) {
  if (idx === 0) return "var(--alm-green)";
  if (idx === total - 1) return "var(--alm-red)";
  return "var(--alm-amber)";
}

/* ── Toll total for mobile ── */
function TollTotal({ legs }: { legs: { originLat: number; originLng: number; destLat: number; destLng: number; durationSeconds: number }[] }) {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!legs.length) { setLoading(false); return; }
    let cancelled = false;
    Promise.all(legs.map(l => fetchTollEstimate(l.originLat, l.originLng, l.destLat, l.destLng, l.durationSeconds))).then(results => {
      if (cancelled) return;
      setTotal(parseFloat(results.reduce((a, r) => a + (r?.amount ?? 0), 0).toFixed(2)));
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs.map(l => `${l.originLat.toFixed(3)},${l.originLng.toFixed(3)},${l.durationSeconds}`).join("|")]);
  if (loading) return <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: "var(--alm-ink2)" }}>…</span>;
  if (total === null) return null;
  return <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: total > 0 ? "var(--alm-amber)" : "var(--alm-ink2)" }}>{total > 0 ? `~$${total.toFixed(2)}` : "None"}</span>;
}

/* ── Waypoint types ── */
export interface WaypointItem { id: string; place: PlaceResult | null; }

/* ── Sortable stop row for mobile ── */
function MobileStopRow({ item, idx, total, onChange, onRemove, isDragging = false, overlay = false }: {
  item: WaypointItem; idx: number; total: number;
  onChange: (id: string, p: PlaceResult | null) => void;
  onRemove: (id: string) => void;
  isDragging?: boolean; overlay?: boolean;
}) {
  const letter = stepLetter(1 + idx); // B, C, D…
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px",
      opacity: isDragging && !overlay ? 0.3 : 1,
      background: overlay ? "var(--alm-cream)" : "transparent",
      border: overlay ? "2px solid var(--alm-ink)" : "none",
      borderRadius: overlay ? 4 : 0,
      boxShadow: overlay ? "3px 3px 0 var(--alm-red)" : "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: "var(--alm-amber)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 700,
        color: "var(--alm-cream)", flexShrink: 0,
      }}>{letter}</div>
      <div style={{ flex: 1 }}>
        <PlaceAutocomplete label="" placeholder={`Stop ${idx + 1}`} value={item.place} onChange={p => onChange(item.id, p)} />
      </div>
      <button type="button" onClick={() => onRemove(item.id)}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--alm-rule)", flexShrink: 0, padding: 4 }}>
        <Trash2 style={{ width: 16, height: 16 }} />
      </button>
      <div style={{ color: "var(--alm-rule)", cursor: overlay ? "grabbing" : "grab", flexShrink: 0, touchAction: "none" }}>
        <GripVertical style={{ width: 16, height: 16 }} />
      </div>
    </div>
  );
}

function SortableMobileStop({ item, idx, total, onChange, onRemove }: {
  item: WaypointItem; idx: number; total: number;
  onChange: (id: string, p: PlaceResult | null) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition: transition ?? "transform 200ms" }} {...attributes} {...listeners}>
      <MobileStopRow item={item} idx={idx} total={total} onChange={onChange} onRemove={onRemove} isDragging={isDragging} />
    </div>
  );
}

/* ── Props ── */
export interface PlannerMobileProps {
  origin: PlaceResult | null;
  destination: PlaceResult | null;
  waypoints: WaypointItem[];
  stops: PlaceResult[];
  setOrigin: (p: PlaceResult | null) => void;
  setDestination: (p: PlaceResult | null) => void;
  setWaypoints: React.Dispatch<React.SetStateAction<WaypointItem[]>>;
  addWaypoint: () => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, p: PlaceResult | null) => void;
  departureDate: string;
  departureTime: string;
  setDepartureDate: (d: string) => void;
  setDepartureTime: (t: string) => void;
  stepTime: (delta: number) => void;
  legInfos: LegInfo[];
  selectedRoutePerLeg: number[];
  handleLegRouteSelect: (legIndex: number, routeIndex: number) => void;
  onAllLegsLoaded: (infos: LegInfo[]) => void;
  totalSeconds: number;
  distanceUnit: DistanceUnit;
  mapsApp: MapsApp;
  tripContext: object;
  user: User | null;
  tripId: string | null;
  tripName: string;
  setTripName: (n: string) => void;
  saving: boolean;
  savingNew: boolean;
  saveStatus: "idle" | "success" | "error";
  saveError: string;
  handleSave: () => void;
  handleSaveAsNew: () => void;
  canSave: boolean;
  canOpenMaps: boolean;
  wpIdCounter: React.MutableRefObject<number>;
  onAddStopFromAI: (name: string, address: string) => void;
}

const TABS = ["STOPS", "LEGS", "SUMMARY", "SAVE"] as const;
type Tab = typeof TABS[number];

const mono: React.CSSProperties = { fontFamily: "var(--font-mono, monospace)" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "2px solid var(--alm-rule)", borderRadius: 4,
  fontSize: 13, color: "var(--alm-ink)",
  background: "var(--alm-bg)", outline: "none",
  fontFamily: "inherit", transition: "border-color 150ms",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10,
  fontFamily: "var(--font-mono, monospace)", fontWeight: 700,
  color: "var(--alm-ink2)", textTransform: "uppercase",
  letterSpacing: "0.18em", marginBottom: 6,
};

export default function PlannerMobile(p: PlannerMobileProps) {
  type SheetState = "peek" | "full";
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [activeTab, setActiveTab] = useState<Tab>("STOPS");

  const cycleSheet = () => setSheetState(s => s === "full" ? "peek" : "full");
  const sheetHeight = sheetState === "full" ? "70vh" : "130px";
  const [aiOpen, setAiOpen] = useState(false);
  const [activeWpId, setActiveWpId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (e: DragStartEvent) => setActiveWpId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveWpId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      p.setWaypoints(prev => {
        const oi = prev.findIndex(w => w.id === active.id);
        const ni = prev.findIndex(w => w.id === over.id);
        return arrayMove(prev, oi, ni);
      });
    }
  };
  const activeWp = p.waypoints.find(w => w.id === activeWpId) ?? null;
  const activeWpIdx = p.waypoints.findIndex(w => w.id === activeWpId);

  const arrivalTime = p.departureTime && p.totalSeconds > 0
    ? computeArrival(p.departureTime, p.totalSeconds)
    : undefined;

  const totalDist = p.legInfos.reduce((acc, leg) => {
    const sel = p.selectedRoutePerLeg[leg.legIndex] ?? 0;
    return acc + parseFloat(leg.routes[sel]?.distance ?? "0");
  }, 0);


  /* ── Floating stats card ── */
  const StatsCard = () => {
    if (p.totalSeconds === 0) return null;
    const h = Math.floor(p.totalSeconds / 3600), m = Math.round((p.totalSeconds % 3600) / 60);
    return (
      <div style={{
        position: "absolute", top: 12, left: 16, right: 16, zIndex: 5,
        background: "rgba(250,243,231,0.96)",
        border: "2px solid var(--alm-ink)",
        borderRadius: 4,
        boxShadow: "3px 3px 0 var(--alm-red)",
        padding: "10px 14px",
      }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--alm-ink2)", marginBottom: 4 }}>
          {p.legInfos.length} {p.legInfos.length === 1 ? "Leg" : "Legs"} · Total
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 28, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}>
            {formatStoredDistance(`${totalDist.toFixed(0)} mi`, p.distanceUnit)}
          </span>
          <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 28, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}>
            {h > 0 ? `${h}h ${m}m` : `${m}m`}
          </span>
        </div>
        {arrivalTime && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Clock style={{ width: 11, height: 11, color: "var(--alm-red)" }} />
            <span style={{ ...mono, fontSize: 11, color: "var(--alm-red)" }}>Arrive ~{arrivalTime}</span>
          </div>
        )}
      </div>
    );
  };

  /* ── Tab content ── */
  const StopsTab = () => (
    <div style={{ paddingBottom: 16 }}>
      {/* Origin */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--alm-rule)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "var(--alm-green)",
          display: "flex", alignItems: "center", justifyContent: "center",
          ...mono, fontSize: 11, fontWeight: 700, color: "var(--alm-cream)", flexShrink: 0,
        }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...labelStyle, marginBottom: 2 }}>From</div>
          <PlaceAutocomplete label="" placeholder="Starting point" value={p.origin} onChange={p.setOrigin} showCurrentLocation />
        </div>
      </div>

      {/* Waypoints */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={p.waypoints.map(w => w.id)} strategy={verticalListSortingStrategy}>
          {p.waypoints.map((wp, idx) => (
            <div key={wp.id} style={{ borderBottom: "1px solid var(--alm-rule)" }}>
              <SortableMobileStop item={wp} idx={idx} total={p.stops.length} onChange={p.updateWaypoint} onRemove={p.removeWaypoint} />
            </div>
          ))}
        </SortableContext>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
          {activeWp ? <MobileStopRow item={activeWp} idx={activeWpIdx} total={p.stops.length} onChange={() => {}} onRemove={() => {}} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Destination */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--alm-rule)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "var(--alm-red)",
          display: "flex", alignItems: "center", justifyContent: "center",
          ...mono, fontSize: 11, fontWeight: 700, color: "var(--alm-cream)", flexShrink: 0,
        }}>{stepLetter(p.waypoints.length + 1)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...labelStyle, marginBottom: 2 }}>To</div>
          <PlaceAutocomplete label="" placeholder="Destination" value={p.destination} onChange={p.setDestination} />
        </div>
      </div>

      {/* Add stop */}
      <button type="button" onClick={p.addWaypoint} style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "14px 16px",
        background: "transparent", border: "none", cursor: "pointer",
        ...mono, fontSize: 12, letterSpacing: "0.1em", color: "var(--alm-red)", fontWeight: 700,
        borderBottom: "1px solid var(--alm-rule)",
      }}>
        <Plus style={{ width: 14, height: 14 }} />
        Add a stop
      </button>

      {/* Departure */}
      {p.stops.length > 0 && (
        <div style={{ padding: "16px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Departure date</label>
            <input type="date" value={p.departureDate} onChange={e => p.setDepartureDate(e.target.value)}
              style={inputStyle}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Departure time</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button type="button" onClick={() => p.stepTime(15)} style={{ padding: 4, borderRadius: "3px 3px 0 0", border: "2px solid var(--alm-rule)", borderBottom: "1px solid var(--alm-rule)", background: "var(--alm-bg)", color: "var(--alm-ink2)", cursor: "pointer" }}>
                  <ChevronUp style={{ width: 12, height: 12 }} />
                </button>
                <button type="button" onClick={() => p.stepTime(-15)} style={{ padding: 4, borderRadius: "0 0 3px 3px", border: "2px solid var(--alm-rule)", borderTop: "1px solid var(--alm-rule)", background: "var(--alm-bg)", color: "var(--alm-ink2)", cursor: "pointer" }}>
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>
              </div>
              <input type="time" value={p.departureTime} onChange={e => p.setDepartureTime(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const LegsTab = () => (
    <div style={{ paddingBottom: 16 }}>
      {p.legInfos.length === 0 && (
        <div style={{ padding: 32, textAlign: "center" }}>
          <p style={{ ...mono, fontSize: 12, color: "var(--alm-ink2)" }}>Add origin and destination to see route options.</p>
        </div>
      )}

      {/* Departure info bar */}
      {p.departureDate && p.departureTime && (
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--alm-rule)" }}>
          <div style={{ flex: 1, padding: "12px 16px", borderRight: "1px solid var(--alm-rule)" }}>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Departure</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--alm-ink)" }}>
              {new Date(p.departureDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 16px" }}>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Time</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--alm-ink)" }}>
              {fmt12(p.departureTime)}
            </div>
          </div>
        </div>
      )}

      {p.legInfos.length > 0 && (
        <div style={{ padding: "12px 0" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--alm-red)", padding: "0 16px 8px" }}>
            · Route options per leg
          </div>
          {p.legInfos.map(leg => {
            const selIdx = p.selectedRoutePerLeg[leg.legIndex] ?? 0;
            const selRoute = leg.routes[selIdx];
            return (
              <div key={leg.legIndex} style={{ margin: "0 16px 12px", border: "2px solid var(--alm-rule)", borderRadius: 4, overflow: "hidden" }}>
                {/* Leg header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--alm-cream)", borderBottom: "1px solid var(--alm-rule)" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", background: "var(--alm-red)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...mono, fontSize: 9, fontWeight: 700, color: "var(--alm-cream)", flexShrink: 0,
                  }}>{leg.legIndex + 1}</span>
                  <span style={{ ...mono, fontSize: 11, color: "var(--alm-ink)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {city(leg.from)} → {city(leg.to)}
                  </span>
                </div>

                {/* Route options */}
                {leg.routes.length === 1 ? (
                  <div style={{ padding: "8px 12px" }}>
                    <div style={{ ...mono, fontSize: 12, color: "var(--alm-ink2)" }}>via {selRoute?.summary} · {selRoute?.duration} · {selRoute?.distance}</div>
                    {p.stops[leg.legIndex] && p.stops[leg.legIndex + 1] && (
                      <div style={{ marginTop: 6 }}>
                        <TollBadge originLat={p.stops[leg.legIndex].lat} originLng={p.stops[leg.legIndex].lng}
                          destLat={p.stops[leg.legIndex + 1].lat} destLng={p.stops[leg.legIndex + 1].lng}
                          targetDurationSeconds={selRoute?.durationSeconds ?? 0} compact />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {leg.routes.map(r => (
                      <button key={r.index} onClick={() => p.handleLegRouteSelect(leg.legIndex, r.index)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", border: "none", borderBottom: "1px solid var(--alm-rule)",
                          cursor: "pointer", transition: "all 150ms",
                          background: r.index === selIdx ? "var(--alm-ink)" : "transparent",
                          color: r.index === selIdx ? "var(--alm-cream)" : "var(--alm-ink)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: r.index === selIdx ? "2px solid var(--alm-cream)" : "2px solid var(--alm-rule)",
                            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {r.index === selIdx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--alm-red)" }} />}
                          </div>
                          <span style={{ ...mono, fontSize: 11, fontWeight: 600 }}>via {r.summary}</span>
                        </div>
                        <div style={{ ...mono, fontSize: 11, opacity: 0.8 }}>{r.duration} · {r.distance}</div>
                      </button>
                    ))}
                    {p.stops[leg.legIndex] && p.stops[leg.legIndex + 1] && (
                      <div style={{ padding: "8px 12px" }}>
                        <TollBadge originLat={p.stops[leg.legIndex].lat} originLng={p.stops[leg.legIndex].lng}
                          destLat={p.stops[leg.legIndex + 1].lat} destLng={p.stops[leg.legIndex + 1].lng}
                          targetDurationSeconds={selRoute?.durationSeconds ?? 0} compact />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const SummaryTab = () => {
    const h = Math.floor(p.totalSeconds / 3600), m = Math.round((p.totalSeconds % 3600) / 60);
    if (p.totalSeconds === 0) {
      return (
        <div style={{ padding: 32, textAlign: "center" }}>
          <p style={{ ...mono, fontSize: 12, color: "var(--alm-ink2)" }}>Add your route to see the summary.</p>
        </div>
      );
    }
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--alm-ink)", borderRadius: 4, overflow: "hidden", boxShadow: "4px 4px 0 var(--alm-red)" }}>
          {[
            { label: "Total distance", value: formatStoredDistance(`${totalDist.toFixed(0)} mi`, p.distanceUnit) },
            { label: "Total drive", value: h > 0 ? `${h}h ${m}m` : `${m}m` },
            { label: "Arrive around", value: arrivalTime ?? "—" },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "14px 16px",
              borderRight: i % 2 === 0 ? "1px solid var(--alm-rule)" : "none",
              borderBottom: i < 2 ? "1px solid var(--alm-rule)" : "none",
              gridColumn: i === 2 ? "span 2" : undefined,
            }}>
              <div style={{ ...labelStyle, color: "var(--alm-red)", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 24, fontWeight: 400, color: "var(--alm-ink)", lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
          <div style={{ padding: "14px 16px", borderRight: "1px solid var(--alm-rule)", gridColumn: "span 2", borderTop: "1px solid var(--alm-rule)" }}>
            <div style={{ ...labelStyle, color: "var(--alm-red)", marginBottom: 4 }}>Est. tolls</div>
            {p.stops.length >= 2 && p.legInfos.length > 0 ? (
              <TollTotal legs={p.stops.slice(0, -1).map((from, i) => ({
                originLat: from.lat, originLng: from.lng,
                destLat: p.stops[i + 1].lat, destLng: p.stops[i + 1].lng,
                durationSeconds: p.legInfos[i]?.routes[p.selectedRoutePerLeg[i] ?? 0]?.durationSeconds ?? 0,
              }))} />
            ) : <span style={{ ...mono, fontSize: 13, color: "var(--alm-ink2)" }}>—</span>}
          </div>
        </div>

        {/* Open in Maps */}
        <button type="button"
          onClick={() => window.open(buildMapsUrl(p.mapsApp, p.stops), "_blank", "noopener,noreferrer")}
          disabled={!p.canOpenMaps}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", width: "100%",
            background: "var(--alm-ink)", color: "var(--alm-cream)",
            border: "2px solid var(--alm-ink)", borderRadius: 4,
            boxShadow: p.canOpenMaps ? "4px 4px 0 var(--alm-red)" : "none",
            ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
            fontWeight: 700, cursor: p.canOpenMaps ? "pointer" : "not-allowed", opacity: p.canOpenMaps ? 1 : 0.4,
          }}>
          <ExternalLink style={{ width: 14, height: 14 }} />
          Open in {p.mapsApp === "apple" ? "Apple Maps" : p.mapsApp === "waze" ? "Waze" : "Google Maps"}
        </button>
      </div>
    );
  };

  const SaveTab = () => (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {p.user ? (
        <>
          {p.tripId && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(192,138,53,0.1)", border: "1px solid var(--alm-amber)", borderRadius: 4 }}>
              <Pencil style={{ width: 12, height: 12, color: "var(--alm-amber)" }} />
              <span style={{ ...mono, fontSize: 11, color: "var(--alm-amber)", fontWeight: 700 }}>Editing saved trip</span>
            </div>
          )}
          <input type="text" placeholder="Trip name (e.g. Route 66 Adventure)"
            value={p.tripName} onChange={e => p.setTripName(e.target.value)}
            style={inputStyle}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-ink)"; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--alm-rule)"; }}
          />
          <button type="button" onClick={p.handleSave}
            disabled={!p.canSave || p.saving || p.savingNew}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", width: "100%",
              background: p.saveStatus === "success" ? "var(--alm-green)" : "var(--alm-ink)",
              color: "var(--alm-cream)",
              border: `2px solid ${p.saveStatus === "success" ? "var(--alm-green)" : "var(--alm-ink)"}`,
              borderRadius: 4,
              boxShadow: (p.canSave && !p.saving) ? `4px 4px 0 ${p.saveStatus === "success" ? "var(--alm-green)" : "var(--alm-red)"}` : "none",
              ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
              fontWeight: 700, cursor: p.canSave && !p.saving ? "pointer" : "not-allowed",
              opacity: (!p.canSave || p.saving) ? 0.4 : 1,
            }}>
            {p.saving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : p.saveStatus === "success" ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
            {p.saving ? "Saving…" : p.saveStatus === "success" ? "Saved!" : p.tripId ? "Save changes" : "Save trip"}
          </button>
          {p.tripId && (
            <button type="button" onClick={p.handleSaveAsNew}
              disabled={!p.canSave || p.saving || p.savingNew}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px", width: "100%",
                background: "transparent", color: "var(--alm-ink)",
                border: "2px solid var(--alm-ink)", borderRadius: 4,
                ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                fontWeight: 700, cursor: "pointer",
              }}>
              {p.savingNew ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Copy style={{ width: 14, height: 14 }} />}
              {p.savingNew ? "Saving…" : "Save as new trip"}
            </button>
          )}
          {p.saveStatus === "error" && (
            <div style={{ padding: "10px 12px", background: "rgba(194,91,58,0.08)", border: "2px solid var(--alm-red)", borderRadius: 4 }}>
              <p style={{ color: "var(--alm-red)", fontSize: 12, fontWeight: 600 }}>Failed to save</p>
              {p.saveError && <p style={{ color: "var(--alm-red)", fontSize: 11, marginTop: 2, opacity: 0.8 }}>{p.saveError}</p>}
            </div>
          )}
        </>
      ) : (
        <p style={{ textAlign: "center", ...mono, fontSize: 12, color: "var(--alm-ink2)" }}>
          <a href="/auth/login" style={{ color: "var(--alm-red)", fontWeight: 700, textDecoration: "underline" }}>Log in</a> to save your trips
        </p>
      )}
    </div>
  );

  const legsCount = p.legInfos.length;

  return (
    <div style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>

      {/* ── Map (always full screen behind everything) ── */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }}>
        <TripMap
          stops={p.stops}
          departureTime={p.departureTime}
          arrivalTime={arrivalTime}
          selectedRoutePerLeg={p.selectedRoutePerLeg}
          distanceUnit={p.distanceUnit}
          onLegRouteSelect={p.handleLegRouteSelect}
          onAllLegsLoaded={p.onAllLegsLoaded}
        />
      </div>

      {/* ── Tap-to-collapse overlay (visible map area when sheet is full) ── */}
      {sheetState === "full" && (
        <div
          onClick={() => setSheetState("peek")}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "30vh",
            zIndex: 9,
            cursor: "pointer",
          }}
        />
      )}

      {/* ── Floating stats card ── */}
      <StatsCard />

      {/* ── Ask AI button ── */}
      {!aiOpen && p.stops.length >= 2 && (
        <button
          onClick={() => setAiOpen(true)}
          style={{
            position: "absolute",
            bottom: sheetState === "full" ? `calc(70vh + 12px)` : `${130 + 8}px`,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 8,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px",
            borderRadius: 999,
            background: "var(--alm-ink)",
            border: "2px solid var(--alm-ink)",
            boxShadow: "3px 3px 0 var(--alm-red)",
            color: "var(--alm-cream)",
            ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <Sparkles style={{ width: 13, height: 13, color: "var(--alm-red)", flexShrink: 0 }} />
          Ask AI about your trip
        </button>
      )}

      {/* ── Bottom sheet ── */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: sheetHeight,
        background: "var(--alm-cream)",
        borderTop: "2px solid var(--alm-ink)",
        borderRadius: "12px 12px 0 0",
        display: "flex",
        flexDirection: "column",
        transition: "height 300ms cubic-bezier(0.32,0.72,0,1)",
        zIndex: 10,
        overflow: "hidden",
      }}>
        {/* Drag pill — cycles mini → peek → full → mini */}
        <div
          onClick={cycleSheet}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px 6px", cursor: "pointer", flexShrink: 0 }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--alm-rule)", margin: "0 auto" }} />
        </div>

        {/* Header, tabs, content */}
        {(
          <>
            {/* Sheet header: eyebrow + trip name */}
            <div
              onClick={cycleSheet}
              style={{ padding: "0 16px 10px", cursor: "pointer", flexShrink: 0 }}
            >
              {(p.origin || p.destination) && (
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--alm-red)", marginBottom: 4 }}>
                  § Route · {p.stops.length} stop{p.stops.length !== 1 ? "s" : ""}
                  {p.tripId ? " · Editing" : ""}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {p.origin ? (
                  <>
                    <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 20, fontWeight: 400, color: "var(--alm-ink)" }}>
                      {city(p.origin.address)}
                    </span>
                    {p.destination && (
                      <>
                        <span style={{ color: "var(--alm-red)", fontSize: 16 }}>→</span>
                        <span style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 20, fontWeight: 400, color: "var(--alm-red)", fontStyle: "italic" }}>
                          {city(p.destination.address)}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span style={{ ...mono, fontSize: 13, color: "var(--alm-ink2)" }}>Plan your route</span>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderTop: "1px solid var(--alm-rule)", borderBottom: "2px solid var(--alm-ink)", flexShrink: 0 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSheetState("full"); }}
                  style={{
                    flex: 1, height: 40, border: "none",
                    borderRight: tab !== "SAVE" ? "1px solid var(--alm-rule)" : "none",
                    background: "transparent", cursor: "pointer",
                    ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700,
                    color: activeTab === tab ? "var(--alm-red)" : "var(--alm-ink2)",
                    borderBottom: activeTab === tab ? "2px solid var(--alm-red)" : "2px solid transparent",
                    position: "relative", top: 2, transition: "color 150ms",
                  }}
                >
                  {tab === "LEGS" && legsCount > 0 ? `LEGS · ${legsCount}` : tab}
                </button>
              ))}
            </div>

            {/* Tab content (scrollable, only shown when full) */}
            {sheetState === "full" && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {activeTab === "STOPS" && <StopsTab />}
                {activeTab === "LEGS" && <LegsTab />}
                {activeTab === "SUMMARY" && <SummaryTab />}
                {activeTab === "SAVE" && <SaveTab />}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── AI full-screen overlay ── */}
      {aiOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", flexDirection: "column",
          background: "var(--alm-bg)",
        }}>
          {/* AI header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "2px solid var(--alm-ink)",
            background: "var(--alm-cream)",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ ...mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--alm-red)", marginBottom: 2 }}>§ AI Companion</div>
              <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 20, fontWeight: 400, color: "var(--alm-ink)", fontStyle: "italic" }}>Glove-box guide</div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--alm-ink2)", padding: 8 }}>
              <span style={{ ...mono, fontSize: 18, lineHeight: 1 }}>×</span>
            </button>
          </div>
          {/* Trip context strip */}
          {p.stops.length >= 2 && (
            <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--alm-rule)", background: "var(--alm-cream)", flexShrink: 0 }}>
              <span style={{ ...mono, fontSize: 10, color: "var(--alm-ink2)", letterSpacing: "0.12em" }}>
                Reading your trip: {city(p.stops[0].address)} → {city(p.stops[p.stops.length - 1].address)} · {p.stops.length} stops{p.totalSeconds > 0 ? ` · ${formatStoredDistance(`${totalDist.toFixed(0)} mi`, p.distanceUnit)}` : ""}
              </span>
            </div>
          )}
          <AiChat
            standalone
            tripContext={p.tripContext}
            containerRef={mapRef}
            onAddStop={p.onAddStopFromAI}
          />
        </div>
      )}
    </div>
  );
}
