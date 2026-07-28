"use client";

import { motion } from "motion/react";
import { PenLine } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function EmptyState({ onPaste }: { onPaste: () => void }) {
  const addSlide = useAppStore((s) => s.addSlide);

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="flex max-w-sm flex-col items-center gap-7 text-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="h-16 w-16 rounded-2xl shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)]"
        />
        <div className="flex flex-col gap-2">
          <h1 className="font-display display-heading text-2xl font-semibold lowercase">thread to carrousel</h1>
          <p className="text-sm leading-relaxed text-[var(--app-fg-muted)] lowercase">
            paste an x thread. get an editable, instagram-ready carousel.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            data-cuelume-press
            data-cuelume-release
            onClick={onPaste}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--app-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-transform active:scale-[0.97]"
          >
            <PenLine size={16} />
            <span className="lowercase">paste a thread</span>
          </button>
          <button
            data-cuelume-press
            data-cuelume-release
            onClick={() => addSlide()}
            className="material inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[var(--app-fg)] transition-transform active:scale-[0.97]"
          >
            <span className="lowercase">start blank</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
