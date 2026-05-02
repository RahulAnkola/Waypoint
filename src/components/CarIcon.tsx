/**
 * Top-down red car, front facing -y (i.e. "up" in the SVG).
 * Render code adds +90° to the motion angle so that a rightward
 * motion (angle 0) rotates this icon to point right. The body is
 * left/right symmetric, so any rotation looks correct — no flipping
 * needed when moving leftward.
 *
 * The viewBox is extended symmetrically (top + bottom) so the
 * headlight beams have room to project ahead of the car without
 * shifting the rotation pivot off the body's centroid.
 */
export default function CarIcon() {
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

      <path d="M 10 5 L -3 -20 L 19 -20 Z" fill="url(#rt-beam)" opacity="0.9" />
      <path d="M 28 5 L 19 -20 L 41 -20 Z" fill="url(#rt-beam)" opacity="0.9" />

      <ellipse cx="19" cy="55" rx="15" ry="2" fill="rgba(0,0,0,0.35)" />

      <rect x="2" y="12" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="32" y="12" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="2" y="38" width="4" height="8" rx="1.5" fill="#0f172a" />
      <rect x="32" y="38" width="4" height="8" rx="1.5" fill="#0f172a" />

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

      <rect x="7" y="5" width="24" height="12" rx="3" fill="#ef4444" opacity="0.85" />

      <path
        d="M9 17 Q19 14 29 17 L27 25 L11 25 Z"
        fill="#1e3a8a"
        opacity="0.85"
      />

      <rect x="9" y="25" width="20" height="11" rx="1.5" fill="#b91c1c" />

      <rect x="11" y="26.5" width="6" height="8" rx="1" fill="#fecaca" opacity="0.25" />

      <path
        d="M11 36 L27 36 L29 43 Q19 41 9 43 Z"
        fill="#1e3a8a"
        opacity="0.7"
      />

      <rect x="7" y="42" width="24" height="9" rx="2.5" fill="#ef4444" opacity="0.85" />

      <circle cx="10" cy="5.5" r="4.5" fill="url(#rt-headlight-glow)" />
      <circle cx="28" cy="5.5" r="4.5" fill="url(#rt-headlight-glow)" />
      <ellipse cx="10" cy="5.5" rx="2.2" ry="1.4" fill="#fffbeb" />
      <ellipse cx="28" cy="5.5" rx="2.2" ry="1.4" fill="#fffbeb" />

      <rect x="8" y="49.5" width="5" height="2" rx="0.6" fill="#7f1d1d" />
      <rect x="25" y="49.5" width="5" height="2" rx="0.6" fill="#7f1d1d" />

      <line x1="19" y1="6" x2="19" y2="50" stroke="#7f1d1d" strokeWidth="0.4" opacity="0.5" />
    </svg>
  );
}
