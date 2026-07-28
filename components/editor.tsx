"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig } from "motion/react";
import { useAppStore } from "@/lib/store";
import { Toolbar } from "./toolbar";
import { EmptyState } from "./empty-state";
import { ThreadImporter } from "./thread-importer";
import { SlideRail } from "./slide-rail";
import { SlideCanvas } from "./slide-canvas";
import { ExportPanel } from "./export-panel";
import { ProfilePanel } from "./profile-panel";

export function Editor() {
  const hasSlides = useAppStore((s) => s.slides.length > 0);
  const profileIntroShown = useAppStore((s) => s.profileIntroShown);
  const markProfileIntroShown = useAppStore((s) => s.markProfileIntroShown);
  const [importerOpen, setImporterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Prompt for profile details once, the first time slides exist.
  const showProfilePanel = profileOpen || (hasSlides && !profileIntroShown);

  function closeProfile() {
    setProfileOpen(false);
    markProfileIntroShown();
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <Toolbar
          onImport={() => setImporterOpen(true)}
          onExport={() => setExportOpen(true)}
          onProfile={() => setProfileOpen(true)}
        />
        <main className="flex flex-1 overflow-hidden">
          {hasSlides ? (
            <>
              <SlideRail />
              <SlideCanvas />
            </>
          ) : (
            <EmptyState onPaste={() => setImporterOpen(true)} />
          )}
        </main>
        <AnimatePresence>
          {importerOpen && <ThreadImporter key="importer" onClose={() => setImporterOpen(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {exportOpen && <ExportPanel key="export" onClose={() => setExportOpen(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {showProfilePanel && <ProfilePanel key="profile" onClose={closeProfile} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
