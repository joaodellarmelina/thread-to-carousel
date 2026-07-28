"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { Palette } from "lucide-react";
import { modalSpring, backdropFade } from "@/lib/motion";

const SOLID_PRESETS = [
  "#f4f4f5",
  "#ffffff",
  "#0b0b0d",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#1d9bf0",
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #7c3aed, #db2777)",
  "linear-gradient(135deg, #0ea5e9, #22d3ee)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #22c55e, #a3e635)",
  "linear-gradient(135deg, #1e293b, #0f172a)",
  "linear-gradient(135deg, #ec4899, #f472b6)",
];

export function FramePicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const customInputRef = useRef<HTMLInputElement>(null);

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
          <Palette size={16} className="text-[var(--app-fg-muted)]" />
          <h2 className="text-base font-semibold lowercase">frame background</h2>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--app-fg-muted)] lowercase">solid</p>
          <div className="grid grid-cols-8 gap-2">
            {SOLID_PRESETS.map((color) => (
              <button
                key={color}
                data-cuelume-press
                data-cuelume-hover="tick"
                onClick={() => {
                  onChange(color);
                  onClose();
                }}
                title={color}
                className={`h-7 w-7 shrink-0 rounded-full ring-1 ring-white/15 transition-transform active:scale-90 ${
                  value === color ? "outline outline-2 outline-offset-2 outline-[var(--app-accent)]" : ""
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--app-fg-muted)] lowercase">gradient</p>
          <div className="grid grid-cols-6 gap-2">
            {GRADIENT_PRESETS.map((gradient) => (
              <button
                key={gradient}
                data-cuelume-press
                data-cuelume-hover="tick"
                onClick={() => {
                  onChange(gradient);
                  onClose();
                }}
                title={gradient}
                className={`h-8 w-8 shrink-0 rounded-full ring-1 ring-white/15 transition-transform active:scale-90 ${
                  value === gradient ? "outline outline-2 outline-offset-2 outline-[var(--app-accent)]" : ""
                }`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--app-fg-muted)] lowercase">custom</p>
          <button
            data-cuelume-press
            data-cuelume-hover="tick"
            onClick={() => customInputRef.current?.click()}
            className="relative flex h-9 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-xs font-medium ring-1 ring-white/15 transition-transform active:scale-[0.97]"
            style={{ background: value.startsWith("#") ? value : "#0b0b0d" }}
          >
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-white lowercase">pick a color</span>
            <input
              ref={customInputRef}
              type="color"
              value={value.startsWith("#") ? value : "#7c3aed"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
