"use client";

import { useRef, useEffect } from "react";
import { FILTERS } from "@/lib/filters";
import type { FilterPreset } from "@/types";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function FilterThumb({
  filter,
  isSelected,
  videoRef,
  onClick,
}: {
  filter: FilterPreset;
  isSelected: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (video.readyState >= 2) {
        ctx.filter = filter.cssFilter(70);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
      }
    };

    // Draw once and also on play
    draw();
    video.addEventListener("play", draw);
    return () => video.removeEventListener("play", draw);
  }, [filter, videoRef]);

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-opacity ${
        isSelected ? "opacity-100" : "opacity-60 hover:opacity-80"
      }`}
      aria-label={`Apply ${filter.name} filter`}
      aria-pressed={isSelected}
    >
      <div
        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
          isSelected ? "border-[#e8d5b7]" : "border-transparent"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={56}
          height={56}
          className="w-full h-full object-cover bg-[#1e1e1e]"
        />
        {filter.id === "original" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
            <span className="text-white/40 text-xs">●</span>
          </div>
        )}
      </div>
      <span
        className={`text-[10px] font-medium tracking-wide transition-colors ${
          isSelected ? "text-[#e8d5b7]" : "text-white/50"
        }`}
      >
        {filter.name}
      </span>
    </button>
  );
}

export function FilterSelector({ selectedId, onSelect, videoRef }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Scroll selected into view
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const idx = FILTERS.findIndex((f) => f.id === selectedId);
    const child = strip.children[idx] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedId]);

  return (
    <div
      ref={stripRef}
      className="filter-strip flex gap-3 overflow-x-auto px-4 py-1"
    >
      {FILTERS.map((f) => (
        <FilterThumb
          key={f.id}
          filter={f}
          isSelected={f.id === selectedId}
          videoRef={videoRef}
          onClick={() => onSelect(f.id)}
        />
      ))}
    </div>
  );
}
