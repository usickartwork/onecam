"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraFacing, CameraState } from "@/types";

function getErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "Camera permission was denied. Please allow camera access in your browser settings and reload the page.";
      case "NotFoundError":
        return "No camera was found on this device.";
      case "NotReadableError":
        return "The camera is already in use by another application. Please close it and try again.";
      case "OverconstrainedError":
        return "The requested camera settings are not supported by your device.";
      case "SecurityError":
        return "Camera access is blocked. This app requires HTTPS or localhost.";
      default:
        return `Camera error: ${err.message}`;
    }
  }
  return "An unexpected error occurred while accessing the camera.";
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>({
    status: "idle",
    errorMessage: null,
    facing: "environment",
  });

  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const startCamera = useCallback(
    async (facing: CameraFacing) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState({
          status: "unsupported",
          errorMessage:
            "Your browser does not support camera access. Please use a modern browser such as Chrome, Firefox, or Safari.",
          facing,
        });
        return;
      }

      stopStream();

      setState((s) => ({ ...s, status: "requesting", errorMessage: null, facing }));

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setState({ status: "active", errorMessage: null, facing });
      } catch (err) {
        stopStream();
        const msg = getErrorMessage(err);
        const errName = err instanceof DOMException ? err.name : "";
        const status =
          errName === "NotAllowedError"
            ? "denied"
            : errName === "NotFoundError"
            ? "unavailable"
            : errName === "NotReadableError"
            ? "in-use"
            : "error";

        setState({ status, errorMessage: msg, facing });
      }
    },
    [stopStream, videoRef]
  );

  const switchCamera = useCallback(() => {
    const nextFacing: CameraFacing =
      state.facing === "environment" ? "user" : "environment";
    startCamera(nextFacing);
  }, [state.facing, startCamera]);

  // Start on mount
  useEffect(() => {
    startCamera("environment");
    return () => stopStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, startCamera, switchCamera, stopStream, streamRef };
}
