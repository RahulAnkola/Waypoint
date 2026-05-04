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
}

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.5;
const DEFAULT_WIDTH = 340;

export default function AiChat({ tripContext, containerRef, onAddStop }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  // Track which suggestions have been added: key = `msgIdx-sugIdx`
  const [addedStops, setAddedStops] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl text-gray-700 dark:text-gray-200 text-sm font-semibold transition-all hover:border-violet-300 dark:hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-300 active:scale-[0.97]"
      >
        <Sparkles className="w-4 h-4 text-violet-500" />
        Ask AI about your trip
      </button>
    );
  }

  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-10 flex"
      style={{ width: panelWidth }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className={`w-1.5 shrink-0 cursor-col-resize group flex items-center justify-center transition-colors ${isDragging ? "bg-violet-400" : "bg-gray-200 dark:bg-gray-700 hover:bg-violet-300 dark:hover:bg-violet-600"}`}
      >
        <GripVertical className={`w-3 h-3 transition-colors ${isDragging ? "text-white" : "text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-300"}`} />
      </div>

      {/* Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Trip AI</span>
            <span className="text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-semibold px-1.5 py-0.5 rounded-full">Trip-only</span>
          </div>
          <button
            onClick={() => { setOpen(false); setMessages([]); setAddedStops(new Set()); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-8 h-8 text-violet-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Ask anything about your trip</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Food, gas, attractions, rest stops, traffic…</p>
            </div>
          )}

          {messages.map((m, msgIdx) => (
            <div key={msgIdx} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              {/* Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>

              {/* Suggestion cards — shown below AI messages */}
              {m.role === "model" && m.suggestions && m.suggestions.length > 0 && (
                <div className="w-full space-y-2 mt-1">
                  {m.suggestions.map((s, sugIdx) => {
                    const key = `${msgIdx}-${sugIdx}`;
                    const added = addedStops.has(key);
                    return (
                      <div
                        key={sugIdx}
                        className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-sm"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{s.address}</p>
                          </div>
                        </div>
                        {onAddStop && (
                          <button
                            onClick={() => handleAddStop(msgIdx, sugIdx, s)}
                            disabled={added}
                            className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                              added
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 active:scale-95"
                            }`}
                          >
                            {added
                              ? <><Check className="w-3 h-3" /> Added</>
                              : <><PlusCircle className="w-3 h-3" /> Add stop</>
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
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span className="text-xs text-gray-400">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-violet-400 dark:focus-within:border-violet-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your trip…"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
