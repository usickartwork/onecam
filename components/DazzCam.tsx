"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { CameraView } from "@/components/CameraView";
import { FilterSelector } from "@/components/FilterSelector";
import { FilterIntensity, ImageAdjustments } from "@/components/CameraControls";
import { ShutterButton } from "@/components/ShutterButton";
import { PhotoPreview } from "@/components/PhotoPreview";
import {
  RetroCameraIcon,
  ThermometerIcon,
  ExposureAIcon,
  DoubleExposureIcon,
} from "@/components/RetroCameraIcon";
import { useCamera } from "@/hooks/useCamera";
import { getFilterById } from "@/lib/filters";
import {
  capturePhoto,
  captureRawFrameUrl,
  processImportedPhoto,
} from "@/lib/capture";
import type {
  AppScreen,
  FlashMode,
  ImageAdjustments as IAdjustments,
  TimerSeconds,
  ZoomPreset,
} from "@/types";
import { ImagePlus, Timer, Zap, RefreshCw, X } from "lucide-react";

const ZOOM_PRESETS: ZoomPreset[] = [
  { focal: 26, scale: 1 },
  { focal: 35, scale: 1.35 },
  { focal: 50, scale: 2 },
];

const TIMER_OPTIONS: TimerSeconds[] = [0, 3, 5, 10];
const FLASH_OPTIONS: FlashMode[] = ["off", "auto", "on"];

