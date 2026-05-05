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
 * during long continuous motion — instead of clearly receding toward the
 * car cursor.
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

/**
 * Renders a canvas that draws a fading road trail behind the user's
 * cursor while it's inside this container. The car cursor itself is
 * NOT rendered here — it lives at the page level (see
 * <HomePageCarCursor>) so it can follow the cursor across the whole
 * home page while the road remains scoped to this region.
 */
export default function RoadTrail({ children, className = "", style }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

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
    // Re-measure once after the next frame in case the section was still
    // laying out (e.g. fonts loading) when the effect first ran.
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
        const d = Math.hypot(x - last.x, y - last.y);
        if (d < MIN_DIST) return;
      }

      pointsRef.current.push({ x, y, t: now });
      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.splice(0, pointsRef.current.length - MAX_POINTS);
      }
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
        const dark = document.documentElement.classList.contains("dark");
        // Pass 1 — soft outer shadow
        strokeSmoothPath(
          pts,
          now,
          (a) => dark
            ? `rgba(0, 0, 0, ${a * 0.35})`
            : `rgba(31, 26, 23, ${a * 0.18})`,
          34,
        );
        // Pass 2 — road body (ink in light, white in dark)
        strokeSmoothPath(
          pts,
          now,
          (a) => dark
            ? `rgba(255, 255, 255, ${a * 0.85})`
            : `rgba(31, 26, 23, ${a * 0.88})`,
          22,
        );
        // Pass 3 — center line (terracotta/orange in both modes)
        strokeSmoothPath(
          pts,
          now,
          (a) => `rgba(194, 91, 58, ${a * 0.95})`,
          3,
        );
      }

      rafId = requestAnimationFrame(draw);
    };

    container.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`road-trail-zone ${className}`.trim()}
      style={style}
    >
      {/* Road trail canvas — sits above background layers but below text. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {children}
    </div>
  );
}
