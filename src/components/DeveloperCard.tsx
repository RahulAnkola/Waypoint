"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ContactModal from "./ContactModal";

export default function DeveloperCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lift bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md mb-8">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-4">
          About the Developer
        </p>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-14 h-14 shrink-0">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 blur-md opacity-60 animate-pulse-glow" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              R
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rahul Ankola</h2>
            <p className="text-sm text-gray-500">Full-stack developer &amp; road trip enthusiast</p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
          Waypoint started as a personal project to scratch my own itch — I
          kept bouncing between Google Maps tabs while planning multi-stop
          road trips and wanted one clean place to plan, compare routes, and
          track progress on the road.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="btn-tap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 transition-all"
        >
          <Mail className="w-3.5 h-3.5" />
          Leave a message
        </button>
      </div>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
