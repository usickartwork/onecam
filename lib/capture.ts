import type { FilterPreset } from "@/types";

interface CaptureOptions {
  videoEl: HTMLVideoElement;
  filter: FilterPreset;
  filterIntensity: number;
  brightness: number;
  contrast: number;
}

/**
 * Captures the current video frame, applies the selected filter and
 * adjustments using Canvas, and returns both a data URL and a Blob.
 */
export async function capturePhoto(
  opts: CaptureOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const { videoEl, filter, filterIntensity, brightness, contrast } = opts;

  const width = videoEl.videoWidth || 1280;
  const height = videoEl.videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");

  // 1. Apply brightness / contrast via CSS filter on the context
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(videoEl, 0, 0, width, height);
  ctx.filter = "none"; // reset

  // 2. Apply pixel-level filter
  filter.applyToCanvas(ctx, width, height, filterIntensity);

  // 3. Export
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to generate image blob."));
      },
      "image/jpeg",
      0.92
    );
  });

  return { dataUrl, blob };
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
  // Revoke after a tick
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
  // Fallback: download
  downloadBlob(blob, filename);
}
