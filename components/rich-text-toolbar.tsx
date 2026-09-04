"use client";

import { Bold, Eraser, Italic } from "lucide-react";

type FormatCommand = "bold" | "italic" | "removeFormat";

export function RichTextToolbar({ slideId }: { slideId: string }) {
  function format(command: FormatCommand) {
    const editor = document.querySelector<HTMLElement>(`[data-live-editor="${slideId}"]`);
    if (!editor) return;
    editor.focus({ preventScroll: true });
    document.execCommand(command, false);
  }

  return (
    <div className="material flex items-center gap-1 rounded-xl p-1.5" aria-label="text formatting">
      <FormatButton label="bold" shortcut="⌘B" onPress={() => format("bold")}><Bold size={14} /></FormatButton>
      <FormatButton label="italic" shortcut="⌘I" onPress={() => format("italic")}><Italic size={14} /></FormatButton>
      <div className="mx-1 h-4 w-px bg-white/10" />
      <FormatButton label="clear formatting" onPress={() => format("removeFormat")}><Eraser size={14} /></FormatButton>
    </div>
  );
}

function FormatButton({ children, label, shortcut, onPress }: { children: React.ReactNode; label: string; shortcut?: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        // Keep the current contentEditable selection while the control is pressed.
        event.preventDefault();
        onPress();
      }}
      className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-[var(--app-fg-muted)] transition-colors hover:bg-white/10 hover:text-white"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
    >
      {children}
      {shortcut && <span className="hidden text-[10px] opacity-60 sm:inline">{shortcut}</span>}
    </button>
  );
}
