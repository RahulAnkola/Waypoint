"use client";

import { useState, useEffect, useRef } from "react";
import {
  buildMapsUrl, getMapsPreference, MAPS_APP_OPTIONS,
  type MapsApp, type MapStop,
} from "@/lib/mapsUtils";
import type { MapsPreference } from "@/types";

interface Props {
  /** Ordered list of stops (at least from + to). */
  stops: MapStop[];
  /** Everything rendered inside the button (text, icons, layout). */
  children: React.ReactNode;
  /** Tailwind classes applied to the outer <button>. */
  className?: string;
  /** Inline styles applied to the outer <button>. */
  style?: React.CSSProperties;
  /** Which side the app-picker dropdown opens toward (default: right). */
  pickerAlign?: "left" | "right";
}

/**
 * A button that opens the user's preferred maps app.
 * When the preference is "ask", clicking shows a small picker dropdown
 * instead of opening a URL immediately.
 *
 * Stops click-event propagation so it's safe inside clickable cards.
 */
export default function MapsButton({
  stops,
  children,
  className = "",
  style,
  pickerAlign = "right",
}: Props) {
  const [pref, setPref] = useState<MapsPreference>("google");
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Hydrate preference from localStorage after mount
  useEffect(() => {
    setPref(getMapsPreference());
  }, []);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const openWith = (app: MapsApp) => {
    window.open(buildMapsUrl(app, stops), "_blank", "noopener,noreferrer");
    setPickerOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (pref === "ask") {
      setPickerOpen(o => !o);
    } else {
      openWith(pref as MapsApp);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button type="button" onClick={handleClick} className={className} style={style}>
        {children}
      </button>

      {/* App-picker dropdown — only shown when preference is "ask" */}
      {pickerOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-xl shadow-xl overflow-hidden animate-scale-in
            ${pickerAlign === "left" ? "left-0" : "right-0"}`}
        >
          {MAPS_APP_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => openWith(id)}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200
                hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
