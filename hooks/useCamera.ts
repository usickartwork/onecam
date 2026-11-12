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
  const facingRef = useRef<CameraFacing>("environment");

  useEffect(() => {
    facingRef.current = state.facing;
  }, [state.facing]);

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
        // Use flexible constraints so the browser selects the best native
        // resolution and orientation without forcing a square/fixed aspect ratio.
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
          },
          audio: false,
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (primaryErr) {
          if (
            primaryErr instanceof DOMException &&
            primaryErr.name === "OverconstrainedError"
          ) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facing } },
              audio: false,
            });
          } else {
            throw primaryErr;
          }
        }
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

  const setTorch = useCallback(async (enabled: boolean): Promise<boolean> => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return false;
    try {
      const caps = track.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      if (!caps?.torch) return false;
      await track.applyConstraints({
        advanced: [{ torch: enabled } as MediaTrackConstraintSet],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const ensureActive = useCallback(async () => {
    const stream = streamRef.current;
    const hasLiveTrack =
      stream !== null &&
      stream.getVideoTracks().some((t) => t.readyState === "live");

    if (hasLiveTrack && videoRef.current) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      if (videoRef.current.paused) {
        await videoRef.current.play().catch(() => {});
      }
      return;
    }

    // Stream ended while backgrounded/in picker; re-initialize current camera
    await startCamera(facingRef.current);
  }, [startCamera, videoRef]);

  // Start on mount
  useEffect(() => {
    startCamera("environment");
    return () => stopStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    startCamera,
    switchCamera,
    stopStream,
    setTorch,
    ensureActive,
    streamRef,
  };
}
