"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2, GripVertical, MapPin, PlusCircle, Check } from "lucide-react";

interface Suggestion {
  name: string;
  address: string;
}

interface AiMessage {
  role: "user" | "model";
  content: string;
  suggestions?: Suggestion[];
}

interface TripContext {
  tripName?: string;
  origin?: string;
  destination?: string;
  stops?: string[];
  departureTime?: string;
  departureDate?: string;
  totalDuration?: string;
  totalDistance?: string;
  legs?: { from: string; to: string; duration: string; distance: string; route: string }[];
}

interface Props {
  tripContext: TripContext;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAddStop?: (name: string, address: string) => void;
  standalone?: boolean;
}

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.5;
const DEFAULT_WIDTH = 340;

export default function AiChat({ tripContext, containerRef, onAddStop, standalone = false }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [addedStops, setAddedStops] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    if (open || standalone) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, standalone]);

  useEffect(() => {
    if (open || standalone) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, standalone]);

  const clampWidth = useCallback((w: number) => {
    const container = containerRef.current;
    const maxW = container ? container.getBoundingClientRect().width * MAX_WIDTH_RATIO : 600;
    return Math.max(MIN_WIDTH, Math.min(maxW, w));
  }, [containerRef]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      setPanelWidth(clampWidth(dragStartWidth.current + delta));
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, clampWidth]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    setIsDragging(true);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: AiMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          tripContext,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "model",
        content: data.reply ?? "Sorry, something went wrong.",
        suggestions: data.suggestions ?? [],
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleAddStop = (msgIdx: number, sugIdx: number, suggestion: Suggestion) => {
    const key = `${msgIdx}-${sugIdx}`;
    if (addedStops.has(key)) return;
    setAddedStops(prev => new Set(prev).add(key));
    onAddStop?.(suggestion.name, suggestion.address);
  };

  /* ── Closed state (overlay mode only) ── */
  if (!standalone && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 999,
          background: "var(--alm-cream)",
          border: "2px solid var(--alm-ink)",
          boxShadow: "3px 3px 0 var(--alm-red)",
          color: "var(--alm-ink)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.14em",
          fontWeight: 700,
          textTransform: "uppercase",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Sparkles style={{ width: 13, height: 13, color: "var(--alm-red)", flexShrink: 0 }} />
        Ask AI about your trip
      </button>
    );
  }

  /* ── Panel content (shared between overlay and standalone) ── */
  const panelContent = (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--alm-bg)",
      borderLeft: standalone ? "none" : "2px solid var(--alm-rule)",
      minWidth: 0,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "2px solid var(--alm-rule)",
        background: "var(--alm-cream)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 13, height: 13, color: "var(--alm-red)" }} />
          <span style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--alm-ink)",
          }}>
            Trip AI
          </span>
          <span style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "rgba(194,91,58,0.1)",
            color: "var(--alm-red)",
            border: "1.5px solid var(--alm-red)",
            borderRadius: 3,
            padding: "2px 6px",
          }}>
            Trip-only
          </span>
        </div>
        {!standalone && (
          <button
            onClick={() => { setOpen(false); setMessages([]); setAddedStops(new Set()); }}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--alm-ink2)", display: "flex", padding: 4 }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            textAlign: "center",
            padding: 32,
          }}>
            <Sparkles style={{ width: 28, height: 28, color: "var(--alm-red)", marginBottom: 12, opacity: 0.45 }} />
            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, letterSpacing: "0.1em", color: "var(--alm-ink)", fontWeight: 700, marginBottom: 6 }}>
              Ask anything about your trip
            </p>
            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)", lineHeight: 1.6 }}>
              Food, gas, attractions,<br />rest stops, traffic…
            </p>
          </div>
        )}

        {messages.map((m, msgIdx) => (
          <div key={msgIdx} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "88%",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              borderRadius: 4,
              ...(m.role === "user" ? {
                background: "var(--alm-ink)",
                color: "var(--alm-cream)",
                border: "2px solid var(--alm-ink)",
                boxShadow: "2px 2px 0 var(--alm-red)",
              } : {
                background: "var(--alm-cream)",
                color: "var(--alm-ink)",
                border: "2px solid var(--alm-rule)",
              }),
            }}>
              {m.content}
            </div>

            {m.role === "model" && m.suggestions && m.suggestions.length > 0 && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {m.suggestions.map((s, sugIdx) => {
                  const key = `${msgIdx}-${sugIdx}`;
                  const added = addedStops.has(key);
                  return (
                    <div key={sugIdx} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      background: "var(--alm-cream)",
                      border: "2px solid var(--alm-rule)",
                      borderRadius: 4,
                      padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
                        <MapPin style={{ width: 12, height: 12, color: "var(--alm-red)", flexShrink: 0, marginTop: 2 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--alm-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: "var(--alm-ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address}</p>
                        </div>
                      </div>
                      {onAddStop && (
                        <button
                          onClick={() => handleAddStop(msgIdx, sugIdx, s)}
                          disabled={added}
                          style={{
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            padding: "5px 10px",
                            borderRadius: 3,
                            cursor: added ? "default" : "pointer",
                            border: `1.5px solid ${added ? "var(--alm-green)" : "var(--alm-red)"}`,
                            color: added ? "var(--alm-green)" : "var(--alm-red)",
                            background: "transparent",
                          }}
                        >
                          {added
                            ? <><Check style={{ width: 10, height: 10 }} /> Added</>
                            : <><PlusCircle style={{ width: 10, height: 10 }} /> Add</>
                          }
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              background: "var(--alm-cream)",
              border: "2px solid var(--alm-rule)",
              borderRadius: 4,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Loader2 style={{ width: 12, height: 12, color: "var(--alm-red)" }} className="animate-spin" />
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--alm-ink2)" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "2px solid var(--alm-rule)",
        background: "var(--alm-cream)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "2px solid var(--alm-rule)",
          borderRadius: 4,
          padding: "8px 12px",
          background: "var(--alm-bg)",
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your trip…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "var(--alm-ink)",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
              color: input.trim() && !loading ? "var(--alm-red)" : "var(--alm-rule)",
              padding: 4,
            }}
          >
            <Send style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Standalone (mobile tab) ── */
  if (standalone) {
    return (
      <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
        {panelContent}
      </div>
    );
  }

  /* ── Overlay panel (desktop) ── */
  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-10 flex"
      style={{ width: panelWidth }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        style={{
          width: 6,
          flexShrink: 0,
          cursor: "col-resize",
          background: isDragging ? "var(--alm-red)" : "var(--alm-rule)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => { if (!isDragging) (e.currentTarget as HTMLDivElement).style.background = "rgba(194,91,58,0.35)"; }}
        onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLDivElement).style.background = "var(--alm-rule)"; }}
      >
        <GripVertical style={{ width: 12, height: 12, color: isDragging ? "var(--alm-cream)" : "var(--alm-ink2)" }} />
      </div>
      {panelContent}
    </div>
  );
}
