export type OutputFormat = "image/jpeg" | "image/webp" | "image/png";
export type CompressionResult = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  format: OutputFormat;
};

export const MAX_TARGET_BYTES = 1024 * 1024 - 1;
export const MIN_TARGET_BYTES = 20 * 1024;
const SUPPORTED_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;
const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.28];

export function isSupportedImageFile(file: File): boolean {
  // Some devices provide an empty or incorrect MIME type, so extension is a fallback.
  return file.type.startsWith("image/") || SUPPORTED_EXTENSIONS.test(file.name);
}

async function appearsToBeHeic(file: File): Promise<boolean> {
  if (/\.heic$|\.heif$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) {
    return true;
  }

  // Inspect the ISO-BMFF brand too. This catches HEIC photos incorrectly named .jpg/.jpeg.
  const bytes = new Uint8Array(await file.slice(0, 96).arrayBuffer());
  const header = Array.from(bytes, value => String.fromCharCode(value)).join("");
  return ["ftypheic", "ftypheix", "ftyphevc", "ftyphevx", "ftypheim", "ftypheis", "ftyphevm", "ftyphevs", "ftypheif"]
    .some(brand => header.includes(brand));
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(
        "We couldn't read this image. Try a standard JPG/JPEG, PNG, WebP, GIF, BMP, or AVIF file. HEIC/HEIF photos are also supported."
      ));
    };
    image.src = url;
  });
}

/**
 * Convert HEIC/HEIF to a browser-readable PNG only when needed.
 * The converter is a dynamic import, so most visitors never download it.
 */
export async function prepareImageFile(file: File): Promise<Blob> {
  let readableBlob: Blob = file;
  if (await appearsToBeHeic(file)) {
    try {
      const heicModule = await import("heic2any");
      const converted = await heicModule.default({
        blob: file,
        toType: "image/png",
        quality: 1
      });
      readableBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      throw new Error(
        "This HEIC/HEIF photo couldn't be opened. Try exporting it as JPG from Photos, then upload it again."
      );
    }
  }

  // Validate before showing the original preview so a broken image isn't left in the UI.
  await loadImage(readableBlob);
  return readableBlob;
}

function canvasBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("The browser could not compress this image."));
        return;
      }
      if (blob.type !== format) {
        reject(new Error(`Your browser doesn't support ${format.replace("image/", "").toUpperCase()} output. Choose WebP or JPEG instead.`));
        return;
      }
      resolve(blob);
    }, format, quality);
  });
}

export async function compressToTargetSize(
  file: Blob,
  format: OutputFormat,
  targetBytes: number = MAX_TARGET_BYTES
): Promise<CompressionResult> {
  if (!Number.isFinite(targetBytes) || targetBytes < MIN_TARGET_BYTES || targetBytes > MAX_TARGET_BYTES) {
    throw new Error("Choose a target size between 20 KB and 1 MB.");
  }

  const image = await loadImage(file);
  // If the selected output format already matches and the file fits, keep the original quality.
  if (file.type === format && file.size <= targetBytes) {
    return {
      blob: file,
      width: image.naturalWidth,
      height: image.naturalHeight,
      quality: 1,
      format
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support image compression.");

  let scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
  let best: Blob | null = null;
  let bestQuality = 1;
  let bestWidth = 0;
  let bestHeight = 0;

  // PNG has no quality slider; reduce dimensions as needed. JPEG/WebP use descending quality.
  const qualitySteps = format === "image/png" ? [1] : QUALITY_STEPS;

  for (let resizeAttempt = 0; resizeAttempt < 21; resizeAttempt++) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (format === "image/jpeg") {
      // JPEG has no transparency; use white behind transparent source pixels.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(image, 0, 0, width, height);

    for (const quality of qualitySteps) {
      const blob = await canvasBlob(canvas, format, quality);
      if (!best || blob.size < best.size) {
        best = blob;
        bestQuality = quality;
        bestWidth = width;
        bestHeight = height;
      }
      if (blob.size <= targetBytes) {
        return { blob, width, height, quality, format };
      }
    }

    // Reducing dimensions is the reliable fallback for very small requested targets.
    scale *= 0.78;
  }

  if (best && best.size <= targetBytes) {
    return { blob: best, width: bestWidth, height: bestHeight, quality: bestQuality, format };
  }
  throw new Error(
    `Could not get this image under ${formatTargetSize(targetBytes)}. Try WebP output or choose a larger target size.`
  );
}

export function formatTargetSize(bytes: number): string {
  if (bytes >= MAX_TARGET_BYTES) return "1 MB";
  return `${Math.max(1, Math.floor(bytes / 1024))} KB`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not preview the compressed image."));
    reader.readAsDataURL(blob);
  });
}
