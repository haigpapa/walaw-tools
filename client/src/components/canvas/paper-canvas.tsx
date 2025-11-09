import * as React from "react";
import { cn } from "@/lib/utils";

// Simplified Paper.js-like API
export class PaperPath {
  private points: { x: number; y: number }[] = [];
  public strokeColor: string = "#000000";
  public fillColor: string | null = null;
  public strokeWidth: number = 1;
  public closed: boolean = false;

  moveTo(x: number, y: number) {
    this.points.push({ x, y });
  }

  lineTo(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    if (this.closed) {
      ctx.closePath();
    }

    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }

    if (this.strokeWidth > 0) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
  }

  clone(): PaperPath {
    const newPath = new PaperPath();
    newPath.points = [...this.points];
    newPath.strokeColor = this.strokeColor;
    newPath.fillColor = this.fillColor;
    newPath.strokeWidth = this.strokeWidth;
    newPath.closed = this.closed;
    return newPath;
  }

  getPoints() {
    return this.points;
  }

  translate(x: number, y: number) {
    this.points = this.points.map(p => ({ x: p.x + x, y: p.y + y }));
  }

  rotate(angle: number, center?: { x: number; y: number }) {
    const cx = center?.x || 0;
    const cy = center?.y || 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    this.points = this.points.map(p => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    });
  }

  scale(sx: number, sy?: number, center?: { x: number; y: number }) {
    const scaleY = sy || sx;
    const cx = center?.x || 0;
    const cy = center?.y || 0;

    this.points = this.points.map(p => ({
      x: cx + (p.x - cx) * sx,
      y: cy + (p.y - cy) * scaleY,
    }));
  }
}

export class PaperScope {
  public paths: PaperPath[] = [];
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  Path(options?: { strokeColor?: string; fillColor?: string; strokeWidth?: number }) {
    const path = new PaperPath();
    if (options?.strokeColor) path.strokeColor = options.strokeColor;
    if (options?.fillColor) path.fillColor = options.fillColor;
    if (options?.strokeWidth) path.strokeWidth = options.strokeWidth;
    this.paths.push(path);
    return path;
  }

  Circle(center: { x: number; y: number }, radius: number, options?: any) {
    const path = this.Path(options);
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.closed = true;
    return path;
  }

  Rectangle(x: number, y: number, width: number, height: number, options?: any) {
    const path = this.Path(options);
    path.moveTo(x, y);
    path.lineTo(x + width, y);
    path.lineTo(x + width, y + height);
    path.lineTo(x, y + height);
    path.closed = true;
    return path;
  }

  importSVG(svgString: string): PaperPath[] {
    // Simple SVG path parsing (basic implementation)
    const paths: PaperPath[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const pathElements = doc.querySelectorAll('path');

    pathElements.forEach(pathEl => {
      const d = pathEl.getAttribute('d');
      if (d) {
        const path = this.Path({
          strokeColor: pathEl.getAttribute('stroke') || '#000000',
          fillColor: pathEl.getAttribute('fill') || null,
          strokeWidth: parseFloat(pathEl.getAttribute('stroke-width') || '1'),
        });

        // Basic path parsing (M and L commands only)
        const commands = d.match(/[MLZ][^MLZ]*/g) || [];
        commands.forEach(cmd => {
          const type = cmd[0];
          const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

          if (type === 'M' && coords.length >= 2) {
            path.moveTo(coords[0], coords[1]);
          } else if (type === 'L' && coords.length >= 2) {
            path.lineTo(coords[0], coords[1]);
          } else if (type === 'Z') {
            path.closed = true;
          }
        });

        paths.push(path);
      }
    });

    return paths;
  }

  clear() {
    this.paths = [];
  }

  draw() {
    this.paths.forEach(path => path.draw(this.ctx));
  }
}

interface PaperCanvasProps {
  width?: number;
  height?: number;
  setup?: (paper: PaperScope) => void;
  onFrame?: (paper: PaperScope, frameCount: number) => void;
  className?: string;
}

/**
 * PaperCanvas - A React wrapper for Paper.js-like vector graphics
 *
 * Provides a simplified Paper.js API for vector manipulation without requiring the full library.
 */
export const PaperCanvas = React.forwardRef<HTMLCanvasElement, PaperCanvasProps>(({
  width = 800,
  height = 600,
  setup,
  onFrame,
  className,
}, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number>();
  const paperScopeRef = React.useRef<PaperScope | null>(null);

  React.useImperativeHandle(ref, () => canvasRef.current!);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paper = new PaperScope(ctx);
    paperScopeRef.current = paper;

    let frameCount = 0;

    // Setup
    if (setup) setup(paper);

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Call frame handler
      if (onFrame) onFrame(paper, frameCount);

      // Draw all paths
      paper.draw();

      frameCount++;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, setup, onFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("block", className)}
    />
  );
});

PaperCanvas.displayName = "PaperCanvas";

export { PaperScope };
