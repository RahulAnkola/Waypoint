import Link from "next/link";
import {
  MapPin,
  Route,
  BookMarked,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Compass,
  Navigation,
  Search,
  CheckCircle2,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedHeading from "@/components/AnimatedHeading";
import RoadTrail from "@/components/RoadTrail";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="overflow-x-hidden">
      {/* ───────── Hero ───────── */}
      <RoadTrail
        className="relative overflow-hidden text-white"
        style={{
          isolation: "isolate",
          backgroundColor: "#0f172a",
        }}
      >
        {/* Solid gradient base — inline style guarantees it always renders */}
        <div
          aria-hidden
          className="absolute"
          style={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background:
              "linear-gradient(135deg, #1e3a8a 0%, #312e81 45%, #0f172a 100%)",
          }}
        />

        {/* Drifting blobs */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-cyan-400 mix-blend-screen blur-3xl opacity-50 animate-blob" />
          <div className="absolute top-10 -right-32 w-[32rem] h-[32rem] rounded-full bg-violet-500 mix-blend-screen blur-3xl opacity-50 animate-blob-2" />
          <div className="absolute bottom-0 left-1/3 w-[26rem] h-[26rem] rounded-full bg-pink-500 mix-blend-screen blur-3xl opacity-40 animate-blob-3" />
        </div>

        {/* Subtle dotted overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10] text-white dot-grid-bg pointer-events-none"
        />

        <div
          className="relative max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center"
          style={{ zIndex: 10 }}
        >
          {/* Status pill */}
          <div
            className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-white/90">Free · No credit card</span>
          </div>

          {/* Floating logo */}
          <div className="flex justify-center mb-7">
            <div className="relative inline-flex items-center justify-center animate-float">
              <span className="absolute inset-0 rounded-3xl bg-white/30 blur-2xl animate-pulse-glow" />
              <span className="relative grid place-items-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                <MapPin className="w-10 h-10 text-white drop-shadow" />
              </span>
            </div>
          </div>

          {/* Headline */}
          <AnimatedHeading
            text="Plan your perfect"
            gradientText="road trip."
            className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          />

          <p
            className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "560ms" }}
          >
            Build multi-stop routes, compare alternatives for every leg, and hit
            the open road — powered by Google Maps, free for everyone.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 justify-center mt-10 animate-fade-in"
            style={{ animationDelay: "720ms" }}
          >
            <Link
              href="/planner"
              className="btn-shine btn-tap group inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-950/30 hover:shadow-2xl hover:shadow-blue-950/40 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              Start Planning
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            {isLoggedIn ? (
              <Link
                href="/trips"
                className="btn-tap inline-flex items-center justify-center gap-2 border-2 border-white/30 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/60 transition-all"
              >
                <BookMarked className="w-5 h-5" />
                My Trips
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="btn-tap inline-flex items-center justify-center gap-2 border-2 border-white/30 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/60 transition-all"
              >
                Sign up Free
              </Link>
            )}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            zIndex: 6,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
          }}
        />
      </RoadTrail>

      {/* ───────── Stats / trust strip ───────── */}
      <section className="relative bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <ScrollReveal variant="up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
              <Stat label="ads" value="Zero" />
              <Stat label="Stops per trip" value="Unlimited" />
              <Stat label="Setup time" value="< 60s" />
              <Stat label="Cost" value="Free" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-white to-gray-50 mesh-bg">
        <div className="relative max-w-6xl mx-auto">
          <ScrollReveal variant="up">
            <div className="text-center mb-14">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 mb-3">
                Features
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                Everything you need
                <br />
                <span className="text-gradient-animated">
                  for the perfect trip
                </span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-5">
                Designed to feel as smooth as the road ahead — no clutter, no
                friction, just the stuff that helps you actually leave.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} variant="up" delay={i * 120}>
                <FeatureCard {...f} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section
        className="relative overflow-hidden py-24 px-4 text-white"
        style={{
          isolation: "isolate",
          backgroundColor: "#0f172a",
          backgroundImage:
            "linear-gradient(180deg, #0f172a 0%, #111827 50%, #0f172a 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] dot-grid-bg text-white pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-blue-600 blur-3xl opacity-20"
        />

        <div className="relative max-w-5xl mx-auto">
          <ScrollReveal variant="up">
            <div className="text-center mb-16">
              <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400 mb-3">
                How it works
              </span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                Three steps to{" "}
                <span className="text-gradient-animated">the open road</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Decorative dotted connector */}
            <div
              aria-hidden
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px border-t-2 border-dashed border-white/10"
            />
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.title} variant="up" delay={i * 150}>
                <StepCard step={i + 1} {...s} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative py-24 px-4 bg-white">
        <ScrollReveal variant="zoom">
          <div
            className="relative max-w-4xl mx-auto overflow-hidden rounded-[2rem] p-12 sm:p-16 text-white text-center shadow-2xl shadow-blue-200"
            style={{
              isolation: "isolate",
              backgroundColor: "#2563eb",
              backgroundImage:
                "linear-gradient(135deg, #2563eb 0%, #4338ca 50%, #6d28d9 100%)",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.12] dot-grid-bg text-white pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-pink-400 blur-3xl opacity-40 animate-blob-2"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-400 blur-3xl opacity-40 animate-blob"
            />

            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
                Ready to hit the road?
              </h2>
              <p className="text-blue-100 text-lg max-w-md mx-auto mb-8">
                No account needed to start planning. Sign up to save your trips
                across devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/planner"
                  className="btn-shine btn-tap group inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold text-lg hover:-translate-y-0.5 transition-all shadow-xl"
                >
                  <Compass className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
                  Open the Planner
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                {isLoggedIn ? (
                  <Link
                    href="/trips"
                    className="btn-tap inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
                  >
                    <BookMarked className="w-5 h-5" />
                    My Trips
                  </Link>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="btn-tap inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
                  >
                    Create account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

/* ─────────── components ─────────── */

const FEATURES = [
  {
    icon: Route,
    title: "Smart Routing",
    description:
      "Add origin, destination, and stops along the way. See real driving directions instantly with multiple alternatives per leg.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookMarked,
    title: "Save Your Trips",
    description:
      "Create an account and save all your road trip plans. Pick up exactly where you left off, on any device.",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: ExternalLink,
    title: "Open in Google Maps",
    description:
      "One click to launch your route in Google Maps for turn-by-turn navigation when it's go time.",
    gradient: "from-pink-500 to-orange-500",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Add your stops",
    description:
      "Type in a starting point, your destination, and any places you want to hit in between.",
  },
  {
    icon: Route,
    title: "Compare routes",
    description:
      "See alternative routes per leg with timing, distance, and roads — pick the best one.",
  },
  {
    icon: Navigation,
    title: "Hit the road",
    description:
      "Open your full route in Google Maps and track progress leg-by-leg as you drive.",
  },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">
        {label}
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group lift relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 hover:border-transparent hover:shadow-xl hover:shadow-blue-100/50 transition-all">
      {/* Hover gradient border */}
      <div
        aria-hidden
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
      />

      <div
        className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-gray-200 mb-5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
      >
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>

      <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Learn more
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="relative grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-900/50">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-5xl font-black text-white/10 leading-none">
          0{step}
        </span>
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Takes seconds
      </div>
    </div>
  );
}
