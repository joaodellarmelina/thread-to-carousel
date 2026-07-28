"use client";

import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { modalSpring, backdropFade } from "@/lib/motion";
import { formatPostDateTime } from "@/lib/date";

export function DateTimePicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
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
        className="modal-surface relative z-10 flex w-full max-w-xs flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--app-fg-muted)]" />
          <h2 className="font-display text-base font-semibold lowercase">post date &amp; time</h2>
        </div>
        <p className="text-sm text-[var(--app-fg-muted)] lowercase">
          set this once — applies to every slide in the carousel.
        </p>
        <input
          type="datetime-local"
          autoFocus
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm outline-none [color-scheme:dark] focus:border-[var(--app-accent)]/50"
        />
        <p className="text-xs text-[var(--app-fg-muted)]">preview: {formatPostDateTime(value)}</p>
      </motion.div>
    </div>
  );
}
