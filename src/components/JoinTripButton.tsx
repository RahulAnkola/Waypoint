"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, X, Link2 } from "lucide-react";

export default function JoinTripButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position popup relative to button using fixed coords (escapes all stacking contexts)
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: 288,
      zIndex: 9999,
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const popup = document.getElementById("join-trip-popup");
        if (popup && !popup.contains(e.target as Node)) setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleJoin = () => {
    const raw = input.trim();
    if (!raw) return;
    const match = raw.match(/\/trips\/join\/([A-Z0-9]+)/i);
    const code = match ? match[1] : raw.toUpperCase();
    router.push(`/trips/join/${code}`);
    setOpen(false);
    setInput("");
  };

  const popup = open ? (
    <div
      id="join-trip-popup"
      style={popupStyle}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-blue-500" />
          Join with share link
        </p>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-400 mb-3">
        Paste the full share link or just the code from your friend.
      </p>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
        placeholder="https://…/trips/join/ABCD1234"
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-300 mb-3"
      />
      <button
        onClick={handleJoin}
        disabled={!input.trim()}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        Join <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="btn-tap inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-2xl font-semibold text-sm hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm"
      >
        <Users className="w-4 h-4" />
        Join trip
      </button>
      {typeof document !== "undefined" && popup
        ? createPortal(popup, document.body)
        : null}
    </>
  );
}
