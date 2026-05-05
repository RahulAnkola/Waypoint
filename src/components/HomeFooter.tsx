"use client";

import { useState } from "react";
import { Mail, Star, MapPin } from "lucide-react";
import ContactModal from "./ContactModal";
import ReviewModal from "./ReviewModal";

export default function HomeFooter() {
  const [contactOpen, setContactOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-950 border-t border-white/5 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold tracking-tight text-white">Waypoint</span>
            <span className="text-white/30 text-xs ml-1">© {new Date().getFullYear()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-sm font-semibold transition-all"
            >
              <Star className="w-4 h-4 text-amber-400" />
              Leave a review
            </button>
            <button
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400/50 hover:text-blue-200 text-sm font-semibold transition-all"
            >
              <Mail className="w-4 h-4" />
              Contact us
            </button>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </>
  );
}
