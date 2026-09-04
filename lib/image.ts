/**
 * Downscales and re-encodes an image file to a JPEG data URL. Raw photos from a
 * phone can be several MB — stored as-is they blow through localStorage's ~5-10MB
 * quota after just a couple of slides. Capping dimension + JPEG quality keeps each
 * image small while staying crisp at export size.
 */
export function compressImageToDataUrl(file: File, maxDimension: number, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(objectUrl);

      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

/** Prepares editor media without turning large binary files into localStorage strings. */
export function prepareImage(file: File, maxDimension: number, quality = 0.9): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // GIFs must remain untouched or their animation is lost.
      if (file.type === "image/gif") {
        URL.revokeObjectURL(objectUrl);
        resolve({ blob: file, width: originalWidth, height: originalHeight });
        return;
      }

      const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
      const width = Math.round(originalWidth * scale);
      const height = Math.round(originalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => (blob ? resolve({ blob, width, height }) : reject(new Error("Image conversion failed"))),
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}
