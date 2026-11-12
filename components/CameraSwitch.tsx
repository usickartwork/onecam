"use client";

import { SwitchCamera } from "lucide-react";
import type { CameraFacing } from "@/types";

interface Props {
  facing: CameraFacing;
  onSwitch: () => void;
  disabled?: boolean;
}

export function CameraSwitch({ facing, onSwitch, disabled }: Props) {
  return (
    <button
      onClick={onSwitch}
      disabled={disabled}
      aria-label={`Switch to ${facing === "environment" ? "front" : "rear"} camera`}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <SwitchCamera size={20} className="text-white" />
    </button>
  );
}
