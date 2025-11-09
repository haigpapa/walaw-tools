import * as React from "react";
import { cn } from "@/lib/utils";

// Type definitions for p5.js
export interface P5Instance {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  pmouseX: number;
  pmouseY: number;
  mouseIsPressed: boolean;
  frameCount: number;
  deltaTime: number;

  // Drawing functions
  background(color: string | number): void;
  fill(color: string | number, alpha?: number): void;
  noFill(): void;
  stroke(color: string | number, alpha?: number): void;
  noStroke(): void;
  strokeWeight(weight: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  ellipse(x: number, y: number, w: number, h?: number): void;
  circle(x: number, y: number, d: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  point(x: number, y: number): void;
  text(str: string, x: number, y: number): void;
  textSize(size: number): void;
  textAlign(alignX: string, alignY?: string): void;

  // Image functions
  loadImage(path: string, callback?: (img: any) => void): any;
  image(img: any, x: number, y: number, w?: number, h?: number): void;
  get(x?: number, y?: number, w?: number, h?: number): any;
  pixels: Uint8ClampedArray;
  loadPixels(): void;
  updatePixels(): void;

  // Transform functions
  push(): void;
  pop(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(x: number, y?: number): void;

  // Math functions
  map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
  constrain(n: number, low: number, high: number): number;
  random(min?: number, max?: number): number;
  noise(x: number, y?: number, z?: number): number;

  // Utilities
  createVector(x?: number, y?: number, z?: number): any;
  dist(x1: number, y1: number, x2: number, y2: number): number;
  sin(angle: number): number;
  cos(angle: number): number;
  abs(n: number): number;
  floor(n: number): number;
  ceil(n: number): number;
  round(n: number): number;

  // Constants
  PI: number;
  TWO_PI: number;
  HALF_PI: number;
}

interface P5CanvasProps {
  width?: number;
  height?: number;
  setup?: (p5: P5Instance) => void;
  draw?: (p5: P5Instance) => void;
  mousePressed?: (p5: P5Instance) => void;
  mouseReleased?: (p5: P5Instance) => void;
  mouseMoved?: (p5: P5Instance) => void;
  mouseDragged?: (p5: P5Instance) => void;
  className?: string;
}

/**
 * P5Canvas - A React wrapper for p5.js in instance mode
 *
 * This is a lightweight p5.js implementation that doesn't require the full library.
 * It provides a canvas-based drawing API similar to p5.js but built on native Canvas API.
 */
export const P5Canvas = React.forwardRef<HTMLCanvasElement, P5CanvasProps>(({
  width = 800,
  height = 600,
  setup,
  draw,
  mousePressed,
  mouseReleased,
  mouseMoved,
  mouseDragged,
  className,
}, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number>();
  const p5InstanceRef = React.useRef<P5Instance | null>(null);

  React.useImperativeHandle(ref, () => canvasRef.current!);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let lastTime = performance.now();

    // Create p5-like instance
    const p5: P5Instance = {
      canvas,
      width,
      height,
      mouseX: 0,
      mouseY: 0,
      pmouseX: 0,
      pmouseY: 0,
      mouseIsPressed: false,
      frameCount: 0,
      deltaTime: 0,
      pixels: new Uint8ClampedArray(),

      // Drawing functions
      background(color: string | number) {
        ctx.fillStyle = typeof color === 'number' ? `rgb(${color},${color},${color})` : color;
        ctx.fillRect(0, 0, width, height);
      },

      fill(color: string | number, alpha?: number) {
        if (typeof color === 'number') {
          ctx.fillStyle = alpha !== undefined
            ? `rgba(${color},${color},${color},${alpha / 255})`
            : `rgb(${color},${color},${color})`;
        } else {
          ctx.fillStyle = color;
        }
      },

      noFill() {
        ctx.fillStyle = 'transparent';
      },

      stroke(color: string | number, alpha?: number) {
        if (typeof color === 'number') {
          ctx.strokeStyle = alpha !== undefined
            ? `rgba(${color},${color},${color},${alpha / 255})`
            : `rgb(${color},${color},${color})`;
        } else {
          ctx.strokeStyle = color;
        }
      },

      noStroke() {
        ctx.strokeStyle = 'transparent';
      },

      strokeWeight(weight: number) {
        ctx.lineWidth = weight;
      },

      rect(x: number, y: number, w: number, h: number) {
        if (ctx.fillStyle !== 'transparent') ctx.fillRect(x, y, w, h);
        if (ctx.strokeStyle !== 'transparent') ctx.strokeRect(x, y, w, h);
      },

      ellipse(x: number, y: number, w: number, h?: number) {
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, (h || w) / 2, 0, 0, Math.PI * 2);
        if (ctx.fillStyle !== 'transparent') ctx.fill();
        if (ctx.strokeStyle !== 'transparent') ctx.stroke();
      },

      circle(x: number, y: number, d: number) {
        this.ellipse(x, y, d, d);
      },

      line(x1: number, y1: number, x2: number, y2: number) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      },

      point(x: number, y: number) {
        ctx.fillRect(x, y, 1, 1);
      },

      text(str: string, x: number, y: number) {
        if (ctx.fillStyle !== 'transparent') ctx.fillText(str, x, y);
        if (ctx.strokeStyle !== 'transparent') ctx.strokeText(str, x, y);
      },

      textSize(size: number) {
        ctx.font = `${size}px sans-serif`;
      },

      textAlign(alignX: string, alignY?: string) {
        ctx.textAlign = alignX as CanvasTextAlign;
        if (alignY) ctx.textBaseline = alignY as CanvasTextBaseline;
      },

      // Image functions
      loadImage(path: string, callback?: (img: any) => void) {
        const img = new Image();
        img.onload = () => callback?.(img);
        img.src = path;
        return img;
      },

      image(img: any, x: number, y: number, w?: number, h?: number) {
        if (w !== undefined && h !== undefined) {
          ctx.drawImage(img, x, y, w, h);
        } else {
          ctx.drawImage(img, x, y);
        }
      },

      get(x?: number, y?: number, w?: number, h?: number) {
        if (x === undefined) {
          return ctx.getImageData(0, 0, width, height);
        }
        return ctx.getImageData(x, y, w || 1, h || 1);
      },

      loadPixels() {
        const imageData = ctx.getImageData(0, 0, width, height);
        this.pixels = imageData.data;
      },

      updatePixels() {
        const imageData = new ImageData(this.pixels, width, height);
        ctx.putImageData(imageData, 0, 0);
      },

      // Transform functions
      push() {
        ctx.save();
      },

      pop() {
        ctx.restore();
      },

      translate(x: number, y: number) {
        ctx.translate(x, y);
      },

      rotate(angle: number) {
        ctx.rotate(angle);
      },

      scale(x: number, y?: number) {
        ctx.scale(x, y || x);
      },

      // Math functions
      map(value: number, start1: number, stop1: number, start2: number, stop2: number) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
      },

      constrain(n: number, low: number, high: number) {
        return Math.max(Math.min(n, high), low);
      },

      random(min?: number, max?: number) {
        if (min === undefined) return Math.random();
        if (max === undefined) return Math.random() * min;
        return min + Math.random() * (max - min);
      },

      noise(x: number, y?: number, z?: number) {
        // Simple noise function (can be replaced with Perlin noise library)
        return Math.abs(Math.sin(x * 12.9898 + (y || 0) * 78.233 + (z || 0) * 37.719) * 43758.5453) % 1;
      },

      createVector(x = 0, y = 0, z = 0) {
        return { x, y, z };
      },

      dist(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      },

      sin: Math.sin,
      cos: Math.cos,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,

      // Constants
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      HALF_PI: Math.PI / 2,
    };

    p5InstanceRef.current = p5;

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      p5.pmouseX = p5.mouseX;
      p5.pmouseY = p5.mouseY;
      p5.mouseX = e.clientX - rect.left;
      p5.mouseY = e.clientY - rect.top;

      if (p5.mouseIsPressed && mouseDragged) {
        mouseDragged(p5);
      } else if (mouseMoved) {
        mouseMoved(p5);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      p5.mouseIsPressed = true;
      if (mousePressed) mousePressed(p5);
    };

    const handleMouseUp = (e: MouseEvent) => {
      p5.mouseIsPressed = false;
      if (mouseReleased) mouseReleased(p5);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Setup
    if (setup) setup(p5);

    // Animation loop
    const animate = () => {
      const now = performance.now();
      p5.deltaTime = now - lastTime;
      lastTime = now;
      p5.frameCount = frameCount++;

      if (draw) draw(p5);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width, height, setup, draw, mousePressed, mouseReleased, mouseMoved, mouseDragged]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("block", className)}
    />
  );
});

P5Canvas.displayName = "P5Canvas";
