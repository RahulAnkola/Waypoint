"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  t: number;
}

/**
 * Total lifetime of a segment, in ms. Bigger = longer visible road.
 * The trail has a "solid" part (HOLD_FRACTION of life) and a "fading" part
 * (the remainder). With a big HOLD_FRACTION the fade band at the tail is
 * tiny, so the back-of-road position appears almost stationary — even
 * during long continuous motion — instead of clearly receding toward the car.
 */
const TRAIL_DURATION_MS = 3000;
const HOLD_FRACTION = 0.88;
const MIN_DIST = 2.5;
const MAX_POINTS = 800;

/** Per-segment opacity given its age in ms. Holds at 1, then fades linearly. */
function ageAlpha(ageMs: number): number {
  const n = ageMs / TRAIL_DURATION_MS;
  if (n <= HOLD_FRACTION) return 1;
  if (n >= 1) return 0;
  return 1 - (n - HOLD_FRACTION) / (1 - HOLD_FRACTION);
}

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/* ───────── helpers ───────── */
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const mid = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  t: (a.t + b.t) / 2,
});

export default function RoadTrail({ children, className = "", style }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const carRef = useRef<HTMLDivElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const angleRef = useRef(0);
  const insideRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const car = carRef.current;
    if (!container || !canvas || !car) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    // Car SVG is drawn facing "up" (toward -y); +90° offset so motion
    // angle 0 (rightward) renders the car pointing right. The top-down
    // body is left/right symmetric, so any rotation looks correct — no
    // horizontal flipping needed.
    const setCarTransform = (x: number, y: number) => {
      car.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angleRef.current + 90}deg)`;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    // Re-measure once after the next frame in case the section was still laying
    // out (e.g. fonts loading) when the effect first ran.
    requestAnimationFrame(resize);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      const last = pointsRef.current[pointsRef.current.length - 1];
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const d = Math.hypot(dx, dy);
        if (d < MIN_DIST) return;
        // Smooth the rotation a touch so the car doesn't jitter on micro moves.
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const diff = ((targetAngle - angleRef.current + 540) % 360) - 180;
        angleRef.current += diff * 0.35;
      }

      pointsRef.current.push({ x, y, t: now });
      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.splice(0, pointsRef.current.length - MAX_POINTS);
      }

      setCarTransform(x, y);
      if (!insideRef.current) {
        insideRef.current = true;
        car.style.opacity = "1";
      }
    };

    const onEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCarTransform(x, y);
      car.style.opacity = "1";
      insideRef.current = true;
    };

    const onLeave = () => {
      insideRef.current = false;
      car.style.opacity = "0";
    };

    /* ───────── render ───────── */

    /**
     * Stroke a smooth path through `pts`, with each segment getting its own
     * alpha based on the age of its midpoint timestamp. We track a cumulative
     * arc length and feed it into `lineDashOffset` before each stroke so the
     * dash pattern flows continuously across segments (otherwise every tiny
     * segment would restart the dash, producing a solid line at slow speeds).
     */
    const strokeSmoothPath = (
      pts: Point[],
      now: number,
      colorAtAlpha: (a: number) => string,
      lineWidth: number,
      opts: { dash?: number[]; cap?: CanvasLineCap } = {},
    ) => {
      if (pts.length < 2) return;

      ctx.lineWidth = lineWidth;
      ctx.lineCap = opts.cap ?? "round";
      ctx.lineJoin = "round";
      if (opts.dash) ctx.setLineDash(opts.dash);
      else ctx.setLineDash([]);

      let cum = 0;

      const strokeSegment = (segT: number, drawer: () => void) => {
        const a = ageAlpha(now - segT);
        if (a <= 0.01) return;
        ctx.strokeStyle = colorAtAlpha(a);
        if (opts.dash) ctx.lineDashOffset = -cum;
        ctx.beginPath();
        drawer();
        ctx.stroke();
      };

      if (pts.length === 2) {
        const [a, b] = pts;
        strokeSegment((a.t + b.t) / 2, () => {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        });
        return;
      }

      // First segment: pts[0] → midpoint(pts[0], pts[1])
      const m01 = mid(pts[0], pts[1]);
      strokeSegment((pts[0].t + m01.t) / 2, () => {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(m01.x, m01.y);
      });
      cum += dist(pts[0], m01);

      // Middle segments — quadratic curves through midpoints with the
      // original points as control handles. C1-continuous and smooth.
      for (let i = 1; i < pts.length - 1; i++) {
        const from = mid(pts[i - 1], pts[i]);
        const to = mid(pts[i], pts[i + 1]);
        strokeSegment(pts[i].t, () => {
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, to.x, to.y);
        });
        const polyLen = dist(from, pts[i]) + dist(pts[i], to);
        const chord = dist(from, to);
        cum += (polyLen + chord) / 2;
      }

      // Last segment: midpoint(pts[-2], pts[-1]) → pts[-1]
      const last = pts[pts.length - 1];
      const beforeLast = pts[pts.length - 2];
      const mLast = mid(beforeLast, last);
      strokeSegment((mLast.t + last.t) / 2, () => {
        ctx.moveTo(mLast.x, mLast.y);
        ctx.lineTo(last.x, last.y);
      });
      cum += dist(mLast, last);
    };

    const draw = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const now = performance.now();
      const pts = pointsRef.current;

      // Drop points whose entire fade window has elapsed.
      let firstAlive = 0;
      while (
        firstAlive < pts.length &&
        now - pts[firstAlive].t > TRAIL_DURATION_MS
      ) {
        firstAlive++;
      }
      if (firstAlive > 0) pts.splice(0, firstAlive);

      if (pts.length >= 2) {
        // Pass 1 — soft outer glow under the asphalt
        strokeSmoothPath(
          pts,
          now,
          (a) => `rgba(0, 0, 0, ${a * 0.25})`,
          34,
        );
        // Pass 2 — asphalt body
        strokeSmoothPath(
          pts,
          now,
          (a) => `rgba(15, 23, 42, ${a * 0.95})`,
          22,
        );
        // Pass 3 — solid yellow center line
        strokeSmoothPath(
          pts,
          now,
          (a) => `rgba(250, 204, 21, ${a})`,
          3,
        );
      }

      rafId = requestAnimationFrame(draw);
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`road-trail-zone ${className}`.trim()}
      style={style}
    >
      {/* Road trail canvas — sits above bg layers but below text. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {/* The car cursor — sits above the hero content (buttons, headline)
          so it visually drives over them. It's pointer-events-none, so it
          never intercepts clicks. */}
      <div
        ref={carRef}
        aria-hidden
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          opacity: 0,
          willChange: "transform, opacity",
          transition: "opacity 200ms ease-out",
          zIndex: 50,
        }}
      >
        <CarIcon />
      </div>

      {children}
    </div>
  );
}

function CarIcon() {
  /*
   * Top-down red car, front facing -y (i.e. "up" in the SVG).
   * The render code adds +90° to the motion angle so that a rightward
   * motion (angle 0) rotates this icon to point right. Because the body
   * is left/right symmetric, any rotation looks correct — no horizontal
   * flipping needed when moving leftward.
   *
   * The viewBox is extended upward (y < 0) and symmetrically downward
   * so the headlight beams have room to project ahead of the car
   * without shifting the rotation pivot off the body's centroid.
   */
  return (
    <svg
      width="62"
      height="102"
      viewBox="-12 -22 62 102"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.4))" }}
    >
      <defs>
        <linearGradient id="rt-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" stopOpacity="0" />
          <stop offset="55%" stopColor="#fef9c3" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fffbeb" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="rt-headlight-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#fef9c3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Headlight beams — drawn first so the car body sits on top of
          their roots. They fan forward from each headlight. */}
      <path d="M 10 5 L -3 -20 L 19 -20 Z" fill="url(#rt-beam)" opacity="0.9" />
      <path d="M 28 5 L 19 -20 L 41 -20 Z" fill="url(#rt-beam)" opacity="0.9" />

      <ellipse cx="19" cy="55" rx="15" ry="2" fill="rgba(0,0,0,0.35)" />

      {/* wheels (peeking out from under the body) */}
      <rect x="2" y="12" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="32" y="12" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="2" y="38" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="32" y="38" width="4" height="8" rx="1.5" fill="#0f172a" />

      {/* main body */}
      <rect
        x="5"
        y="3"
        width="28"
        height="50"
        rx="6"
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth="0.8"
      />

      {/* hood highlight */}
      <rect x="7" y="5" width="24" height="12" rx="3" fill="#ef4444" opacity="0.85" />

      {/* front windshield */}
      <path
        d="M9 17 Q19 14 29 17 L27 25 L11 25 Z"
        fill="#1e3a8a"
        opacity="0.85"
      />

      {/* cabin / roof */}
      <rect x="9" y="25" width="20" height="11" rx="1.5" fill="#b91c1c" />

      {/* roof shine */}
      <rect x="11" y="26.5" width="6" height="8" rx="1" fill="#fecaca" opacity="0.25" />

      {/* rear windshield */}
      <path
        d="M11 36 L27 36 L29 43 Q19 41 9 43 Z"
        fill="#1e3a8a"
        opacity="0.7"
      />

      {/* trunk */}
      <rect x="7" y="42" width="24" height="9" rx="2.5" fill="#ef4444" opacity="0.85" />

      {/* Headlights — soft glow halo + bright bulb core, drawn last so
          they sit on top of the hood. */}
      <circle cx="10" cy="5.5" r="4.5" fill="url(#rt-headlight-glow)" />
      <circle cx="28" cy="5.5" r="4.5" fill="url(#rt-headlight-glow)" />
      <ellipse cx="10" cy="5.5" rx="2.2" ry="1.4" fill="#fffbeb" />
      <ellipse cx="28" cy="5.5" rx="2.2" ry="1.4" fill="#fffbeb" />

      {/* tail lights (back) */}
      <rect x="8" y="49.5" width="5" height="2" rx="0.6" fill="#7f1d1d" />
      <rect x="25" y="49.5" width="5" height="2" rx="0.6" fill="#7f1d1d" />

      {/* center body line */}
      <line x1="19" y1="6" x2="19" y2="50" stroke="#7f1d1d" strokeWidth="0.4" opacity="0.5" />
    </svg>
  );
}
