import { toPng } from "html-to-image";

export async function domToPngBlob(node: HTMLElement, pixelWidth: number): Promise<Blob> {
  const rect = node.getBoundingClientRect();
  const pixelRatio = pixelWidth / rect.width;
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Resolves once a <video> element has at least one decoded frame available. */
export function waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 4000): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      video.removeEventListener("loadeddata", onReady);
      resolve();
    }, timeoutMs);
    function onReady() {
      clearTimeout(timer);
      resolve();
    }
    video.addEventListener("loadeddata", onReady, { once: true });
  });
}

/** Captures the current frame of a <video> element as a data URL PNG. */
export function capturePosterFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1080;
  canvas.height = video.videoHeight || 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
