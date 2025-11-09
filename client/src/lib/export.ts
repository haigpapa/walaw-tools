import { downloadFile } from "./utils";

export type ExportFormat = "png" | "jpg" | "webp" | "svg" | "gif";

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1 for JPG/WebP
  backgroundColor?: string; // For JPG (no transparency)
  scale?: number; // Scale multiplier for higher resolution
}

/**
 * Export a canvas to an image file
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  options: ExportOptions
): Promise<void> {
  const { format, quality = 0.92, backgroundColor = "#ffffff", scale = 1 } = options;

  // Create a scaled canvas if needed
  let exportCanvas = canvas;
  if (scale !== 1) {
    exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    const ctx = exportCanvas.getContext("2d");
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.drawImage(canvas, 0, 0);
    }
  }

  // Handle different formats
  let blob: Blob | null = null;

  switch (format) {
    case "png":
      blob = await new Promise((resolve) => exportCanvas.toBlob(resolve, "image/png"));
      break;

    case "jpg":
      // JPG doesn't support transparency, so we need to add a background
      const jpgCanvas = document.createElement("canvas");
      jpgCanvas.width = exportCanvas.width;
      jpgCanvas.height = exportCanvas.height;
      const jpgCtx = jpgCanvas.getContext("2d");
      if (jpgCtx) {
        jpgCtx.fillStyle = backgroundColor;
        jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
        jpgCtx.drawImage(exportCanvas, 0, 0);
      }
      blob = await new Promise((resolve) =>
        jpgCanvas.toBlob(resolve, "image/jpeg", quality)
      );
      break;

    case "webp":
      blob = await new Promise((resolve) =>
        exportCanvas.toBlob(resolve, "image/webp", quality)
      );
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  if (!blob) {
    throw new Error("Failed to create image blob");
  }

  downloadFile(filename, blob);
}

/**
 * Export SVG content to file
 */
export function exportSVG(svgElement: SVGElement, filename: string): void {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  downloadFile(filename, blob);
}

/**
 * Record canvas frames for GIF/video export
 */
export class CanvasRecorder {
  private canvas: HTMLCanvasElement;
  private frames: Blob[] = [];
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Start recording video
   */
  async startRecording(options: { mimeType?: string; videoBitsPerSecond?: number } = {}) {
    const stream = this.canvas.captureStream(30); // 30 FPS

    const mimeType = options.mimeType || "video/webm";
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
    });

    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  /**
   * Stop recording and download video
   */
  async stopRecording(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        downloadFile(filename, blob);
        this.isRecording = false;
        resolve();
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Capture a single frame as PNG
   */
  async captureFrame(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to capture frame"));
        }
      }, "image/png");
    });
  }

  /**
   * Download all captured frames as a ZIP (requires JSZip library)
   */
  async downloadFrames(filename: string): Promise<void> {
    // This would require JSZip library
    // For now, just download frames individually
    for (let i = 0; i < this.frames.length; i++) {
      downloadFile(`${filename}-frame-${i.toString().padStart(4, "0")}.png`, this.frames[i]);
    }
  }

  get recording(): boolean {
    return this.isRecording;
  }

  get frameCount(): number {
    return this.frames.length;
  }
}

/**
 * Export data as JSON file
 */
export function exportJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadFile(filename, blob);
}

/**
 * Export text data as TXT file
 */
export function exportText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  downloadFile(filename, blob);
}

/**
 * Get recommended filename based on format
 */
export function getExportFilename(baseName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${baseName}-${timestamp}.${format}`;
}
