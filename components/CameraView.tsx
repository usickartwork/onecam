"use client";

import React, { useRef, useEffect, forwardRef } from "react";
import type { CameraStatus } from "@/types";
import { Camera, CameraOff, Loader2, ShieldAlert } from "lucide-react";

interface Props {
  status: CameraStatus;
  errorMessage: string | null;
  cssFilter: string;
  onRetry: () => void;
}

export const CameraView = forwardRef<HTMLVideoElement, Props>(
  ({ status, errorMessage, cssFilter, onRetry }, ref) => {
    return (
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
        {/* Live video — edge-to-edge cover without distortion */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="camera-preview"
          style={{
            filter: cssFilter,
            display: status === "active" ? "block" : "none",
          }}
        />

        {/* Overlay states */}
        {status !== "active" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8 text-center bg-black/90">
            {status === "requesting" || status === "idle" ? (
              <>
                <Loader2 size={40} className="text-white/60 animate-spin" />
                <p className="text-white/60 text-sm">Starting camera…</p>
              </>
            ) : status === "denied" ? (
              <>
                <ShieldAlert size={40} className="text-amber-400" />
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
                <CameraOff size={40} className="text-red-400" />
                <p className="text-white font-medium">Camera Not Supported</p>
                <p className="text-white/60 text-sm">{errorMessage}</p>
              </>
            ) : (
              <>
                <Camera size={40} className="text-white/60" />
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

        {/* Viewfinder corners */}
        {status === "active" && (
          <>
            <div className="absolute top-16 left-4 w-6 h-6 border-t-2 border-l-2 border-white/25 rounded-tl pointer-events-none" />
            <div className="absolute top-16 right-4 w-6 h-6 border-t-2 border-r-2 border-white/25 rounded-tr pointer-events-none" />
          </>
        )}
      </div>
    );
  }
);

CameraView.displayName = "CameraView";
