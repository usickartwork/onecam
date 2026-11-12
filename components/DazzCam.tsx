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
      <div className="fixed inset-0 bg-[#0a0a0a]">
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
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-2 z-10">
        <div className="w-10" /> {/* spacer */}
        <span
          className="text-white font-bold tracking-[0.25em] text-sm uppercase"
          aria-label="DAZZCAM"
        >
          DAZZCAM
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControls((s) => !s)}
            aria-label="Toggle adjustments"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <Settings size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Camera viewfinder ── */}
      <div className="relative flex-1 overflow-hidden">
        <CameraView
          ref={videoRef}
          status={camState.status}
          errorMessage={camState.errorMessage}
          cssFilter={liveStyle}
          onRetry={() => startCamera(camState.facing)}
        />

        {/* Camera switch overlay */}
        {camState.status === "active" && (
          <div className="absolute bottom-4 right-4 z-10">
            <CameraSwitch
              facing={camState.facing}
              onSwitch={switchCamera}
              disabled={camState.status !== "active"}
            />
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex flex-col gap-3 bg-[#0a0a0a] border-t border-white/5 pt-3 pb-safe pb-5">

        {/* Collapsible adjustments */}
        {showControls && (
          <div className="px-5 pb-2 border-b border-white/5">
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
        <div className="px-5">
          <FilterIntensity intensity={filterIntensity} onChange={setFilterIntensity} />
        </div>

        {/* Filter strip */}
        <FilterSelector
          selectedId={selectedFilterId}
          onSelect={setSelectedFilterId}
          videoRef={videoRef}
        />

        {/* Shutter row */}
        <div className="flex items-center justify-center px-4 mt-1">
          <ShutterButton
            onCapture={handleCapture}
            disabled={camState.status !== "active" || capturing}
          />
        </div>

        {/* Privacy statement */}
        <p className="text-white/20 text-[9px] text-center px-6 leading-relaxed">
          Your photos stay on your device. DAZZCAM does not upload or store your photos on our servers.
        </p>
      </div>
    </div>
  );
}
