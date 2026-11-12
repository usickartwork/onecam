"use client";

import { useRef, useState, useCallback } from "react";
import { CameraView } from "@/components/CameraView";
import { CameraSwitch } from "@/components/CameraSwitch";
import { FilterSelector } from "@/components/FilterSelector";
import { FilterIntensity, ImageAdjustments } from "@/components/CameraControls";
import { ShutterButton } from "@/components/ShutterButton";
import { PhotoPreview } from "@/components/PhotoPreview";
import { useCamera } from "@/hooks/useCamera";
import { getFilterById, FILTERS } from "@/lib/filters";
import { capturePhoto } from "@/lib/capture";
import type { AppScreen, ImageAdjustments as IAdjustments } from "@/types";
import { Settings } from "lucide-react";

export default function DazzCam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state: camState, switchCamera, startCamera } = useCamera(videoRef);

  // ── App state ──────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<AppScreen>("camera");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState("original");
  const [filterIntensity, setFilterIntensity] = useState(70);
  const [adjustments, setAdjustments] = useState<IAdjustments>({
    brightness: 100,
    contrast: 100,
  });
  const [showControls, setShowControls] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const selectedFilter = getFilterById(selectedFilterId);
  const cssFilter = selectedFilter.cssFilter(filterIntensity);

  // Apply brightness/contrast to live preview via inline style
  const liveStyle = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) ${cssFilter !== "none" ? cssFilter : ""}`.trim();

  // ── Capture ────────────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || camState.status !== "active") return;
    setCapturing(true);
    try {
      const { dataUrl, blob } = await capturePhoto({
        videoEl: videoRef.current,
        filter: selectedFilter,
        filterIntensity,
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
      });
      setCapturedDataUrl(dataUrl);
      setCapturedBlob(blob);
      setScreen("preview");
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setCapturing(false);
    }
  }, [camState.status, selectedFilter, filterIntensity, adjustments]);

  // ── Retake ─────────────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setScreen("camera");
    setCapturedDataUrl(null);
    setCapturedBlob(null);
  }, []);

  // ── Preview screen ─────────────────────────────────────────────────────────
  if (screen === "preview" && capturedDataUrl && capturedBlob) {
    return (
      <div className="camera-screen bg-[#0a0a0a]">
        <PhotoPreview
          dataUrl={capturedDataUrl}
          blob={capturedBlob}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  // ── Camera screen ──────────────────────────────────────────────────────────
  return (
    <div className="camera-screen">
      {/* ── Fullscreen live camera preview ── */}
      <CameraView
        ref={videoRef}
        status={camState.status}
        errorMessage={camState.errorMessage}
        cssFilter={liveStyle}
        onRetry={() => startCamera(camState.facing)}
      />

      {/* ── Top overlay bar ── */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between pt-safe px-safe pb-6 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none">
        <div className="w-10" /> {/* spacer */}
        <span
          className="text-white font-bold tracking-[0.25em] text-sm uppercase drop-shadow-sm"
          aria-label="DAZZCAM"
        >
          DAZZCAM
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowControls((s) => !s)}
            aria-label="Toggle adjustments"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/35 backdrop-blur-md border border-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <Settings size={18} className="text-white" />
          </button>
        </div>
      </header>

      {/* ── Bottom overlay controls ── */}
      <div className="absolute bottom-0 inset-x-0 z-10 pt-10 pb-safe px-safe bg-gradient-to-t from-black/85 via-black/50 to-transparent pointer-events-none max-h-[85dvh] overflow-y-auto">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2.5 [@media(orientation:landscape)_and_(max-height:540px)]:gap-1.5 pointer-events-auto">
          {/* Collapsible adjustments */}
          {showControls && (
            <div className="px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
              <ImageAdjustments
                brightness={adjustments.brightness}
                contrast={adjustments.contrast}
                onBrightnessChange={(v) =>
                  setAdjustments((a) => ({ ...a, brightness: v }))
                }
                onContrastChange={(v) =>
                  setAdjustments((a) => ({ ...a, contrast: v }))
                }
              />
            </div>
          )}

          {/* Filter intensity */}
          <div className="px-1">
            <FilterIntensity intensity={filterIntensity} onChange={setFilterIntensity} />
          </div>

          {/* Filter strip */}
          <FilterSelector
            selectedId={selectedFilterId}
            onSelect={setSelectedFilterId}
            videoRef={videoRef}
          />

          {/* Shutter row with Camera Switch */}
          <div className="relative flex items-center justify-center mt-0.5">
            <ShutterButton
              onCapture={handleCapture}
              disabled={camState.status !== "active" || capturing}
            />
            {camState.status === "active" && (
              <div className="absolute right-2">
                <CameraSwitch
                  facing={camState.facing}
                  onSwitch={switchCamera}
                  disabled={camState.status !== "active"}
                />
              </div>
            )}
          </div>

          {/* Privacy statement */}
          <p className="text-white/40 text-[9px] text-center px-4 leading-relaxed">
            Your photos stay on your device. DAZZCAM does not upload or store your photos on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
