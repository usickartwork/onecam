"use client";

import { Download, Share2, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { downloadBlob, sharePhoto, buildFilename } from "@/lib/capture";

interface Props {
  dataUrl: string;
  blob: Blob;
  onRetake: () => void;
}

export function PhotoPreview({ dataUrl, blob, onRetake }: Props) {
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      downloadBlob(blob, buildFilename());
    } catch {
      setSaveError("Download failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setSaveError(null);
    try {
      await sharePhoto(blob, buildFilename());
    } catch (err) {
      // User cancelled share = AbortError, not an actual error
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSaveError("Sharing failed. The photo will be downloaded instead.");
      downloadBlob(blob, buildFilename());
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-3">
        <button
          onClick={onRetake}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <RotateCcw size={16} />
          <span>Retake</span>
        </button>
        <span className="text-white/40 text-xs tracking-widest uppercase font-medium">
          Preview
        </span>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-0">
        <div className="relative w-full max-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Captured photo"
            className="w-full h-full object-contain max-h-[70vh]"
          />
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <p className="text-red-400 text-xs text-center px-4 py-1">{saveError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 px-4 pb-safe pb-6 pt-4">
        {/* Privacy note */}
        <p className="text-white/30 text-[10px] text-center leading-relaxed">
          Your photos stay on your device. DAZZCAM does not upload or store your photos on our servers.
        </p>

        <div className="flex gap-3">
          {/* Share */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {sharing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Share2 size={18} />
            )}
            Share
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#e8d5b7] hover:bg-[#f0dfc4] active:bg-[#dcc9a8] text-[#0a0a0a] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
