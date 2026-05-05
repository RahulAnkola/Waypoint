"use client";

import { useState, useEffect } from "react";
import { X, Star, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReviewModal({ open, onClose }: Props) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { setDone(false); setError(""); setStars(0); setHovered(0); setMessage(""); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars) { setError("Please select a rating"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayStars = hovered || stars;
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Leave a Review</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200/40 rounded-full blur-2xl" />
              <CheckCircle2 className="relative w-12 h-12 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Thanks for the review!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Your feedback genuinely helps us build a better Waypoint. We read every single one.
            </p>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-5 h-5 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <button onClick={onClose} className="mt-3 px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How would you rate your experience with Waypoint?</p>
              <div className="flex justify-center gap-2" onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHovered(i)}
                    onClick={() => setStars(i)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors duration-100 ${
                        i <= displayStars ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {displayStars > 0 && (
                <p className="text-sm font-semibold text-amber-500 mt-2 h-5">{LABELS[displayStars]}</p>
              )}
              {!displayStars && <div className="h-5 mt-2" />}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Message <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Tell us what you loved or what we could do better…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || !stars}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-white" />}
              {loading ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
