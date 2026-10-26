import { jsPDF } from "jspdf";

export type PageSize = "a4" | "letter";
export type PageOrientation = "portrait" | "landscape";

export type PdfOptions = {
  pageSize: PageSize;
  orientation: PageOrientation;
  marginMm: number;
};

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not open "${file.name}". Try a JPG, PNG, or WebP image.`));
    };
    image.src = url;
  });
}

async function prepareImage(file: File): Promise<LoadedImage> {
  const image = await loadImage(file);
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser does not support image conversion.");

  // A white canvas prevents transparent pixels from becoming black in a PDF.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), width, height };
}

export async function createPhotoPdf(files: File[], options: PdfOptions): Promise<Blob> {
  if (files.length === 0) throw new Error("Add at least one photo first.");
  if (files.length > 10) throw new Error("You can add a maximum of 10 photos.");

  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: options.pageSize,
    compress: true
  });

  for (let index = 0; index < files.length; index++) {
    const image = await prepareImage(files[index]);

    if (index > 0) pdf.addPage(options.pageSize, options.orientation);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const availableWidth = pageWidth - options.marginMm * 2;
    const availableHeight = pageHeight - options.marginMm * 2;
    const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    pdf.addImage(image.dataUrl, "JPEG", x, y, drawWidth, drawHeight, undefined, "FAST");
  }

  return pdf.output("blob");
}

export function readableFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
