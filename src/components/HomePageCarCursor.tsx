"use client";

import { useEffect, useRef } from "react";
import CarIcon from "./CarIcon";

/**
 * Wraps a section of the page with:
 *   • a fixed-position car icon that follows the cursor (replaces the
 *     native cursor across the whole wrapped region), and
 *   • the `car-cursor-zone` class which forces `cursor: none` on the
 *     wrapper and all descendants.
 *
 * The car uses `position: fixed`, so it tracks the viewport — meaning
 * scrolling, fixed headers, and large pages all "just work". Mouse
 * tracking is done with refs + direct style writes (no React state on
 * mousemove) so the rendering is buttery even on long pages.
 *
 * The road trail (drawn on a canvas inside <RoadTrail>) is intentionally
 * left scoped to the hero — only the car follows the cursor everywhere.
 */
export default function HomePageCarCursor({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const carRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(0);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const car = carRef.current;
    if (!wrapper || !car) return;

    const setTransform = (x: number, y: number) => {
      // Car SVG points "up" by default; +90° rotates so motion at angle 0
      // (rightward) renders the car pointing right.
      car.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angleRef.current + 90}deg)`;
    };

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      const last = lastRef.current;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          // Smoothed rotation tracking — same low-pass as the road trail
          // used to use, so micro-movements don't make the car jitter.
          const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          const diff = ((targetAngle - angleRef.current + 540) % 360) - 180;
          angleRef.current += diff * 0.35;
        }
      }
      lastRef.current = { x, y };

      setTransform(x, y);
      if (car.style.opacity !== "1") car.style.opacity = "1";
    };

    const onEnter = (e: MouseEvent) => {
      lastRef.current = { x: e.clientX, y: e.clientY };
      setTransform(e.clientX, e.clientY);
      car.style.opacity = "1";
    };

    const onLeave = () => {
      car.style.opacity = "0";
    };

    wrapper.addEventListener("mousemove", onMove);
    wrapper.addEventListener("mouseenter", onEnter);
    wrapper.addEventListener("mouseleave", onLeave);

    return () => {
      wrapper.removeEventListener("mousemove", onMove);
      wrapper.removeEventListener("mouseenter", onEnter);
      wrapper.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="car-cursor-zone">
      <div
        ref={carRef}
        aria-hidden
        className="pointer-events-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          opacity: 0,
          willChange: "transform, opacity",
          transition: "opacity 200ms ease-out",
          zIndex: 60,
        }}
      >
        <CarIcon />
      </div>
      {children}
    </div>
  );
}