export default function DazzCam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { state: camState, switchCamera, startCamera, setTorch, ensureActive } =
    useCamera(videoRef);

  // ── Core app state ─────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<AppScreen>("camera");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [lastThumbUrl, setLastThumbUrl] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  // ── Filter & adjustments ───────────────────────────────────────────────────
  const [selectedFilterId, setSelectedFilterId] = useState("original");
  const [filterIntensity, setFilterIntensity] = useState(70);
  const [adjustments, setAdjustments] = useState<IAdjustments>({
    brightness: 100,
    contrast: 100,
  });

  // ── Camera controls matching native camera deck ────────────────────────────
  const [zoomIndex, setZoomIndex] = useState(0);
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [timerSeconds, setTimerSeconds] = useState<TimerSeconds>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [doubleExposure, setDoubleExposure] = useState(false);
  const [firstExposureUrl, setFirstExposureUrl] = useState<string | null>(null);

  // ── Panels & popovers ──────────────────────────────────────────────────────
  const [activePopover, setActivePopover] = useState<"temp" | "exposure" | null>(
    null
  );
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showQuickStrip, setShowQuickStrip] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const currentZoom = ZOOM_PRESETS[zoomIndex];
  const selectedFilter = getFilterById(selectedFilterId);
  const cssFilter = selectedFilter.cssFilter(filterIntensity);
  const liveStyle =
    `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) ${
      cssFilter !== "none" ? cssFilter : ""
    }`.trim();

  // Format EV display (0, +1, -0.5, etc.)
  const evDelta = Math.round(((adjustments.brightness - 100) / 25) * 10) / 10;
  const evLabel = evDelta > 0 ? `+${evDelta}` : `${evDelta}`;

  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Actual capture execution ───────────────────────────────────────────────
  const executeCapture = useCallback(async () => {
    if (!videoRef.current || camState.status !== "active") return;
    setCapturing(true);
    setErrorBanner(null);

    let torchWasEnabled = false;
    try {
      if (flashMode === "on" || flashMode === "auto") {
        torchWasEnabled = await setTorch(true);
        if (torchWasEnabled) {
          await new Promise((r) => setTimeout(r, 140));
        }
      }

      // Double Exposure Shot 1
      if (doubleExposure && !firstExposureUrl) {
        const frameUrl = captureRawFrameUrl(
          videoRef.current,
          currentZoom.scale
        );
        setFirstExposureUrl(frameUrl);
        return;
      }

      const { dataUrl, blob } = await capturePhoto({
        videoEl: videoRef.current,
        filter: selectedFilter,
        filterIntensity,
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
        zoom: currentZoom.scale,
        doubleExposureFirstUrl: doubleExposure ? firstExposureUrl : null,
      });

      setFirstExposureUrl(null);
      setCapturedDataUrl(dataUrl);
      setCapturedBlob(blob);
      setLastThumbUrl(dataUrl);
      setLastBlob(blob);
      setScreen("preview");
    } catch (err) {
      console.error("Capture failed:", err);
      setErrorBanner("Failed to capture photo. Please try again.");
    } finally {
      if (torchWasEnabled) {
        await setTorch(false);
      }
      setCapturing(false);
    }
  }, [
    camState.status,
    flashMode,
    setTorch,
    doubleExposure,
    firstExposureUrl,
    currentZoom.scale,
    selectedFilter,
    filterIntensity,
    adjustments,
  ]);

  // ── Shutter button handler (supports self-timer countdown) ─────────────────
  const handleShutterPress = useCallback(async () => {
    if (camState.status !== "active" || capturing || countdown !== null) return;
    setActivePopover(null);

    if (timerSeconds === 0) {
      await executeCapture();
      return;
    }

    let remaining: number = timerSeconds;
    setCountdown(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(null);
        executeCapture();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [camState.status, capturing, countdown, timerSeconds, executeCapture]);

  // ── Import local photo from gallery ────────────────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      setCapturing(true);
      setErrorBanner(null);
      try {
        const { dataUrl, blob } = await processImportedPhoto(file, {
          filter: selectedFilter,
          filterIntensity,
          brightness: adjustments.brightness,
          contrast: adjustments.contrast,
        });
        setCapturedDataUrl(dataUrl);
        setCapturedBlob(blob);
        setLastThumbUrl(dataUrl);
        setLastBlob(blob);
        setScreen("preview");
      } catch {
        setErrorBanner("Could not process selected image.");
      } finally {
        setCapturing(false);
      }
    },
    [selectedFilter, filterIntensity, adjustments]
  );

  // ── Retake ─────────────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setScreen("camera");
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    void ensureActive();
  }, [ensureActive]);

  // Resume camera stream if returning from background or OS file picker
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && screen === "camera") {
        void ensureActive();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [screen, ensureActive]);

  // ── Re-open last captured photo ────────────────────────────────────────────
  const handleOpenLastPhoto = useCallback(() => {
    if (!lastThumbUrl || !lastBlob) return;
    setCapturedDataUrl(lastThumbUrl);
    setCapturedBlob(lastBlob);
    setScreen("preview");
  }, [lastThumbUrl, lastBlob]);

  // ── Toggle toolbar modes ───────────────────────────────────────────────────
  const cycleZoom = () =>
    setZoomIndex((i) => (i + 1) % ZOOM_PRESETS.length);

  const cycleTimer = () =>
    setTimerSeconds(
      (t) => TIMER_OPTIONS[(TIMER_OPTIONS.indexOf(t) + 1) % TIMER_OPTIONS.length]
    );

  const cycleFlash = () =>
    setFlashMode(
      (f) => FLASH_OPTIONS[(FLASH_OPTIONS.indexOf(f) + 1) % FLASH_OPTIONS.length]
    );

  const toggleDoubleExposure = () => {
    setDoubleExposure((prev) => {
      if (prev) setFirstExposureUrl(null);
      return !prev;
    });
  };

  // ── Camera screen (kept mounted so <video> stream never drops on Retake) ───
  return (
    <div className="camera-screen bg-black flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import photo from device"
      />

      {/* Centered mobile-proportioned camera chassis */}
      <div className="w-full max-w-[480px] mx-auto h-full flex flex-col [@media(orientation:landscape)_and_(max-height:540px)]:max-w-none [@media(orientation:landscape)_and_(max-height:540px)]:flex-row">
        {/* ── Left / Top Column: Top indicator + Viewfinder ── */}
        <div className="flex-1 min-h-0 flex flex-col [@media(orientation:landscape)_and_(max-height:540px)]:h-full [@media(orientation:landscape)_and_(max-height:540px)]:py-2 [@media(orientation:landscape)_and_(max-height:540px)]:pl-safe">
          {/* Minimal top status bar */}
          <div className="flex items-center justify-between px-5 pt-safe pb-2 [@media(orientation:landscape)_and_(max-height:540px)]:hidden">
            <span className="text-[10px] tracking-[0.18em] uppercase text-white/40 font-medium">
              {selectedFilter.id !== "original" ? selectedFilter.name : "DAZZCAM"}
            </span>

            {/* Active camera dot (matches reference screenshot) */}
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                camState.status === "active" ? "bg-emerald-500" : "bg-white/20"
              }`}
              aria-label={
                camState.status === "active" ? "Camera active" : "Camera inactive"
              }
            />

            <span className="text-[10px] tracking-wider text-white/45 font-mono tabular-nums min-w-[44px] text-right">
              {doubleExposure
                ? firstExposureUrl
                  ? "2/2"
                  : "1/2"
                : timerSeconds > 0
                ? `${timerSeconds}s`
                : ""}
            </span>
          </div>

          {/* Rounded vertical viewfinder */}
          <div className="flex-1 min-h-0 px-2.5 sm:px-3">
            <CameraView
              ref={videoRef}
              status={camState.status}
              errorMessage={camState.errorMessage}
              cssFilter={liveStyle}
              zoom={currentZoom.scale}
              doubleExposureFirstUrl={firstExposureUrl}
              countdown={countdown}
              onRetry={() => startCamera(camState.facing)}
            >
              {/* Floating adjustments & 3 pill controls inside viewfinder bottom */}
              {camState.status === "active" && (
                <div className="absolute bottom-3.5 inset-x-0 z-10 flex flex-col items-center gap-2.5 px-3 pointer-events-none">
                  {/* Popover slider for Thermometer (Filter Intensity) or Exposure */}
                  {activePopover === "temp" && (
                    <div className="w-full max-w-[290px] px-4 py-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 pointer-events-auto">
                      <FilterIntensity
                        intensity={filterIntensity}
                        onChange={setFilterIntensity}
                      />
                    </div>
                  )}

                  {activePopover === "exposure" && (
                    <div className="w-full max-w-[290px] px-4 py-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 pointer-events-auto flex flex-col gap-2">
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
                      {(adjustments.brightness !== 100 ||
                        adjustments.contrast !== 100) && (
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustments({ brightness: 100, contrast: 100 })
                          }
                          className="self-end text-[10px] text-[#e8d5b7] hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}

                  {/* 3 Viewfinder Pills: Thermometer | Focal (26) | Exposure (0) */}
                  <div className="flex items-center justify-center gap-2.5 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePopover((p) => (p === "temp" ? null : "temp"))
                      }
                      aria-label="Filter intensity"
                      aria-pressed={activePopover === "temp"}
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        activePopover === "temp"
                          ? "bg-[#e8d5b7] text-black"
                          : "bg-black/55 text-white border border-white/10 hover:bg-black/75"
                      }`}
                    >
                      <ThermometerIcon className="w-[17px] h-[17px]" />
                    </button>

                    <button
                      type="button"
                      onClick={cycleZoom}
                      aria-label={`Focal length ${currentZoom.focal}mm`}
                      className="h-9 min-w-[36px] px-2.5 rounded-full flex items-center justify-center bg-black/55 backdrop-blur-md border border-white/10 text-white text-[13px] font-medium tabular-nums hover:bg-black/75 transition-colors"
                    >
                      {currentZoom.focal}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePopover((p) =>
                          p === "exposure" ? null : "exposure"
                        )
                      }
                      aria-label="Brightness and contrast exposure"
                      aria-pressed={activePopover === "exposure"}
                      className={`h-9 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-md text-[13px] font-medium tabular-nums transition-colors ${
                        activePopover === "exposure"
                          ? "bg-[#e8d5b7] text-black"
                          : "bg-black/55 text-white border border-white/10 hover:bg-black/75"
                      }`}
                    >
                      <ExposureAIcon className="w-[17px] h-[17px]" />
                      <span>{evLabel}</span>
                    </button>
                  </div>
                </div>
              )}
            </CameraView>
          </div>
        </div>

        {/* ── Bottom Control Deck (Right Column on short landscape) ── */}
        <div className="flex-shrink-0 flex flex-col justify-end bg-black pb-safe [@media(orientation:landscape)_and_(max-height:540px)]:w-[240px] [@media(orientation:landscape)_and_(max-height:540px)]:justify-center [@media(orientation:landscape)_and_(max-height:540px)]:pr-safe">
          {/* Error message */}
          {errorBanner && (
            <p className="text-red-400 text-[11px] text-center px-4 pt-1">
              {errorBanner}
            </p>
          )}

          {/* Optional inline quick filter strip toggled by the pill button */}
          {showQuickStrip && (
            <div className="pt-3 pb-1 border-b border-white/5">
              <FilterSelector
                selectedId={selectedFilterId}
                onSelect={setSelectedFilterId}
                videoRef={videoRef}
              />
            </div>
          )}

          {/* 5-Icon Toolbar Row */}
          <div className="flex items-center justify-between px-7 pt-4 pb-3 [@media(orientation:landscape)_and_(max-height:540px)]:px-3 [@media(orientation:landscape)_and_(max-height:540px)]:pt-2">
            {/* 1. Import Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={capturing}
              aria-label="Import photo from device"
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/90 hover:text-white active:scale-95 transition-all disabled:opacity-40"
            >
              <ImagePlus size={22} strokeWidth={1.7} />
            </button>

            {/* 2. Double Exposure */}
            <button
              type="button"
              onClick={toggleDoubleExposure}
              aria-label="Toggle double exposure mode"
              aria-pressed={doubleExposure}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all ${
                doubleExposure
                  ? "text-[#e8d5b7]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              <DoubleExposureIcon className="w-[22px] h-[22px]" />
              {doubleExposure && (
                <span className="absolute -bottom-0.5 text-[9px] font-semibold text-[#e8d5b7]">
                  2x
                </span>
              )}
            </button>

            {/* 3. Self-Timer */}
            <button
              type="button"
              onClick={cycleTimer}
              aria-label={`Self-timer ${timerSeconds === 0 ? "off" : `${timerSeconds} seconds`}`}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all ${
                timerSeconds > 0
                  ? "text-[#e8d5b7]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              <Timer size={22} strokeWidth={1.7} />
              {timerSeconds > 0 && (
                <span className="absolute -bottom-0.5 text-[9px] font-semibold text-[#e8d5b7] tabular-nums">
                  {timerSeconds}s
                </span>
              )}
            </button>

            {/* 4. Flash */}
            <button
              type="button"
              onClick={cycleFlash}
              aria-label={`Flash ${flashMode}`}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all ${
                flashMode === "on"
                  ? "text-[#e8d5b7]"
                  : flashMode === "auto"
                  ? "text-white"
                  : "text-white/85 hover:text-white"
              }`}
            >
              <Zap
                size={21}
                strokeWidth={1.7}
                fill={flashMode === "on" ? "currentColor" : "none"}
              />
              {flashMode === "auto" && (
                <span className="absolute -bottom-0.5 text-[9px] font-semibold text-white/80">
                  A
                </span>
              )}
            </button>

            {/* 5. Switch Camera */}
            <button
              type="button"
              onClick={switchCamera}
              disabled={camState.status !== "active" || capturing}
              aria-label={`Switch to ${
                camState.facing === "environment" ? "front" : "rear"
              } camera`}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/90 hover:text-white active:scale-95 transition-all disabled:opacity-40"
            >
              <RefreshCw size={20} strokeWidth={1.7} />
            </button>
          </div>

          {/* Bottom Shutter + Retro Camera Dock */}
          <div className="grid grid-cols-3 items-center px-7 pt-1 pb-2 [@media(orientation:landscape)_and_(max-height:540px)]:px-4">
            {/* Left: Last photo shortcut (or empty spacer to keep shutter centered) */}
            <div className="flex items-center justify-start">
              {lastThumbUrl && (
                <button
                  type="button"
                  onClick={handleOpenLastPhoto}
                  aria-label="View last captured photo"
                  className="w-11 h-11 rounded-xl overflow-hidden border border-white/25 active:scale-95 transition-transform"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lastThumbUrl}
                    alt="Last captured"
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
            </div>

            {/* Center: Shutter button */}
            <div className="flex items-center justify-center">
              <ShutterButton
                onCapture={handleShutterPress}
                disabled={
                  camState.status !== "active" ||
                  capturing ||
                  countdown !== null
                }
                screenFlash={flashMode === "on" || flashMode === "auto"}
              />
            </div>

            {/* Right: Custom SVG Retro Camera + quick strip pill */}
            <div className="flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilterDrawer(true)}
                aria-label={`Choose camera filter (current: ${selectedFilter.name})`}
                className="active:scale-95 transition-transform focus:outline-none"
              >
                <RetroCameraIcon className="w-[56px] h-[42px]" />
              </button>

              <button
                type="button"
                onClick={() => setShowQuickStrip((s) => !s)}
                aria-label="Toggle quick filter bar"
                aria-pressed={showQuickStrip}
                className={`w-11 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  showQuickStrip
                    ? "bg-white/15 border-[#e8d5b7]/60"
                    : "bg-[#1a1a1c] border-white/10 hover:bg-[#242428]"
                }`}
              >
                <span
                  className={`w-3.5 h-[2px] rounded-full ${
                    showQuickStrip ? "bg-[#e8d5b7]" : "bg-white/60"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Subtle privacy statement */}
          <p className="text-white/25 text-[9px] text-center px-6 pt-1 pb-1 leading-tight">
            Your photos stay on your device. DAZZCAM does not upload or store your photos on our servers.
          </p>
        </div>
      </div>

      {/* ── Filter Preset Drawer (opened by Retro Camera button) ── */}
      {showFilterDrawer && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 backdrop-blur-[2px]"
          onClick={() => setShowFilterDrawer(false)}
        >
          <div
            className="w-full max-w-[480px] bg-[#121214] border-t border-white/10 rounded-t-3xl pt-3 pb-safe px-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
                  Film Filters
                </span>
                <span className="text-xs font-medium text-[#e8d5b7]">
                  {selectedFilter.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                aria-label="Close filter drawer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-1">
              <FilterIntensity
                intensity={filterIntensity}
                onChange={setFilterIntensity}
              />
            </div>

            <FilterSelector
              selectedId={selectedFilterId}
              onSelect={setSelectedFilterId}
              videoRef={videoRef}
            />
          </div>
        </div>
      )}

      {/* ── Photo Preview Overlay ── */}
      {screen === "preview" && capturedDataUrl && capturedBlob && (
        <div className="camera-screen z-50 bg-[#000000]">
          <PhotoPreview
            dataUrl={capturedDataUrl}
            blob={capturedBlob}
            onRetake={handleRetake}
          />
        </div>
      )}
    </div>
  );
}
