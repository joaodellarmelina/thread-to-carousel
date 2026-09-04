"use client";

import { useRef } from "react";
import { BadgeCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { compressImageToDataUrl } from "@/lib/image";
import { NAME_MAX_CHARS, HANDLE_MAX_CHARS } from "@/lib/constants";
import { XLogo } from "./icons";

export function ProfileEditor() {
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const profile = useAppStore((s) => s.slides.find((slide) => slide.id === s.selectedSlideId)?.profile);
  const display = useAppStore((s) => s.slides.find((slide) => slide.id === s.selectedSlideId)?.display);
  const updateSlideProfile = useAppStore((s) => s.updateSlideProfile);
  const updateSlideDisplay = useAppStore((s) => s.updateSlideDisplay);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!profile || !display || !selectedSlideId) return null;

  const setProfile = (next: Partial<typeof profile>) => updateSlideProfile(selectedSlideId, next);

  return (
    <div className="material flex flex-col gap-3 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <button
          data-cuelume-press
          data-cuelume-hover="tick"
          onClick={() => avatarInputRef.current?.click()}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 transition-transform active:scale-95"
          title="change avatar"
        >
          {profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
              {profile.name.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setProfile({ avatarDataUrl: await compressImageToDataUrl(file, 256) });
          }}
        />
        <div className="flex flex-1 flex-col gap-1.5">
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value.slice(0, NAME_MAX_CHARS) })}
            maxLength={NAME_MAX_CHARS}
            placeholder="display name"
            className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--app-accent)]/50"
          />
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5">
            <span className="text-sm text-[var(--app-fg-muted)]">@</span>
            <input
              value={profile.handle}
              onChange={(e) => setProfile({ handle: e.target.value.replace(/\s/g, "").slice(0, HANDLE_MAX_CHARS) })}
              maxLength={HANDLE_MAX_CHARS}
              placeholder="handle"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          data-cuelume-toggle
          onClick={() => setProfile({ verified: !profile.verified })}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-[color,background-color,transform] active:scale-[0.97] ${
            profile.verified ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
          }`}
        >
          <BadgeCheck size={13} />
          <span className="lowercase">verified badge</span>
        </button>
        <button
          data-cuelume-toggle
          onClick={() => updateSlideDisplay(selectedSlideId, { showXLogo: !display.showXLogo })}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-[color,background-color,transform] active:scale-[0.97] ${
            display.showXLogo ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
          }`}
        >
          <XLogo style={{ width: 13, height: 13 }} />
          <span className="lowercase">x logo</span>
        </button>
      </div>
    </div>
  );
}
