// ─── Filter definitions ──────────────────────────────────────────────────────

export interface FilterPreset {
  id: string;
  name: string;
  /** CSS filter string applied to the <video> for live preview */
  cssFilter: (intensity: number) => string;
  /** Canvas pixel-level transform applied at capture time */
  applyToCanvas: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) => void;
}

// ─── Camera state ────────────────────────────────────────────────────────────

export type CameraFacing = "environment" | "user";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unavailable"
  | "in-use"
  | "unsupported"
  | "error";

export interface CameraState {
  status: CameraStatus;
  errorMessage: string | null;
  facing: CameraFacing;
}

// ─── Adjustment values ───────────────────────────────────────────────────────

export type FlashMode = "off" | "auto" | "on";

export type TimerSeconds = 0 | 3 | 5 | 10;

export type ZoomPreset = {
  focal: 26 | 35 | 50;
  scale: number;
};

export interface ImageAdjustments {
  brightness: number; // 0–200, default 100
  contrast: number;   // 0–200, default 100
}

// ─── App state ───────────────────────────────────────────────────────────────

export type AppScreen = "camera" | "preview";

export interface AppState {
  screen: AppScreen;
  capturedDataUrl: string | null;
  capturedBlob: Blob | null;
  selectedFilterId: string;
  filterIntensity: number; // 0–100
  adjustments: ImageAdjustments;
}
