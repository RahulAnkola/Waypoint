"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2, GripVertical } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
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
}

const MIN_WIDTH = 260;
const MAX_WIDTH_RATIO = 0.5;
const DEFAULT_WIDTH = 320;

export default function AiChat({ tripContext, containerRef }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
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
    const maxW = container ? container.getBoundingClientRect().width * MAX_WIDTH_RATIO : 500;
    return Math.max(MIN_WIDTH, Math.min(maxW, w));
  }, [containerRef]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      // Dragging left edge of panel = moving left increases width
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
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, tripContext }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", content: data.reply ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
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
      {/* Drag handle — left edge */}
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
            onClick={() => { setOpen(false); setMessages([]); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-8 h-8 text-violet-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Ask anything about your trip</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Gas stops, food, attractions, traffic tips…</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                }`}
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.+?)\*/g, "<em>$1</em>")
                    .replace(/\n/g, "<br/>"),
                }}
              />
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-violet-400 dark:focus-within:border-violet-500 transition-colors">
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
