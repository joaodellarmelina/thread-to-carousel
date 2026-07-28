"use client";

import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { modalSpring, backdropFade } from "@/lib/motion";

export function TextFitDialog({
  removedChars,
  onKeep,
  onUndo,
}: {
  removedChars: number;
  onKeep: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={backdropFade}
        className="absolute inset-0 bg-black/70"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={modalSpring}
        className="modal-surface relative z-10 flex w-full max-w-xs flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <h2 className="font-display text-base font-semibold lowercase">text won&apos;t fit</h2>
        </div>
        <p className="text-sm text-[var(--app-fg-muted)] lowercase">
          this image doesn&apos;t leave enough room for your full text — the last {removedChars}{" "}
          character{removedChars === 1 ? "" : "s"} would be cut off. keep the shortened text, or remove
          the image and keep everything you wrote?
        </p>
        <div className="flex justify-end gap-2">
          <button
            data-cuelume-press
            onClick={onUndo}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--app-fg-muted)] transition-transform active:scale-[0.97] lowercase"
          >
            remove image
          </button>
          <button
            data-cuelume-press
            data-cuelume-release
            onClick={onKeep}
            className="rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white transition-transform active:scale-[0.97] lowercase"
          >
            keep shortened
          </button>
        </div>
      </motion.div>
    </div>
  );
}
