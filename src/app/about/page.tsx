import Link from "next/link";
import {
  MapPin,
  Code2,
  Layers,
  Cpu,
  ArrowRight,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedHeading from "@/components/AnimatedHeading";
import DeveloperCard from "@/components/DeveloperCard";

const TECH_STACK = [
  { name: "Next.js 16",       desc: "App Router, server & client components",   color: "bg-gray-900 text-white" },
  { name: "Supabase",         desc: "PostgreSQL database + auth",                color: "bg-emerald-600 text-white" },
  { name: "Google Maps API",  desc: "Directions, Places, geocoding",             color: "bg-blue-600 text-white" },
  { name: "Gemini AI",        desc: "AI trip assistant & stop suggestions",      color: "bg-violet-600 text-white" },
  { name: "Resend",           desc: "Transactional email for contact forms",     color: "bg-orange-500 text-white" },
  { name: "Open-Meteo",       desc: "Weather forecasts for trip dates",          color: "bg-cyan-600 text-white" },
  { name: "Tailwind CSS",     desc: "Utility-first styling",                     color: "bg-sky-500 text-white" },
  { name: "TypeScript",       desc: "End-to-end type safety",                    color: "bg-blue-700 text-white" },
  { name: "Vercel",           desc: "Deployment, edge hosting & analytics",      color: "bg-black text-white" },
];

const FEATURES = [
  "Multi-stop route planning with real Google Maps directions",
  "Per-leg route alternatives — compare roads, times, and distances for each segment",
  "AI trip assistant — chat while planning, get real place suggestions, add stops in one tap",
  "Weather forecasts for each stop on your travel date",
  "Toll cost estimates per leg with a running total",
  "Departure time and live arrival time calculation",
  "Dark mode and mi / km distance unit preference",
  "Drag-and-drop stop reordering",
  "Trip sharing with a unique invite link — plan together",
  "Save, edit, and organise trips across devices with a free account",
  "Per-leg trip progress tracking with completion checks",
  "Open any leg or the full route in Google Maps, Apple Maps, or Waze",
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Floating background blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-32 w-96 h-96 rounded-full bg-blue-300 blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-violet-300 blur-3xl opacity-30 animate-blob-2" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-14">
        {/* ─── Hero ─── */}
        <ScrollReveal variant="up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200 mb-5 animate-float">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <AnimatedHeading
              text="About"
              gradientText="Waypoint"
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight"
            />
            <p
              className="text-gray-500 dark:text-gray-400 text-lg animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              A road trip planner built for the open road — with AI, weather, and everything in between.
            </p>
          </div>
        </ScrollReveal>

        {/* ─── Developer card ─── */}
        <ScrollReveal variant="up" delay={120}>
          <DeveloperCard />
        </ScrollReveal>

        {/* ─── Features ─── */}
        <ScrollReveal variant="up" delay={180}>
          <div className="lift bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-blue-600" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                What Waypoint does
              </p>
            </div>
            <ul className="space-y-2.5">
              {FEATURES.map((f, i) => (
                <ScrollReveal
                  key={f}
                  variant="left"
                  delay={i * 70}
                  threshold={0.1}
                >
                  <li className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 shrink-0 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]" />
                    {f}
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        {/* ─── Tech stack ─── */}
        <ScrollReveal variant="up" delay={240}>
          <div className="lift bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-violet-600" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Built with
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TECH_STACK.map((t, i) => (
                <ScrollReveal
                  key={t.name}
                  variant="zoom"
                  delay={i * 60}
                  threshold={0.1}
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:border-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600 transition-colors">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${t.color}`}
                    >
                      {t.name}
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── CTA ─── */}
        <ScrollReveal variant="up" delay={120}>
          <div className="text-center">
            <p className="text-gray-400 dark:text-gray-400 text-sm mb-4">
              Ready to plan your next adventure?
            </p>
            <Link
              href="/planner"
              className="btn-shine btn-tap group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-7 py-3.5 rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all"
            >
              <Code2 className="w-4 h-4" />
              Open the Planner
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
