import type { FilterPreset } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Blend a pixel-level sepia / color-shift effect into the canvas.
 * `mix` is 0–1 where 1 = full effect.
 */
function applyPixelMix(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  transform: (r: number, g: number, b: number) => [number, number, number],
  mix: number
) {
  if (mix <= 0) return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const [nr, ng, nb] = transform(d[i], d[i + 1], d[i + 2]);
    d[i] = clamp(d[i] + (nr - d[i]) * mix, 0, 255);
    d[i + 1] = clamp(d[i + 1] + (ng - d[i + 1]) * mix, 0, 255);
    d[i + 2] = clamp(d[i + 2] + (nb - d[i + 2]) * mix, 0, 255);
  }
  ctx.putImageData(imageData, 0, 0);
}

// ─── Filter presets ───────────────────────────────────────────────────────────

export const FILTERS: FilterPreset[] = [
  // 1. Original
  {
    id: "original",
    name: "Original",
    cssFilter: () => "none",
    applyToCanvas: () => {},
  },

  // 2. Vintage
  {
    id: "vintage",
    name: "Vintage",
    cssFilter: (i) =>
      `sepia(${i * 0.6}%) saturate(${100 + i * 0.4}%) brightness(${100 - i * 0.05}%) contrast(${100 + i * 0.1}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r * 0.9 + g * 0.3 + b * 0.1 + 20 * mix, 0, 255),
          clamp(r * 0.1 + g * 0.8 + b * 0.1 + 5 * mix, 0, 255),
          clamp(r * 0.1 + g * 0.1 + b * 0.6, 0, 255),
        ],
        mix
      );
    },
  },

  // 3. Classic Film
  {
    id: "classic-film",
    name: "Classic Film",
    cssFilter: (i) =>
      `sepia(${i * 0.3}%) contrast(${100 + i * 0.15}%) brightness(${100 - i * 0.05}%) saturate(${100 - i * 0.2}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => {
          const avg = (r + g + b) / 3;
          const nr = clamp(r * (1 - mix * 0.1) + avg * mix * 0.1 + 10 * mix, 0, 255);
          const ng = clamp(g * (1 - mix * 0.05) + avg * mix * 0.05 + 5 * mix, 0, 255);
          const nb = clamp(b * (1 - mix * 0.15) + avg * mix * 0.15, 0, 255);
          return [nr, ng, nb];
        },
        mix
      );
    },
  },

  // 4. Warm
  {
    id: "warm",
    name: "Warm",
    cssFilter: (i) =>
      `sepia(${i * 0.2}%) saturate(${100 + i * 0.3}%) brightness(${100 + i * 0.03}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r + 30 * mix, 0, 255),
          clamp(g + 10 * mix, 0, 255),
          clamp(b - 20 * mix, 0, 255),
        ],
        mix
      );
    },
  },

  // 5. Cool
  {
    id: "cool",
    name: "Cool",
    cssFilter: (i) =>
      `saturate(${100 + i * 0.2}%) hue-rotate(${i * 0.2}deg) brightness(${100 + i * 0.02}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r - 20 * mix, 0, 255),
          clamp(g + 5 * mix, 0, 255),
          clamp(b + 30 * mix, 0, 255),
        ],
        mix
      );
    },
  },

  // 6. Mono
  {
    id: "mono",
    name: "Mono",
    cssFilter: (i) => `grayscale(${i}%) contrast(${100 + i * 0.1}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          return [lum, lum, lum];
        },
        mix
      );
    },
  },

  // 7. Fade
  {
    id: "fade",
    name: "Fade",
    cssFilter: (i) =>
      `brightness(${100 + i * 0.1}%) saturate(${100 - i * 0.4}%) contrast(${100 - i * 0.2}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r + (220 - r) * mix * 0.3, 0, 255),
          clamp(g + (220 - g) * mix * 0.3, 0, 255),
          clamp(b + (220 - b) * mix * 0.3, 0, 255),
        ],
        mix
      );
    },
  },

  // 8. Retro
  {
    id: "retro",
    name: "Retro",
    cssFilter: (i) =>
      `sepia(${i * 0.4}%) saturate(${100 + i * 0.5}%) hue-rotate(${i * -0.1}deg) contrast(${100 + i * 0.1}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r * 1.1 + 15 * mix, 0, 255),
          clamp(g * 0.9 + 5 * mix, 0, 255),
          clamp(b * 0.7 - 10 * mix, 0, 255),
        ],
        mix
      );
    },
  },

  // 9. Soft
  {
    id: "soft",
    name: "Soft",
    cssFilter: (i) =>
      `brightness(${100 + i * 0.08}%) saturate(${100 - i * 0.1}%) contrast(${100 - i * 0.15}%) blur(${i * 0.003}px)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => [
          clamp(r + (255 - r) * mix * 0.15, 0, 255),
          clamp(g + (255 - g) * mix * 0.15, 0, 255),
          clamp(b + (255 - b) * mix * 0.15, 0, 255),
        ],
        mix
      );
    },
  },

  // 10. Cinematic
  {
    id: "cinematic",
    name: "Cinematic",
    cssFilter: (i) =>
      `contrast(${100 + i * 0.3}%) saturate(${100 + i * 0.2}%) brightness(${100 - i * 0.05}%)`,
    applyToCanvas: (ctx, w, h, i) => {
      const mix = i / 100;
      // Add subtle teal-orange color grade
      applyPixelMix(
        ctx, w, h,
        (r, g, b) => {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const isHighlight = lum > 128;
          if (isHighlight) {
            return [
              clamp(r + 15 * mix, 0, 255),
              clamp(g + 5 * mix, 0, 255),
              clamp(b - 10 * mix, 0, 255),
            ];
          } else {
            return [
              clamp(r - 10 * mix, 0, 255),
              clamp(g + 5 * mix, 0, 255),
              clamp(b + 20 * mix, 0, 255),
            ];
          }
        },
        mix
      );
    },
  },
];

export function getFilterById(id: string): FilterPreset {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}
