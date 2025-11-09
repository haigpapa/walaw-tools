import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { P5Canvas, type P5Instance } from "@/components/canvas/p5-canvas";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Point on text contour
class ContourPoint {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number = 0;
  vy: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  update(attraction: number, friction: number) {
    // Move toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    this.vx += dx * attraction;
    this.vy += dy * attraction;

    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(p5: P5Instance, size: number, color: string) {
    p5.fill(color);
    p5.noStroke();
    p5.circle(this.x, this.y, size);
  }
}

// State interface
interface ContourTypeState {
  text: string;
  fontSize: number;
  fontFamily: string;
  samplePoints: number;
  pointSize: number;
  attraction: number;
  friction: number;
  mouseInfluence: number;
  connectPoints: boolean;
  animationSpeed: number;
  waveAmplitude: number;
  waveFrequency: number;
  colorMode: "solid" | "gradient" | "rainbow";
  primaryColor: string;
  secondaryColor: string;
}

const defaultState: ContourTypeState = {
  text: "WALAW",
  fontSize: 120,
  fontFamily: "Arial Black",
  samplePoints: 200,
  pointSize: 4,
  attraction: 0.1,
  friction: 0.9,
  mouseInfluence: 50,
  connectPoints: true,
  animationSpeed: 1,
  waveAmplitude: 20,
  waveFrequency: 0.02,
  colorMode: "gradient",
  primaryColor: "#4ecdc4",
  secondaryColor: "#ff6b6b",
};

const defaultPresets = [
  {
    id: "particles",
    name: "Particle Cloud",
    description: "Free-floating particles",
    data: { ...defaultState, connectPoints: false, samplePoints: 300, pointSize: 3 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "wave",
    name: "Wave Motion",
    description: "Flowing wave animation",
    data: { ...defaultState, waveAmplitude: 40, waveFrequency: 0.05, animationSpeed: 2 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "connected",
    name: "Connected Lines",
    description: "Mesh of connected points",
    data: { ...defaultState, connectPoints: true, samplePoints: 150, pointSize: 2 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function ContourTypeComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointsRef = React.useRef<ContourPoint[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(true);

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<ContourTypeState>({
    initialState: defaultState,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets<ContourTypeState>({
    toolName: "contour-type",
    defaultPresets,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<ContourTypeState>({
    toolName: "contour-type",
    autoSave: true,
  });

  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  const sampleTextContour = React.useCallback((p5: P5Instance, text: string, fontSize: number, fontFamily: string, numPoints: number) => {
    // Create temporary canvas to get text outline
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];

    tempCanvas.width = p5.width;
    tempCanvas.height = p5.height;

    tempCtx.font = `${fontSize}px "${fontFamily}", Arial, sans-serif`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'white';
    tempCtx.fillText(text, p5.width / 2, p5.height / 2);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    // Find edge pixels (simple edge detection)
    const edgePixels: { x: number; y: number }[] = [];

    for (let y = 1; y < tempCanvas.height - 1; y += 2) {
      for (let x = 1; x < tempCanvas.width - 1; x += 2) {
        const i = (y * tempCanvas.width + x) * 4;
        const current = pixels[i + 3]; // Alpha channel

        if (current > 0) {
          // Check if it's an edge (has transparent neighbor)
          const top = pixels[((y - 1) * tempCanvas.width + x) * 4 + 3];
          const bottom = pixels[((y + 1) * tempCanvas.width + x) * 4 + 3];
          const left = pixels[(y * tempCanvas.width + (x - 1)) * 4 + 3];
          const right = pixels[(y * tempCanvas.width + (x + 1)) * 4 + 3];

          if (top === 0 || bottom === 0 || left === 0 || right === 0) {
            edgePixels.push({ x, y });
          }
        }
      }
    }

    // Sample points from edges
    const points: ContourPoint[] = [];
    const step = Math.max(1, Math.floor(edgePixels.length / numPoints));

    for (let i = 0; i < edgePixels.length; i += step) {
      if (points.length >= numPoints) break;
      const pixel = edgePixels[i];
      points.push(new ContourPoint(pixel.x, pixel.y));
    }

    return points;
  }, []);

  const setup = React.useCallback((p5: P5Instance) => {
    p5.background(20);
  }, []);

  const draw = React.useCallback((p5: P5Instance) => {
    p5.background(20, 30);

    const {
      text,
      fontSize,
      fontFamily,
      samplePoints,
      pointSize,
      attraction,
      friction,
      mouseInfluence,
      connectPoints,
      animationSpeed,
      waveAmplitude,
      waveFrequency,
      colorMode,
      primaryColor,
      secondaryColor,
    } = state;

    // Initialize points if needed
    if (pointsRef.current.length === 0 || pointsRef.current.length !== samplePoints) {
      pointsRef.current = sampleTextContour(p5, text, fontSize, fontFamily, samplePoints);
    }

    const time = isPlaying ? p5.frameCount * animationSpeed * 0.01 : 0;

    // Update and draw points
    pointsRef.current.forEach((point, i) => {
      // Wave animation
      const waveOffset = Math.sin(time + i * waveFrequency) * waveAmplitude;
      point.targetX = point.targetX + Math.cos(time + i * 0.1) * 0.5;
      point.targetY = point.targetY + waveOffset * 0.1;

      // Mouse influence
      if (p5.mouseIsPressed) {
        const dx = point.x - p5.mouseX;
        const dy = point.y - p5.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const force = ((100 - dist) / 100) * mouseInfluence;
          point.vx += (dx / dist) * force;
          point.vy += (dy / dist) * force;
        }
      }

      // Update physics
      if (isPlaying) {
        point.update(attraction, friction);
      }

      // Determine color
      let color = primaryColor;
      if (colorMode === "gradient") {
        const progress = i / pointsRef.current.length;
        // Simple gradient interpolation
        color = `hsl(${progress * 60 + 180}, 70%, 60%)`;
      } else if (colorMode === "rainbow") {
        const hue = (i * 10 + time * 50) % 360;
        color = `hsl(${hue}, 70%, 60%)`;
      }

      // Draw point
      point.draw(p5, pointSize, color);

      // Draw connections
      if (connectPoints && i > 0) {
        const prev = pointsRef.current[i - 1];
        const dist = p5.dist(point.x, point.y, prev.x, prev.y);

        if (dist < 30) {
          p5.stroke(color);
          p5.strokeWeight(1);
          p5.line(point.x, point.y, prev.x, prev.y);
        }
      }
    });

    // Info text
    p5.fill(255);
    p5.noStroke();
    p5.textSize(12);
    p5.textAlign('left', 'top');
    p5.text(`"${text}" | ${pointsRef.current.length} points`, 10, 10);
  }, [state, isPlaying, sampleTextContour]);

  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Contour Type Project");
    }
  }, []);

  // Reset points when text changes
  React.useEffect(() => {
    pointsRef.current = [];
  }, [state.text, state.fontSize, state.fontFamily]);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Typography Controls</h2>
      </div>

      <ControlPanel title="Text" defaultOpen>
        <div className="space-y-2">
          <Label>Text Content</Label>
          <Input
            value={state.text}
            onChange={(e) => setState({ ...state, text: e.target.value.toUpperCase() })}
            placeholder="Enter text..."
            className="font-bold text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label>Font Size: {state.fontSize}px</Label>
          <Slider
            value={[state.fontSize]}
            onValueChange={([v]) => setState({ ...state, fontSize: v })}
            min={40}
            max={200}
            step={5}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Sampling">
        <div className="space-y-2">
          <Label>Sample Points: {state.samplePoints}</Label>
          <Slider
            value={[state.samplePoints]}
            onValueChange={([v]) => setState({ ...state, samplePoints: v })}
            min={50}
            max={500}
            step={10}
          />
        </div>
        <div className="space-y-2">
          <Label>Point Size: {state.pointSize}px</Label>
          <Slider
            value={[state.pointSize]}
            onValueChange={([v]) => setState({ ...state, pointSize: v })}
            min={1}
            max={15}
            step={0.5}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Connect Points</Label>
          <Switch
            checked={state.connectPoints}
            onCheckedChange={(checked) => setState({ ...state, connectPoints: checked })}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Physics">
        <div className="space-y-2">
          <Label>Attraction: {(state.attraction * 100).toFixed(0)}%</Label>
          <Slider
            value={[state.attraction * 100]}
            onValueChange={([v]) => setState({ ...state, attraction: v / 100 })}
            min={1}
            max={30}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Friction: {(state.friction * 100).toFixed(0)}%</Label>
          <Slider
            value={[state.friction * 100]}
            onValueChange={([v]) => setState({ ...state, friction: v / 100 })}
            min={80}
            max={99}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Mouse Influence: {state.mouseInfluence}</Label>
          <Slider
            value={[state.mouseInfluence]}
            onValueChange={([v]) => setState({ ...state, mouseInfluence: v })}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Animation">
        <div className="space-y-2">
          <Label>Wave Amplitude: {state.waveAmplitude}</Label>
          <Slider
            value={[state.waveAmplitude]}
            onValueChange={([v]) => setState({ ...state, waveAmplitude: v })}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Wave Frequency: {state.waveFrequency.toFixed(2)}</Label>
          <Slider
            value={[state.waveFrequency * 100]}
            onValueChange={([v]) => setState({ ...state, waveFrequency: v / 100 })}
            min={0}
            max={10}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label>Speed: {state.animationSpeed.toFixed(1)}x</Label>
          <Slider
            value={[state.animationSpeed]}
            onValueChange={([v]) => setState({ ...state, animationSpeed: v })}
            min={0.1}
            max={5}
            step={0.1}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => setIsPlaying(!isPlaying)}
          variant={isPlaying ? "destructive" : "default"}
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Play
            </>
          )}
        </Button>
      </ControlPanel>
    </div>
  );

  const rightSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Presets</h2>
      </div>

      <ControlPanel title="Presets" defaultOpen>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start text-left text-sm"
                onClick={() => {
                  const data = loadPreset(preset.id);
                  if (data) {
                    setState(data);
                    pointsRef.current = [];
                  }
                }}
              >
                <div>
                  <div className="font-medium">{preset.name}</div>
                  {preset.description && (
                    <div className="text-xs text-muted-foreground">
                      {preset.description}
                    </div>
                  )}
                </div>
              </Button>
              {!defaultPresets.find((dp) => dp.id === preset.id) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePreset(preset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          className="w-full mt-2"
          variant="outline"
          onClick={() => {
            const name = window.prompt("Enter preset name:");
            if (name) savePreset(name, "Custom preset", state);
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Current as Preset
        </Button>
      </ControlPanel>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Contour Type Sampler"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Contour Type");
            setState(defaultState);
            pointsRef.current = [];
          }}
          onSave={saveProject}
          onExport={exportToFile}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900/20">
        <P5Canvas
          ref={canvasRef}
          width={800}
          height={600}
          setup={setup}
          draw={draw}
          className="shadow-2xl"
        />
      </div>
    </ToolLayout>
  );
}
