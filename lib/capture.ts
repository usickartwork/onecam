import type { FilterPreset } from "@/types";

interface CaptureOptions {
  videoEl: HTMLVideoElement;
  filter: FilterPreset;
  filterIntensity: number;
  brightness: number;
  contrast: number;
  zoom?: number;
  doubleExposureFirstUrl?: string | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
}

function exportCanvas(
  canvas: HTMLCanvasElement
): Promise<{ dataUrl: string; blob: Blob }> {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve({ dataUrl, blob: b });
        else reject(new Error("Failed to generate image blob."));
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Captures a raw zoomed video frame as a data URL (used as Shot 1 in Double Exposure).
 */
export function captureRawFrameUrl(
  videoEl: HTMLVideoElement,
  zoom = 1
): string {
  const vw = videoEl.videoWidth || 1280;
  const vh = videoEl.videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = vw;
  canvas.height = vh;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  const safeZoom = Math.max(1, zoom);
  const srcW = vw / safeZoom;
  const srcH = vh / safeZoom;
  const srcX = (vw - srcW) / 2;
  const srcY = (vh - srcH) / 2;

  ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, vw, vh);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Captures the current video frame (with optional zoom & double-exposure blend),
 * applies brightness/contrast and the selected filter, and returns a data URL + Blob.
 */
export async function capturePhoto(
  opts: CaptureOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const {
    videoEl,
    filter,
    filterIntensity,
    brightness,
    contrast,
    zoom = 1,
    doubleExposureFirstUrl = null,
  } = opts;

  const vw = videoEl.videoWidth || 1280;
  const vh = videoEl.videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = vw;
  canvas.height = vh;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  const safeZoom = Math.max(1, zoom);
  const srcW = vw / safeZoom;
  const srcH = vh / safeZoom;
  const srcX = (vw - srcW) / 2;
  const srcY = (vh - srcH) / 2;

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

  if (doubleExposureFirstUrl) {
    const firstImg = await loadImage(doubleExposureFirstUrl);
    ctx.drawImage(firstImg, 0, 0, vw, vh);
    ctx.globalAlpha = 0.52;
    ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, vw, vh);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, vw, vh);
  }

  ctx.filter = "none";

  // Apply pixel-level filter
  filter.applyToCanvas(ctx, vw, vh, filterIntensity);

  return exportCanvas(canvas);
}

/**
 * Processes an imported local image file entirely in the browser with the
 * selected filter and adjustments.
 */
export async function processImportedPhoto(
  file: File,
  opts: {
    filter: FilterPreset;
    filterIntensity: number;
    brightness: number;
    contrast: number;
  }
): Promise<{ dataUrl: string; blob: Blob }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const maxDim = 2560;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context.");

    ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%)`;
    ctx.drawImage(img, 0, 0, width, height);
    ctx.filter = "none";

    opts.filter.applyToCanvas(ctx, width, height, opts.filterIntensity);
    return await exportCanvas(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Builds a timestamped filename: DAZZCAM_YYYYMMDD_HHMMSS.jpg
 */
export function buildFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time =
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `DAZZCAM_${date}_${time}.jpg`;
}

/**
 * Downloads the blob to the user's device.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Shares the image via the Web Share API, with download fallback.
 */
export async function sharePhoto(blob: Blob, filename: string): Promise<void> {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "image/jpeg" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Photo from DAZZCAM",
      });
      return;
    }
  }
  downloadBlob(blob, filename);
}
