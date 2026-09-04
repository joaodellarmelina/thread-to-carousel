import type { MediaAsset } from "./types";

const FRAME_RATE = 30;

export interface VideoOverlay {
  media: MediaAsset;
  /** Coordinates relative to the exported card, in its rendered CSS pixels. */
  rect: { x: number; y: number; width: number; height: number };
}

export interface TweetVideoExportOptions {
  poster: Blob;
  width: number;
  height: number;
  /** Width of the DOM card that produced the poster, in CSS pixels. */
  sourceWidth: number;
  overlays: VideoOverlay[];
  onProgress?: (progress: number) => void;
}

type LoadedVideo = {
  overlay: VideoOverlay;
  element: HTMLVideoElement;
  duration: number;
};

type AudioCapture = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  track: MediaStreamAudioTrack;
};

/**
 * Creates an Instagram-ready H.264 MP4 entirely in the browser. The static
 * tweet chrome is captured once as a poster, then uploaded videos are drawn
 * over their exact media tiles for every encoded frame.
 */
export async function renderTweetVideo({ poster, width, height, sourceWidth, overlays, onProgress }: TweetVideoExportOptions): Promise<Blob> {
  if (!overlays.length) throw new Error("Add a video to this post before exporting MP4.");
  if (typeof VideoEncoder === "undefined") {
    throw new Error("MP4 export needs a current version of Chrome, Edge, or Safari.");
  }

  const {
    BufferTarget,
    CanvasSource,
    MediaStreamAudioTrackSource,
    Mp4OutputFormat,
    Output,
    Quality,
    canEncodeAudio,
  } = await import("mediabunny");
  const image = await loadImage(poster);
  const videos = await Promise.all(overlays.map(loadVideo));
  const duration = Math.max(...videos.map((video) => video.duration));
  if (!Number.isFinite(duration) || duration <= 0) {
    disposeVideos(videos);
    throw new Error("This video could not be read. Try an MP4, MOV, or WebM file.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    disposeVideos(videos);
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });
  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    quality: new Quality({ bitrate: 8_000_000 }),
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate: FRAME_RATE });

  // Audio is routed through an offline MediaStream destination, never the
  // speakers. When the browser exposes AAC WebCodecs support, the MP4 keeps
  // the original video's sound in sync with the rendered post.
  const audioCapture = createAudioCapture(videos[0]?.element);
  let audioSource: InstanceType<typeof MediaStreamAudioTrackSource> | null = null;
  if (audioCapture && await canEncodeAudio("aac", { bitrate: 128_000 })) {
    audioSource = new MediaStreamAudioTrackSource(audioCapture.track, {
      codec: "aac",
      quality: new Quality({ bitrate: 128_000 }),
    }, { timestampBase: "synced-zero" });
    // The source exposes asynchronous media errors separately. The MP4 can
    // still be finalized with its video track if a local audio codec fails.
    void audioSource.errorPromise.catch(() => undefined);
    output.addAudioTrack(audioSource);
  }

  try {
    await output.start();
    await audioCapture?.context.resume();
    await Promise.all(videos.map(({ element }) => element.play()));

    const frames = Math.max(1, Math.ceil(duration * FRAME_RATE));
    const startedAt = performance.now();
    for (let frame = 0; frame < frames; frame++) {
      const targetTime = startedAt + (frame * 1000) / FRAME_RATE;
      await waitUntil(targetTime);
      drawFrame(context, image, width, height, sourceWidth, videos);
      await videoSource.add(frame / FRAME_RATE, 1 / FRAME_RATE, { keyFrame: frame % (FRAME_RATE * 2) === 0 });
      onProgress?.((frame + 1) / frames);
    }

    videoSource.close();
    audioSource?.close();
    await output.finalize();
    if (!target.buffer) throw new Error("The MP4 could not be finalized.");
    return new Blob([target.buffer], { type: "video/mp4" });
  } catch (cause) {
    if (output.state !== "finalized" && output.state !== "canceled") await output.cancel();
    throw cause;
  } finally {
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
    audioCapture?.source.disconnect();
    audioCapture?.track.stop();
    void audioCapture?.context.close();
    disposeVideos(videos);
  }
}

async function loadVideo(overlay: VideoOverlay): Promise<LoadedVideo> {
  const src = overlay.media.src;
  if (!src) throw new Error(`The video “${overlay.media.name}” is no longer available.`);
  const element = document.createElement("video");
  element.src = src;
  element.preload = "auto";
  element.playsInline = true;
  // Keeps browser autoplay policies from blocking the render loop. Audio is
  // captured separately from the element's Web Audio source when supported.
  element.muted = true;
  await waitForEvent(element, "loadeddata");
  return { overlay, element, duration: element.duration };
}

function createAudioCapture(video: HTMLVideoElement | undefined): AudioCapture | null {
  if (!video || typeof MediaStreamTrackProcessor === "undefined" || typeof AudioContext === "undefined") return null;
  try {
    const context = new AudioContext();
    const source = context.createMediaElementSource(video);
    const destination = context.createMediaStreamDestination();
    source.connect(destination);
    const track = destination.stream.getAudioTracks()[0];
    return track ? { context, source, track: track as MediaStreamAudioTrack } : null;
  } catch {
    // A few browsers disallow element-audio capture. They still receive a
    // playable silent H.264 MP4 instead of losing the export entirely.
    return null;
  }
}

function disposeVideos(videos: LoadedVideo[]) {
  for (const { element } of videos) {
    element.pause();
    element.removeAttribute("src");
    element.load();
  }
}

function drawFrame(
  context: CanvasRenderingContext2D,
  poster: CanvasImageSource,
  width: number,
  height: number,
  sourceWidth: number,
  videos: LoadedVideo[]
) {
  context.drawImage(poster, 0, 0, width, height);
  for (const { overlay, element } of videos) {
    if (element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) continue;
    const scaleX = width / sourceWidth;
    // The card's dimensions are proportional to the export canvas. Scaling
    // from its width is stable even when the off-screen rig is 480px wide.
    const scale = scaleX;
    drawCover(
      context,
      element,
      overlay.rect.x * scale,
      overlay.rect.y * scale,
      overlay.rect.width * scale,
      overlay.rect.height * scale,
      overlay.media.focalX ?? 50,
      overlay.media.focalY ?? 50
    );
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  focalX: number,
  focalY: number
) {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight || !width || !height) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  const cropWidth = sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth;
  const cropHeight = sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio;
  const sourceX = Math.max(0, Math.min(sourceWidth - cropWidth, (sourceWidth - cropWidth) * (focalX / 100)));
  const sourceY = Math.max(0, Math.min(sourceHeight - cropHeight, (sourceHeight - cropHeight) * (focalY / 100)));
  context.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, x, y, width, height);
}

async function loadImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function waitForEvent(element: HTMLMediaElement, event: "loadeddata"): Promise<void> {
  if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener(event, onReady);
      element.removeEventListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The local video could not be decoded."));
    };
    element.addEventListener(event, onReady, { once: true });
    element.addEventListener("error", onError, { once: true });
  });
}

function waitUntil(time: number): Promise<void> {
  const delay = Math.max(0, time - performance.now());
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}
