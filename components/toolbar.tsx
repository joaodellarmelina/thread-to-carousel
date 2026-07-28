"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { setEnabled } from "cuelume";
import {
  PenLine,
  Plus,
  Download,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RectangleVertical,
  Square,
  Frame,
  Calendar,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FramePicker } from "./frame-picker";
import { DateTimePicker } from "./date-time-picker";

export function Toolbar({
  onImport,
  onExport,
  onProfile,
}: {
  onImport: () => void;
  onExport: () => void;
  onProfile: () => void;
}) {
  const cardTheme = useAppStore((s) => s.cardTheme);
  const setCardTheme = useAppStore((s) => s.setCardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const setCardStyle = useAppStore((s) => s.setCardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const setFrameBackground = useAppStore((s) => s.setFrameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const setAspectRatio = useAppStore((s) => s.setAspectRatio);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const addSlide = useAppStore((s) => s.addSlide);
  const hasSlides = useAppStore((s) => s.slides.length > 0);
  const profile = useAppStore((s) => s.profile);
  const postDateTime = useAppStore((s) => s.postDateTime);
  const setPostDateTime = useAppStore((s) => s.setPostDateTime);
  const [framePickerOpen, setFramePickerOpen] = useState(false);
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setEnabled(next);
  }

  return (
    <header className="material sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-7 w-7 shrink-0 rounded-lg" />
        <span className="hidden font-display text-sm font-semibold lowercase sm:inline">thread to carrousel</span>
      </div>

      {/* The editing controls only make sense once there's something to edit — the
          landing page keeps its own single "paste a thread" / "start blank" CTA. */}
      {hasSlides && (
        <div className="flex items-center gap-1.5">
          <button
            data-cuelume-press
            data-cuelume-release
            data-cuelume-hover="tick"
            onClick={onImport}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
          >
            <PenLine size={15} />
            <span className="hidden lowercase sm:inline">import</span>
          </button>

          <button
            data-cuelume-press
            data-cuelume-release
            data-cuelume-hover="tick"
            onClick={() => addSlide()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
          >
            <Plus size={15} />
            <span className="hidden lowercase sm:inline">slide</span>
          </button>

          <div className="mx-1 h-5 w-px bg-white/10" />

          <button
            data-cuelume-toggle
            data-cuelume-hover="tick"
            onClick={() => setAspectRatio(aspectRatio === "4:5" ? "1:1" : "4:5")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
            title="toggle aspect ratio"
          >
            {aspectRatio === "4:5" ? <RectangleVertical size={15} /> : <Square size={15} />}
            <span className="hidden sm:inline">{aspectRatio}</span>
          </button>

          <button
            data-cuelume-toggle
            data-cuelume-hover="tick"
            onClick={() => setCardTheme(cardTheme === "dark" ? "light" : "dark")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
            title="toggle card theme"
          >
            {cardTheme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            data-cuelume-toggle
            data-cuelume-hover="tick"
            onClick={() => setCardStyle(cardStyle === "framed" ? "square" : "framed")}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
            title="toggle card template"
          >
            {cardStyle === "framed" ? <Frame size={15} /> : <Square size={15} />}
            <span className="hidden lowercase sm:inline">{cardStyle === "framed" ? "framed" : "square"}</span>
          </button>

          {cardStyle === "framed" && (
            <button
              data-cuelume-press
              data-cuelume-hover="tick"
              onClick={() => setFramePickerOpen(true)}
              title="frame background"
              className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/15 transition-transform active:scale-90"
              style={{ background: frameBackground }}
            />
          )}

          <button
            data-cuelume-press
            data-cuelume-hover="tick"
            onClick={() => setDateTimePickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
            title="post date & time"
          >
            <Calendar size={15} />
          </button>

          <button
            data-cuelume-toggle
            data-cuelume-hover="tick"
            onClick={toggleSound}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-fg-muted)] transition-[color,background-color,transform] hover:bg-white/5 hover:text-[var(--app-fg)] active:scale-[0.97]"
            title="toggle sound"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            data-cuelume-press
            data-cuelume-hover="tick"
            onClick={onProfile}
            title="edit profile"
            className="ml-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold transition-transform active:scale-90"
          >
            {profile.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              profile.name.charAt(0).toUpperCase() || "?"
            )}
          </button>

          <div className="mx-1 h-5 w-px bg-white/10" />

          <button
            data-cuelume-press
            data-cuelume-release
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-accent)] px-3.5 py-1.5 text-sm font-medium text-white transition-transform active:scale-[0.97]"
          >
            <Download size={15} />
            <span className="lowercase">export</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {framePickerOpen && (
          <FramePicker
            key="frame-picker"
            value={frameBackground}
            onChange={setFrameBackground}
            onClose={() => setFramePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dateTimePickerOpen && (
          <DateTimePicker
            key="date-time-picker"
            value={postDateTime}
            onChange={setPostDateTime}
            onClose={() => setDateTimePickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
