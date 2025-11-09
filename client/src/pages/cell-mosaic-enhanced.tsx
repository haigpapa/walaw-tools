import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { InteractiveCanvas, type CanvasControls } from "@/components/canvas/interactive-canvas";
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
import { exportCanvas, getExportFilename } from "@/lib/export";

// Tool state interface
interface CellMosaicState {
  gridSize: number;
  cellSize: number;
  threshold: number;
  animationSpeed: number;
  useLetters: boolean;
  imageData: string | null;
}

const defaultState: CellMosaicState = {
  gridSize: 20,
  cellSize: 50,
  threshold: 128,
  animationSpeed: 1,
  useLetters: false,
  imageData: null,
};

// Default presets
const defaultPresets = [
  {
    id: "classic",
    name: "Classic Mosaic",
    description: "Traditional mosaic look",
    data: { ...defaultState, gridSize: 20, cellSize: 50, threshold: 128 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fine",
    name: "Fine Detail",
    description: "High resolution grid",
    data: { ...defaultState, gridSize: 50, cellSize: 20, threshold: 100 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "bold",
    name: "Bold Pattern",
    description: "Large cells, high contrast",
    data: { ...defaultState, gridSize: 10, cellSize: 100, threshold: 200 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function CellMosaicEnhanced() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [canvasControls, setCanvasControls] = React.useState<CanvasControls | null>(null);

  // State management with history (undo/redo)
  const {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    history: historyInfo,
  } = useHistory<CellMosaicState>({
    initialState: defaultState,
    maxHistorySize: 50,
  });

  // Preset management
  const {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    exportPresets,
    importPresets,
  } = usePresets<CellMosaicState>({
    toolName: "cell-mosaic",
    defaultPresets,
  });

  // Project management
  const {
    project,
    hasUnsavedChanges,
    createNew,
    updateData,
    save: saveProject,
    load: loadProject,
    exportToFile,
    importFromFile,
  } = useProject<CellMosaicState>({
    toolName: "cell-mosaic",
    autoSave: true,
    autoSaveInterval: 30000,
  });

  // Animation state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const animationFrameRef = React.useRef<number>();

  // Update project data when state changes
  React.useEffect(() => {
    if (project) {
      updateData(state);
    }
  }, [state, project, updateData]);

  // Handlers
  const handleNew = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Create new project?");
      if (!confirmed) return;
    }
    createNew(defaultState, "Untitled Cell Mosaic");
    setState(defaultState);
  };

  const handleSave = () => {
    saveProject();
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      const filename = getExportFilename(project?.name || "cell-mosaic", "png");
      await exportCanvas(canvasRef.current, filename, {
        format: "png",
        scale: 2, // 2x resolution
      });

      toast({
        title: "Exported Successfully",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export canvas",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setState({ ...state, imageData: e.target?.result as string });
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

  const handleLoadPreset = (presetId: string) => {
    const presetData = loadPreset(presetId);
    if (presetData) {
      setState(presetData);
    }
  };

  // Keyboard shortcuts
  useCommonShortcuts({
    onSave: handleSave,
    onNew: handleNew,
    onExport: handleExport,
    onUndo: undo,
    onRedo: redo,
    onZoomIn: () => canvasControls?.zoomIn(),
    onZoomOut: () => canvasControls?.zoomOut(),
    onFitToScreen: () => canvasControls?.fitToScreen(),
  });

  // Canvas render function
  const renderCanvas = React.useCallback(
    (ctx: CanvasRenderingContext2D, controls: CanvasControls) => {
      const { gridSize, cellSize, threshold, useLetters } = state;

      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 800, 600);

      // Draw grid of cells
      for (let x = 0; x < 800; x += cellSize) {
        for (let y = 0; y < 600; y += cellSize) {
          // Determine if cell should be filled based on threshold
          const shouldFill = Math.random() * 255 > threshold;

          if (shouldFill) {
            ctx.fillStyle = `hsl(${(x + y) % 360}, 70%, 60%)`;
            if (useLetters) {
              ctx.font = `${cellSize * 0.8}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
              const letter = letters[Math.floor(Math.random() * letters.length)];
              ctx.fillText(letter, x + cellSize / 2, y + cellSize / 2);
            } else {
              ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            }
          }
        }
      }

      // Draw info
      ctx.fillStyle = "white";
      ctx.font = "14px monospace";
      ctx.fillText(`Grid: ${gridSize}x${gridSize} | Threshold: ${threshold}`, 10, 20);
    },
    [state]
  );

  // Left Sidebar - Tool Controls
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
          <Label>Grid Size: {state.gridSize}</Label>
          <Slider
            value={[state.gridSize]}
            onValueChange={([v]) => setState({ ...state, gridSize: v })}
            min={5}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Cell Size: {state.cellSize}px</Label>
          <Slider
            value={[state.cellSize]}
            onValueChange={([v]) => setState({ ...state, cellSize: v })}
            min={10}
            max={200}
            step={5}
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
      </ControlPanel>

      <ControlPanel title="Animation">
        <div className="space-y-2">
          <Label>Speed: {state.animationSpeed}x</Label>
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

  // Right Sidebar - Presets and History
  const rightSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Presets & History</h2>
      </div>

      <ControlPanel title="Presets" defaultOpen>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start text-left"
                onClick={() => handleLoadPreset(preset.id)}
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

      <ControlPanel title="History">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Past states:</span>
            <span className="text-muted-foreground">{historyInfo.past.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Future states:</span>
            <span className="text-muted-foreground">{historyInfo.future.length}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </Button>
          </div>
        </div>
      </ControlPanel>
    </div>
  );

  // Initialize project
  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Cell Mosaic Project");
    }
  }, []);

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Cell Mosaic Animator (Enhanced)"
          onNew={handleNew}
          onSave={handleSave}
          onExport={handleExport}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={() => canvasControls?.zoomIn()}
          onZoomOut={() => canvasControls?.zoomOut()}
          onFitToScreen={() => canvasControls?.fitToScreen()}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      <InteractiveCanvas
        ref={canvasRef}
        width={800}
        height={600}
        showGrid={true}
        gridSize={20}
        className="w-full h-full"
        onControlsChange={setCanvasControls}
      >
        {renderCanvas}
      </InteractiveCanvas>
    </ToolLayout>
  );
}
