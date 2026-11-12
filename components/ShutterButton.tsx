"use client";

import { useRef, useState } from "react";

interface Props {
  onCapture: () => Promise<void>;
  disabled?: boolean;
}

export function ShutterButton({ onCapture, disabled }: Props) {
  const [flash, setFlash] = useState(false);
  const flashRef = useRef<HTMLDivElement>(null);

  const handleClick = async () => {
    if (disabled) return;
    // Trigger flash
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    await onCapture();
  };

  return (
    <>
      {/* Flash overlay */}
      {flash && (
        <div
          ref={flashRef}
          className="fixed inset-0 bg-white pointer-events-none z-50 shutter-flash"
        />
      )}

      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label="Take photo"
        className={`
          relative flex items-center justify-center
          w-20 h-20 rounded-full
          border-4 border-white/80
          bg-white/10
          hover:bg-white/20
          active:scale-95
          transition-all duration-100
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-lg
        `}
      >
        <div className="w-14 h-14 rounded-full bg-white/90 hover:bg-white transition-colors" />
      </button>
    </>
  );
}
