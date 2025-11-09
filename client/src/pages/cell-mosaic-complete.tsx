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
import { Upload, Play, Pause, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Tool state interface
interface CellMosaicState {
  gridCols: number;
  gridRows: number;
  threshold: number;
  animationSpeed: number;
  useLetters: boolean;
  letterString: string;
  imageUrl: string | null;
  maskMode: "brightness" | "color";
  cellSpacing: number;
  colorPalette: string[];
}

const defaultState: CellMosaicState = {
  gridCols: 40,
  gridRows: 30,
  threshold: 128,
  animationSpeed: 1,
  useLetters: true,
  letterString: "WALAW",
  imageUrl: null,
  maskMode: "brightness",
  cellSpacing: 2,
  colorPalette: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7"],
};

// Default presets
const defaultPresets = [
  {
    id: "classic",
    name: "Classic Mosaic",
    description: "Traditional mosaic with letters",
    data: { ...defaultState, gridCols: 40, gridRows: 30, useLetters: true },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fine-detail",
    name: "Fine Detail",
    description: "High resolution for detailed images",
    data: { ...defaultState, gridCols: 80, gridRows: 60, cellSpacing: 1 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "bold-shapes",
    name: "Bold Shapes",
    description: "Large colorful shapes",
    data: { ...defaultState, gridCols: 20, gridRows: 15, useLetters: false },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function CellMosaicComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const animationOffset = React.useRef(0);

  // State management with history
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<CellMosaicState>({
    initialState: defaultState,
    maxHistorySize: 50,
  });

  // Preset management
  const { presets, savePreset, loadPreset, deletePreset } = usePresets<CellMosaicState>({
    toolName: "cell-mosaic",
    defaultPresets,
  });

  // Project management
  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<CellMosaicState>({
    toolName: "cell-mosaic",
    autoSave: true,
  });

  // Update project when state changes
  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  // Load sample image on mount
  React.useEffect(() => {
    // Create a sample gradient image
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create gradient
      const gradient = ctx.createRadialGradient(200, 150, 50, 200, 150, 200);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#888888');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);

      // Add some circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(150, 100, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(250, 200, 50, 0, Math.PI * 2);
      ctx.fill();

      setState({ ...state, imageUrl: canvas.toDataURL() });
    }
  }, []);

  // Handlers
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setState({ ...state, imageUrl: e.target?.result as string });
          toast({ title: "Image Loaded", description: "Image uploaded successfully" });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSavePreset = () => {
    const name = window.prompt("Enter preset name:");
    if (name) {
      savePreset(name, "Custom preset", state);
    }
  };

  // P5 Setup
  const setup = React.useCallback((p5: P5Instance) => {
    p5.background(20);
    p5.textAlign('center', 'center');
  }, []);

  // P5 Draw function
  const draw = React.useCallback((p5: P5Instance) => {
    p5.background(20);

    const { gridCols, gridRows, threshold, useLetters, letterString, imageUrl, cellSpacing, colorPalette, maskMode } = state;

    if (!imageUrl) {
      // Show placeholder
      p5.fill(100);
      p5.textSize(24);
      p5.text('Upload an image to begin', p5.width / 2, p5.height / 2);
      return;
    }

    // Load image if not already loaded
    if (!imageRef.current && imageUrl) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
      };
      img.src = imageUrl;
      return;
    }

    const img = imageRef.current;
    if (!img) return;

    const cellWidth = p5.width / gridCols;
    const cellHeight = p5.height / gridRows;

    // Animation offset
    if (isPlaying) {
      animationOffset.current += state.animationSpeed * 0.01;
    }

    // Draw mosaic
    for (let col = 0; col < gridCols; col++) {
      for (let row = 0; row < gridRows; row++) {
        const x = col * cellWidth;
        const y = row * cellHeight;

        // Sample image color at this position
        const sampleX = (col / gridCols) * img.width;
        const sampleY = (row / gridRows) * img.height;

        // Create temporary canvas to sample pixel
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;

        tempCtx.drawImage(img, 0, 0);
        const pixelData = tempCtx.getImageData(sampleX, sampleY, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Calculate brightness
        const brightness = (r + g + b) / 3;

        // Apply threshold with animation
        const waveOffset = Math.sin((col + row + animationOffset.current) * 0.5) * 30;
        const shouldShow = brightness > (threshold + waveOffset);

        if (shouldShow) {
          // Pick color from palette based on position
          const colorIndex = (col + row) % colorPalette.length;
          const color = colorPalette[colorIndex];

          p5.push();
          p5.translate(x + cellWidth / 2, y + cellHeight / 2);

          if (useLetters) {
            // Draw letter
            p5.fill(color);
            p5.noStroke();
            p5.textSize(cellWidth * 0.8);
            const charIndex = (col + row) % letterString.length;
            const char = letterString[charIndex];
            p5.text(char, 0, 0);
          } else {
            // Draw shape
            p5.fill(color);
            p5.noStroke();
            const size = (cellWidth - cellSpacing) * (brightness / 255);

            // Vary shapes
            const shapeType = (col + row) % 3;
            if (shapeType === 0) {
              p5.rect(-size/2, -size/2, size, size);
            } else if (shapeType === 1) {
              p5.circle(0, 0, size);
            } else {
              // Triangle
              p5.beginPath?.();
              const ctx = (p5 as any).canvas?.getContext('2d');
              if (ctx) {
                ctx.beginPath();
                ctx.moveTo(0, -size/2);
                ctx.lineTo(size/2, size/2);
                ctx.lineTo(-size/2, size/2);
                ctx.closePath();
                ctx.fill();
              }
            }
          }

          p5.pop();
        }
      }
    }

    // Draw info
    p5.fill(255);
    p5.textSize(12);
    p5.textAlign('left', 'top');
    p5.text(`${gridCols}x${gridRows} | Threshold: ${Math.round(threshold)}`, 10, 10);
  }, [state, isPlaying]);

  // Keyboard shortcuts
  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  // Initialize project
  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Cell Mosaic Project");
    }
  }, []);

  // Left sidebar
  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Cell Mosaic Controls</h2>
        {hasUnsavedChanges && (
          <p className="text-xs text-muted-foreground mt-1">● Unsaved changes</p>
        )}
      </div>

      <ControlPanel title="Grid Settings" defaultOpen>
        <div className="space-y-2">
          <Label>Columns: {state.gridCols}</Label>
          <Slider
            value={[state.gridCols]}
            onValueChange={([v]) => setState({ ...state, gridCols: v })}
            min={10}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Rows: {state.gridRows}</Label>
          <Slider
            value={[state.gridRows]}
            onValueChange={([v]) => setState({ ...state, gridRows: v })}
            min={10}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Cell Spacing: {state.cellSpacing}px</Label>
          <Slider
            value={[state.cellSpacing]}
            onValueChange={([v]) => setState({ ...state, cellSpacing: v })}
            min={0}
            max={10}
            step={1}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Appearance">
        <div className="space-y-2">
          <Label>Threshold: {state.threshold}</Label>
          <Slider
            value={[state.threshold]}
            onValueChange={([v]) => setState({ ...state, threshold: v })}
            min={0}
            max={255}
            step={1}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="use-letters">Use Letters</Label>
          <Switch
            id="use-letters"
            checked={state.useLetters}
            onCheckedChange={(checked) => setState({ ...state, useLetters: checked })}
          />
        </div>
        {state.useLetters && (
          <div className="space-y-2">
            <Label>Letter String</Label>
            <Input
              value={state.letterString}
              onChange={(e) => setState({ ...state, letterString: e.target.value })}
              placeholder="Enter letters..."
            />
          </div>
        )}
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
        <Button className="w-full" variant="outline" onClick={handleImageUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      </ControlPanel>
    </div>
  );

  // Right sidebar
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
        <Button className="w-full mt-2" variant="outline" onClick={handleSavePreset}>
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
          title="Cell Mosaic Animator"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Cell Mosaic");
            setState(defaultState);
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
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
