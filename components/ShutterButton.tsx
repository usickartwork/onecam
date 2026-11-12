"use client";

import { useState } from "react";

interface Props {
  onCapture: () => Promise<void> | void;
  disabled?: boolean;
  screenFlash?: boolean;
}

export function ShutterButton({ onCapture, disabled, screenFlash }: Props) {
  const [flash, setFlash] = useState(false);

  const handleClick = async () => {
    if (disabled) return;
    setFlash(true);
    setTimeout(() => setFlash(false), screenFlash ? 350 : 220);
    await onCapture();
  };

  return (
    <>
      {flash && (
        <div
          className={`fixed inset-0 bg-white pointer-events-none z-50 ${
            screenFlash ? "opacity-95 transition-opacity duration-300" : "shutter-flash"
          }`}
        />
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Take photo"
        className="relative flex items-center justify-center w-[74px] h-[74px] rounded-full border-[3px] border-white/25 bg-black p-[5px] active:scale-95 transition-transform duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="w-full h-full rounded-full bg-white hover:bg-white/95 transition-colors block" />
      </button>
    </>
  );
}
