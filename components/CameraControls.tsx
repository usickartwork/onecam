"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}

export function Slider({ label, value, min, max, onChange, unit = "" }: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 tracking-wide uppercase">{label}</span>
        <span className="text-xs text-white/70 font-mono tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full"
      />
    </div>
  );
}

// ─── FilterIntensity ──────────────────────────────────────────────────────────

interface FilterIntensityProps {
  intensity: number;
  onChange: (v: number) => void;
}

export function FilterIntensity({ intensity, onChange }: FilterIntensityProps) {
  return <Slider label="Intensity" value={intensity} min={0} max={100} onChange={onChange} />;
}

// ─── ImageAdjustments ─────────────────────────────────────────────────────────

interface ImageAdjustmentsProps {
  brightness: number;
  contrast: number;
  onBrightnessChange: (v: number) => void;
  onContrastChange: (v: number) => void;
}

export function ImageAdjustments({
  brightness,
  contrast,
  onBrightnessChange,
  onContrastChange,
}: ImageAdjustmentsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Slider label="Brightness" value={brightness} min={50} max={150} onChange={onBrightnessChange} />
      <Slider label="Contrast" value={contrast} min={50} max={150} onChange={onContrastChange} />
    </div>
  );
}
