"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { play } from "cuelume";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { modalSpring, backdropFade } from "@/lib/motion";

export function ThreadImporter({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const importThread = useAppStore((s) => s.importThread);
  const hasExistingSlides = useAppStore((s) => s.slides.length > 0);

  function handleImport() {
    if (!value.trim()) return;
    importThread(value);
    play("ready");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={backdropFade}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={modalSpring}
        className="modal-surface relative z-10 flex w-full max-w-lg flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold lowercase">paste your thread</h2>
          <button
            data-cuelume-press
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--app-fg-muted)] transition-transform hover:text-[var(--app-fg)] active:scale-90"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-[var(--app-fg-muted)] lowercase">
          separate each tweet with a blank line (or paste it as-is, numbered tweets and &ldquo;---&rdquo;
          separators are detected automatically). you can edit every slide afterward.
        </p>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"Podcasts are one of the best ways to generate content...\n\nIf you film an episode, there are a bunch of ways to repurpose it..."}
          rows={10}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed outline-none [overflow-wrap:anywhere] placeholder:text-[var(--app-fg-muted)]/60 focus:border-[var(--app-accent)]/50"
        />
        {hasExistingSlides && (
          <p className="text-xs text-amber-400/90 lowercase">this will replace your current slides.</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            data-cuelume-press
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--app-fg-muted)] transition-transform active:scale-[0.97] lowercase"
          >
            cancel
          </button>
          <button
            data-cuelume-press
            data-cuelume-release
            onClick={handleImport}
            disabled={!value.trim()}
            className="rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white transition-transform active:scale-[0.97] disabled:opacity-40 lowercase"
          >
            import thread
          </button>
        </div>
      </motion.div>
    </div>
  );
}
