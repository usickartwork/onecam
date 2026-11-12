"use client";

/**
 * Custom-designed vector icons for the DAZZCAM interface (no emojis).
 */

export function RetroCameraIcon({ className = "w-12 h-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="camTopMetal" x1="32" y1="3" x2="32" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECECEE" />
          <stop offset="55%" stopColor="#C4C4C8" />
          <stop offset="100%" stopColor="#8E8E94" />
        </linearGradient>
        <linearGradient id="camBody" x1="32" y1="15" x2="32" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#262629" />
          <stop offset="100%" stopColor="#141416" />
        </linearGradient>
        <linearGradient id="lensBezel" x1="20" y1="17" x2="44" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E4E4E8" />
          <stop offset="50%" stopColor="#8A8A91" />
          <stop offset="100%" stopColor="#D6D6DB" />
        </linearGradient>
        <radialGradient id="lensGlass" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#243040" />
          <stop offset="55%" stopColor="#0E1117" />
          <stop offset="100%" stopColor="#050608" />
        </radialGradient>
      </defs>

      {/* Shutter release button on top-right */}
      <rect x="46" y="4.5" width="7" height="3" rx="1.2" fill="#D4D4D8" />
      <rect x="11" y="5.5" width="5" height="2" rx="0.8" fill="#A1A1AA" />

      {/* Top prism / rangefinder housing */}
      <path
        d="M19 10L23.5 4.5H40.5L45 10H54.5C56.433 10 58 11.567 58 13.5V16H6V13.5C6 11.567 7.567 10 9.5 10H19Z"
        fill="url(#camTopMetal)"
      />

      {/* Main matte charcoal body */}
      <rect
        x="6"
        y="16"
        width="52"
        height="28"
        rx="4"
        fill="url(#camBody)"
        stroke="#3A3A3F"
        strokeWidth="0.8"
      />

      {/* Subtle leatherette grip texture strip */}
      <rect x="6.5" y="17.5" width="51" height="25" rx="3.2" fill="none" stroke="#2D2D32" strokeWidth="0.6" />

      {/* Hot-shoe / prism accent */}
      <rect x="27" y="5.5" width="10" height="2.2" rx="0.8" fill="#4B4B52" />

      {/* Viewfinder window */}
      <rect x="46.5" y="11.2" width="5.5" height="3.6" rx="1" fill="#18181B" stroke="#71717A" strokeWidth="0.5" />

      {/* Signature coral-red front accent button */}
      <circle cx="13.5" cy="23.5" r="3" fill="#E35336" />
      <circle cx="13.5" cy="23.5" r="1.4" fill="#F07D63" opacity="0.55" />

      {/* Small flash/sensor dot */}
      <circle cx="51" cy="22.5" r="1.6" fill="#D4D4D8" />

      {/* Multi-ring Lens Assembly */}
      <circle cx="32" cy="29.5" r="13.2" fill="url(#lensBezel)" />
      <circle cx="32" cy="29.5" r="11.4" fill="#18181B" />
      <circle cx="32" cy="29.5" r="9.6" fill="#27272C" stroke="#52525B" strokeWidth="0.6" />
      <circle cx="32" cy="29.5" r="7.4" fill="url(#lensGlass)" />

      {/* Glass reflections */}
      <ellipse cx="29.5" cy="26.8" rx="2.6" ry="1.4" transform="rotate(-28 29.5 26.8)" fill="#FFFFFF" opacity="0.28" />
      <circle cx="34.6" cy="32" r="1.1" fill="#93C5FD" opacity="0.32" />
    </svg>
  );
}

export function ThermometerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4.5 4.5 0 1 0 4 0z" />
      <circle cx="12" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 10v6" />
    </svg>
  );
}

export function ExposureAIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="3.5" />
      <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.34 5.34l1.42 1.42M15.24 15.24l1.42 1.42M5.34 16.66l1.42-1.42M15.24 6.76l1.42-1.42" />
      <path d="M17.5 20l1.6-4.5L20.7 20M18 18.6h2.2" strokeWidth="1.6" />
    </svg>
  );
}

export function DoubleExposureIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="4" width="11" height="11" rx="3" />
      <path d="M9 15v2a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3v-5a3 3 0 0 0-3-3h-2" />
    </svg>
  );
}
