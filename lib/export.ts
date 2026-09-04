import { toPng } from "html-to-image";

export async function domToPngBlob(node: HTMLElement, pixelWidth: number): Promise<Blob> {
  const rect = node.getBoundingClientRect();
  if (!rect.width) throw new Error("The export canvas has no width.");
  const restoreSources = await materializeObjectUrlImages(node);
  try {
    await waitForRenderableAssets(node);
    const pixelRatio = pixelWidth / rect.width;
    const dataUrl = await toPng(node, {
      pixelRatio,
      // Editor media uses blob: URLs. html-to-image's cache buster appends a
      // query string to them, producing an invalid object URL and aborting ZIPs.
      cacheBust: false,
      // Tweet cards deliberately use a system font. Scanning the app's Google
      // font stylesheet adds a network dependency and can reject with an Event.
      skipFonts: true,
      // A corrupt optional preview must not reject the entire carousel with a
      // non-descriptive browser Event object.
      onImageErrorHandler: () => undefined,
    });
    return dataUrlToBlob(dataUrl);
  } finally {
    restoreSources();
  }
}

async function materializeObjectUrlImages(node: HTMLElement): Promise<() => void> {
  const replacements: Array<{ image: HTMLImageElement; src: string }> = [];
  const images = Array.from(node.querySelectorAll("img"));

  for (const image of images) {
    const src = image.getAttribute("src") ?? "";
    if (!src.startsWith("blob:")) continue;
    const response = await fetch(src);
    if (!response.ok) throw new Error("A local image could not be read.");
    const dataUrl = await blobToDataUrl(await response.blob());
    replacements.push({ image, src });
    image.src = dataUrl;
  }

  return () => {
    for (const replacement of replacements) replacement.image.src = replacement.src;
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read local media."));
    reader.readAsDataURL(blob);
  });
}

async function waitForRenderableAssets(node: HTMLElement): Promise<void> {
  if ("fonts" in document) await document.fonts.ready;
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }
      try {
        await image.decode();
      } catch {
        // html-to-image will surface a useful error if the asset truly cannot render.
      }
    })
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",", 2);
  if (!header || encoded === undefined) throw new Error("Invalid PNG data.");
  const mime = header.match(/^data:([^;]+)/)?.[1] ?? "image/png";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
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
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari can cancel a download when the backing URL is revoked in the same task.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
