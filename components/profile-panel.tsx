"use client";

import { motion } from "motion/react";
import { BarChart3, Calendar, X } from "lucide-react";
import { ProfileEditor } from "./profile-editor";
import { modalSpring, backdropFade } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import type { PostMetrics } from "@/lib/types";

export function ProfilePanel({ onClose }: { onClose: () => void }) {
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const slide = useAppStore((s) => s.slides.find((item) => item.id === s.selectedSlideId));
  const updateSlideDateTime = useAppStore((s) => s.updateSlideDateTime);
  const updateSlideMetrics = useAppStore((s) => s.updateSlideMetrics);
  const updateSlideDisplay = useAppStore((s) => s.updateSlideDisplay);
  const applyProfileToAll = useAppStore((s) => s.applyProfileToAll);

  if (!slide || !selectedSlideId) return null;

  const metricFields: Array<{ key: keyof PostMetrics; label: string }> = [
    { key: "replies", label: "replies" },
    { key: "reposts", label: "reposts" },
    { key: "likes", label: "likes" },
    { key: "bookmarks", label: "bookmarks" },
    { key: "views", label: "views" },
  ];

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
        className="modal-surface relative z-10 flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold lowercase">post details</h2>
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
          everything here belongs to the selected post. apply the profile to all slides when you want a consistent thread.
        </p>
        <ProfileEditor />
        <button onClick={() => applyProfileToAll(selectedSlideId)} className="rounded-lg bg-white/8 px-3 py-2 text-xs font-medium text-[var(--app-fg-muted)] transition-colors hover:bg-white/12 hover:text-white">
          apply this profile to every slide
        </button>

        <div className="material flex flex-col gap-3 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-white/85"><Calendar size={14} /><span className="lowercase">date &amp; visibility</span></div>
          <input type="datetime-local" value={slide.postDateTime} onChange={(event) => updateSlideDateTime(selectedSlideId, event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm outline-none [color-scheme:dark]" />
          <div className="grid grid-cols-2 gap-2">
            <Toggle label="date" active={slide.display.showDate} onClick={() => updateSlideDisplay(selectedSlideId, { showDate: !slide.display.showDate })} />
            <Toggle label="metrics" active={slide.display.showMetrics} onClick={() => updateSlideDisplay(selectedSlideId, { showMetrics: !slide.display.showMetrics })} />
            <Toggle label="views" active={slide.display.showViews} onClick={() => updateSlideDisplay(selectedSlideId, { showViews: !slide.display.showViews })} />
            <Toggle label="x logo" active={slide.display.showXLogo} onClick={() => updateSlideDisplay(selectedSlideId, { showXLogo: !slide.display.showXLogo })} />
          </div>
        </div>

        <div className="material flex flex-col gap-3 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-white/85"><BarChart3 size={14} /><span className="lowercase">engagement</span></div>
          <div className="grid grid-cols-2 gap-2">
            {metricFields.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1 text-[10px] text-[var(--app-fg-muted)]">
                <span className="lowercase">{label}</span>
                <input value={slide.metrics[key]} onChange={(event) => updateSlideMetrics(selectedSlideId, { [key]: event.target.value.slice(0, 8) })} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none" />
              </label>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${active ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"}`}>{label}</button>;
}
