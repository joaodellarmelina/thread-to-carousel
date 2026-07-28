"use client";

import { useRef, useState } from "react";

interface DragState {
  startX: number;
  startY: number;
  startFocalX: number;
  startFocalY: number;
  /** How many px of the image are hidden past the container on each axis (object-fit: cover). */
  overflowX: number;
  overflowY: number;
}

/**
 * Transparent overlay for direct-manipulation panning of an object-fit:cover
 * image — drag pans the crop window 1:1 with the pointer (Apple-style direct
 * manipulation: respond on pointer-down, track continuously, no transition).
 */
export function MediaFocalDrag({
  imageRef,
  focalX,
  focalY,
  onChange,
}: {
  imageRef: React.RefObject<HTMLImageElement | null>;
  focalX: number;
  focalY: number;
  onChange: (point: { x: number; y: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<DragState | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const img = imageRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const naturalAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = rect.width / rect.height;
    let overflowX = 0;
    let overflowY = 0;
    if (naturalAspect > containerAspect) {
      overflowX = rect.height * naturalAspect - rect.width;
    } else {
      overflowY = rect.width / naturalAspect - rect.height;
    }
    if (overflowX <= 0 && overflowY <= 0) return; // nothing to pan — image exactly fills the box

    dragState.current = { startX: e.clientX, startY: e.clientY, startFocalX: focalX, startFocalY: focalY, overflowX, overflowY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for pointer types/ids the browser won't associate with this
      // element (e.g. synthetic events) — dragging still works via document-level moves.
    }
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    if (!state) return;
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    // Dragging right/down reveals more of the image's left/top — invert the delta.
    const nextX = state.overflowX > 0 ? clamp(state.startFocalX - (deltaX / state.overflowX) * 100) : state.startFocalX;
    const nextY = state.overflowY > 0 ? clamp(state.startFocalY - (deltaY / state.overflowY) * 100) : state.startFocalY;
    onChange({ x: nextX, y: nextY });
  }

  function endDrag() {
    dragState.current = null;
    setDragging(false);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute inset-0 touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      title="drag to reposition"
    />
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
