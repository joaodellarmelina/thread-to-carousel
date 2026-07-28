"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { ProfileEditor } from "./profile-editor";
import { modalSpring, backdropFade } from "@/lib/motion";

export function ProfilePanel({ onClose }: { onClose: () => void }) {
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
        className="modal-surface relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold lowercase">your profile</h2>
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
          set this once. your name, handle, and avatar apply to every slide in the carousel.
        </p>
        <ProfileEditor />
      </motion.div>
    </div>
  );
}
