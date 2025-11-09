import * as React from "react";
import { cn } from "@/lib/utils";

export interface CanvasControls {
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  resetView: () => void;
}

interface InteractiveCanvasProps {
  children?: (ctx: CanvasRenderingContext2D, controls: CanvasControls) => void;
  width?: number;
  height?: number;
  showGrid?: boolean;
  gridSize?: number;
  className?: string;
  onControlsChange?: (controls: CanvasControls) => void;
}

/**
 * InteractiveCanvas - A canvas component with zoom, pan, and grid controls
 *
 * Features:
 * - Mouse wheel to zoom
 * - Click and drag to pan
 * - Optional grid overlay
 * - Programmatic zoom/pan control
 * - Export to image
 */
export const InteractiveCanvas = React.forwardRef<
  HTMLCanvasElement,
  InteractiveCanvasProps
>(({
  children,
  width = 800,
  height = 600,
  showGrid = false,
  gridSize = 20,
  className,
  onControlsChange,
}, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Expose canvas ref to parent
  React.useImperativeHandle(ref, () => canvasRef.current!);

  // Zoom functions
  const zoomIn = React.useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 10));
  }, []);

  const zoomOut = React.useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const fitToScreen = React.useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scaleX = container.clientWidth / width;
    const scaleY = container.clientHeight / height;
    const newZoom = Math.min(scaleX, scaleY) * 0.9;
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }, [width, height]);

  const resetView = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Controls object
  const controls: CanvasControls = React.useMemo(() => ({
    zoom,
    pan,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    fitToScreen,
    resetView,
  }), [zoom, pan, zoomIn, zoomOut, fitToScreen, resetView]);

  // Notify parent of control changes
  React.useEffect(() => {
    onControlsChange?.(controls);
  }, [controls, onControlsChange]);

  // Mouse wheel zoom
  const handleWheel = React.useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(10, prev * delta)));
  }, []);

  // Mouse drag to pan
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add wheel event listener
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Draw grid
  const drawGrid = React.useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }, [showGrid, width, height, gridSize]);

  // Main render loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    drawGrid(ctx);

    // Call children render function
    children?.(ctx, controls);

    ctx.restore();
  }, [zoom, pan, width, height, children, controls, drawGrid]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded px-3 py-1 text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
});

InteractiveCanvas.displayName = "InteractiveCanvas";
