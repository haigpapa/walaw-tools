import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { PaperCanvas, PaperScope, PaperPath } from "@/components/canvas/paper-canvas";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Play, Pause, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// State interface
interface VectorSplitState {
  duplicates: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
  noiseStrength: number;
  animationSpeed: number;
  strokeWidth: number;
  fillOpacity: number;
  colorShift: number;
  svgContent: string | null;
}

const defaultState: VectorSplitState = {
  duplicates: 5,
  offsetX: 10,
  offsetY: 10,
  rotation: 5,
  scale: 0.95,
  noiseStrength: 0,
  animationSpeed: 1,
  strokeWidth: 2,
  fillOpacity: 0.3,
  colorShift: 30,
  svgContent: null,
};

// Create sample SVG
const createSampleSVG = (): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M 100 50 L 150 150 L 50 150 Z" stroke="#4ecdc4" fill="#4ecdc4" stroke-width="2"/>
      <circle cx="100" cy="100" r="30" stroke="#ff6b6b" fill="none" stroke-width="3"/>
      <rect x="70" y="70" width="60" height="60" stroke="#f9ca24" fill="none" stroke-width="2"/>
    </svg>
  `;
};

const defaultPresets = [
  {
    id: "glitch",
    name: "Glitch Effect",
    description: "Offset layers with color shift",
    data: { ...defaultState, duplicates: 8, offsetX: 15, colorShift: 60, fillOpacity: 0.5 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "spiral",
    name: "Spiral",
    description: "Rotating duplicates",
    data: { ...defaultState, duplicates: 12, rotation: 30, offsetX: 5, offsetY: 5, scale: 0.9 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "echo",
    name: "Echo Effect",
    description: "Fading duplicates",
    data: { ...defaultState, duplicates: 10, offsetX: 8, offsetY: 8, fillOpacity: 0.2, scale: 0.98 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function VectorSplitComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const originalPathsRef = React.useRef<PaperPath[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(true);

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<VectorSplitState>({
    initialState: defaultState,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets<VectorSplitState>({
    toolName: "vector-split",
    defaultPresets,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<VectorSplitState>({
    toolName: "vector-split",
    autoSave: true,
  });

  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  // Load sample SVG
  React.useEffect(() => {
    setState({ ...state, svgContent: createSampleSVG() });
  }, []);

  const handleSVGUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setState({ ...state, svgContent: e.target?.result as string });
          originalPathsRef.current = [];
          toast({ title: "SVG Loaded" });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const setup = React.useCallback((paper: PaperScope) => {
    if (state.svgContent && originalPathsRef.current.length === 0) {
      originalPathsRef.current = paper.importSVG(state.svgContent);
    }
  }, [state.svgContent]);

  const onFrame = React.useCallback((paper: PaperScope, frameCount: number) => {
    paper.clear();

    if (!state.svgContent) {
      // Draw placeholder text
      const ctx = (paper as any).ctx;
      if (ctx) {
        ctx.fillStyle = '#666';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Upload an SVG to begin', 400, 300);
      }
      return;
    }

    // Import SVG if not already done
    if (originalPathsRef.current.length === 0) {
      originalPathsRef.current = paper.importSVG(state.svgContent);
    }

    const {
      duplicates,
      offsetX,
      offsetY,
      rotation,
      scale,
      noiseStrength,
      animationSpeed,
      strokeWidth,
      fillOpacity,
      colorShift,
    } = state;

    const centerX = 400;
    const centerY = 300;

    const time = isPlaying ? frameCount * animationSpeed * 0.01 : 0;

    // Create duplicates
    for (let i = 0; i < duplicates; i++) {
      const progress = i / (duplicates - 1 || 1);

      originalPathsRef.current.forEach((originalPath) => {
        const path = originalPath.clone();

        // Apply transformations
        const currentOffsetX = offsetX * i + Math.sin(time + i * 0.5) * noiseStrength;
        const currentOffsetY = offsetY * i + Math.cos(time + i * 0.5) * noiseStrength;
        const currentRotation = (rotation * i * Math.PI) / 180;
        const currentScale = Math.pow(scale, i);

        // Transform path
        path.scale(currentScale, currentScale, { x: centerX, y: centerY });
        path.rotate(currentRotation, { x: centerX, y: centerY });
        path.translate(currentOffsetX, currentOffsetY);

        // Color shift
        const hueShift = (colorShift * i) % 360;
        if (path.strokeColor) {
          path.strokeColor = `hsl(${hueShift}, 70%, 60%)`;
        }
        if (path.fillColor) {
          path.fillColor = `hsla(${hueShift}, 70%, 60%, ${fillOpacity})`;
        }
        path.strokeWidth = strokeWidth;

        // Add to paper
        paper.paths.push(path);
      });
    }
  }, [state, isPlaying]);

  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Vector Split Project");
    }
  }, []);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Vector Controls</h2>
      </div>

      <ControlPanel title="Duplication" defaultOpen>
        <div className="space-y-2">
          <Label>Duplicates: {state.duplicates}</Label>
          <Slider
            value={[state.duplicates]}
            onValueChange={([v]) => setState({ ...state, duplicates: v })}
            min={1}
            max={20}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Offset X: {state.offsetX}px</Label>
          <Slider
            value={[state.offsetX]}
            onValueChange={([v]) => setState({ ...state, offsetX: v })}
            min={-50}
            max={50}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Offset Y: {state.offsetY}px</Label>
          <Slider
            value={[state.offsetY]}
            onValueChange={([v]) => setState({ ...state, offsetY: v })}
            min={-50}
            max={50}
            step={1}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Transformation">
        <div className="space-y-2">
          <Label>Rotation: {state.rotation}°</Label>
          <Slider
            value={[state.rotation]}
            onValueChange={([v]) => setState({ ...state, rotation: v })}
            min={-45}
            max={45}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Scale: {(state.scale * 100).toFixed(0)}%</Label>
          <Slider
            value={[state.scale * 100]}
            onValueChange={([v]) => setState({ ...state, scale: v / 100 })}
            min={50}
            max={105}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Noise Strength: {state.noiseStrength}</Label>
          <Slider
            value={[state.noiseStrength]}
            onValueChange={([v]) => setState({ ...state, noiseStrength: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Styling">
        <div className="space-y-2">
          <Label>Stroke Width: {state.strokeWidth}px</Label>
          <Slider
            value={[state.strokeWidth]}
            onValueChange={([v]) => setState({ ...state, strokeWidth: v })}
            min={0.5}
            max={10}
            step={0.5}
          />
        </div>
        <div className="space-y-2">
          <Label>Fill Opacity: {(state.fillOpacity * 100).toFixed(0)}%</Label>
          <Slider
            value={[state.fillOpacity * 100]}
            onValueChange={([v]) => setState({ ...state, fillOpacity: v / 100 })}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Color Shift: {state.colorShift}°</Label>
          <Slider
            value={[state.colorShift]}
            onValueChange={([v]) => setState({ ...state, colorShift: v })}
            min={0}
            max={360}
            step={5}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Animation">
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

      <ControlPanel title="Source">
        <Button className="w-full" variant="outline" onClick={handleSVGUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload SVG
        </Button>
        <Button
          className="w-full mt-2"
          variant="outline"
          onClick={() => {
            setState({ ...state, svgContent: createSampleSVG() });
            originalPathsRef.current = [];
          }}
        >
          Load Sample SVG
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
                  if (data) setState(data);
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
          title="Vector Split & Offset"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Vector Split");
            setState(defaultState);
            originalPathsRef.current = [];
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-green-900/20">
        <PaperCanvas
          ref={canvasRef}
          width={800}
          height={600}
          setup={setup}
          onFrame={onFrame}
          className="shadow-2xl bg-gray-900"
        />
      </div>
    </ToolLayout>
  );
}
