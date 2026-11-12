"use client";

import React, { forwardRef } from "react";
import type { CameraStatus } from "@/types";
import { Camera, CameraOff, Loader2, ShieldAlert } from "lucide-react";

interface Props {
  status: CameraStatus;
  errorMessage: string | null;
  cssFilter: string;
  zoom?: number;
  doubleExposureFirstUrl?: string | null;
  countdown?: number | null;
  onRetry: () => void;
  children?: React.ReactNode;
}

export const CameraView = forwardRef<HTMLVideoElement, Props>(
  (
    {
      status,
      errorMessage,
      cssFilter,
      zoom = 1,
      doubleExposureFirstUrl = null,
      countdown = null,
      onRetry,
      children,
    },
    ref
  ) => {
    return (
      <div className="relative w-full h-full bg-[#090909] rounded-[22px] overflow-hidden">
        {/* Live video — edge-to-edge cover inside vertical rounded viewfinder */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="camera-preview transition-transform duration-200 ease-out"
          style={{
            filter: cssFilter,
            display: status === "active" ? "block" : "none",
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: "center center",
          }}
        />

        {/* Double-exposure Shot 1 ghost guide */}
        {status === "active" && doubleExposureFirstUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doubleExposureFirstUrl}
            alt="First exposure preview"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-45 pointer-events-none"
          />
        )}

        {/* Self-timer countdown */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 pointer-events-none">
            <span className="text-7xl font-light text-white tracking-tight drop-shadow-lg tabular-nums">
              {countdown}
            </span>
          </div>
        )}

        {/* Overlay states when camera is not active */}
        {status !== "active" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8 text-center bg-black/90">
            {status === "requesting" || status === "idle" ? (
              <>
                <Loader2 size={36} className="text-white/60 animate-spin" />
                <p className="text-white/60 text-sm">Starting camera…</p>
              </>
            ) : status === "denied" ? (
              <>
                <ShieldAlert size={36} className="text-amber-400" />
                <p className="text-white font-medium">Camera Access Denied</p>
                <p className="text-white/60 text-sm">{errorMessage}</p>
                <button
                  onClick={onRetry}
                  className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Try Again
                </button>
              </>
            ) : status === "unsupported" ? (
              <>
                <CameraOff size={36} className="text-red-400" />
                <p className="text-white font-medium">Camera Not Supported</p>
                <p className="text-white/60 text-sm">{errorMessage}</p>
              </>
            ) : (
              <>
                <Camera size={36} className="text-white/60" />
                <p className="text-white font-medium">Camera Unavailable</p>
                <p className="text-white/60 text-sm max-w-xs">
                  {errorMessage ?? "Unable to access the camera."}
                </p>
                <button
                  onClick={onRetry}
                  className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        {/* Floating viewfinder pills / controls */}
        {children}
      </div>
    );
  }
);

CameraView.displayName = "CameraView";
