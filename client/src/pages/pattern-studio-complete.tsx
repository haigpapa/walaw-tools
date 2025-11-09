import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { P5Canvas, type P5Instance } from "@/components/canvas/p5-canvas";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Trash2, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Pattern types
type PatternType = "truchet" | "islamic" | "celtic" | "flowfield" | "dots" | "waves";
type SymmetryType = "none" | "mirror-h" | "mirror-v" | "mirror-both" | "rotate-2" | "rotate-4";

// State interface
interface PatternStudioState {
  patternType: PatternType;
  symmetryType: SymmetryType;
  tileSize: number;
  gridCols: number;
  gridRows: number;
  complexity: number;
  randomSeed: number;
  colorMode: "mono" | "gradient" | "palette";
  primaryColor: string;
  secondaryColor: string;
  lineWidth: number;
  animate: boolean;
  animationSpeed: number;
}

const defaultState: PatternStudioState = {
  patternType: "truchet",
  symmetryType: "mirror-both",
  tileSize: 40,
  gridCols: 20,
  gridRows: 15,
  complexity: 50,
  randomSeed: 12345,
  colorMode: "gradient",
  primaryColor: "#4ecdc4",
  secondaryColor: "#ff6b6b",
  lineWidth: 2,
  animate: true,
  animationSpeed: 1,
};

const defaultPresets = [
  {
    id: "classic-truchet",
    name: "Classic Truchet",
    description: "Traditional truchet tiles",
    data: { ...defaultState, patternType: "truchet" as PatternType, symmetryType: "mirror-both" as SymmetryType },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "islamic-geometry",
    name: "Islamic Geometry",
    description: "Sacred geometry patterns",
    data: { ...defaultState, patternType: "islamic" as PatternType, complexity: 70, symmetryType: "rotate-4" as SymmetryType },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "flowing-field",
    name: "Flow Field",
    description: "Organic flowing patterns",
    data: { ...defaultState, patternType: "flowfield" as PatternType, complexity: 80, animate: true },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function PatternStudioComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<PatternStudioState>({
    initialState: defaultState,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets<PatternStudioState>({
    toolName: "pattern-studio",
    defaultPresets,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<PatternStudioState>({
    toolName: "pattern-studio",
    autoSave: true,
  });

  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  // Seeded random number generator
  const seededRandom = React.useCallback((seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }, []);

  // Draw truchet tiles
  const drawTruchetTile = (p5: P5Instance, x: number, y: number, size: number, variant: number, color: string) => {
    p5.push();
    p5.translate(x, y);
    p5.stroke(color);
    p5.strokeWeight(state.lineWidth);
    p5.noFill();

    const rotation = Math.floor(variant * 4) % 4;
    p5.rotate((rotation * p5.PI) / 2);

    // Draw arc
    if (variant % 2 < 1) {
      p5.arc(0, 0, size, size, 0, p5.HALF_PI);
      p5.arc(size, size, size, size, p5.PI, p5.PI + p5.HALF_PI);
    } else {
      p5.arc(size, 0, size, size, p5.HALF_PI, p5.PI);
      p5.arc(0, size, size, size, -p5.HALF_PI, 0);
    }

    p5.pop();
  };

  // Draw islamic pattern tile
  const drawIslamicTile = (p5: P5Instance, x: number, y: number, size: number, variant: number, color: string) => {
    p5.push();
    p5.translate(x + size / 2, y + size / 2);
    p5.stroke(color);
    p5.strokeWeight(state.lineWidth);
    p5.noFill();

    const sides = 6 + Math.floor(variant * 2);
    const radius = size / 2;

    // Draw polygon
    p5.beginPath?.();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * p5.TWO_PI;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        (p5 as any).canvas?.getContext('2d')?.moveTo(px, py);
      } else {
        (p5 as any).canvas?.getContext('2d')?.lineTo(px, py);
      }
    }
    (p5 as any).canvas?.getContext('2d')?.stroke();

    // Inner star
    const innerRadius = radius * 0.5;
    p5.beginPath?.();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * p5.TWO_PI;
      const px = Math.cos(angle) * innerRadius;
      const py = Math.sin(angle) * innerRadius;
      if (i === 0) {
        (p5 as any).canvas?.getContext('2d')?.moveTo(px, py);
      } else {
        (p5 as any).canvas?.getContext('2d')?.lineTo(px, py);
      }
    }
    (p5 as any).canvas?.getContext('2d')?.stroke();

    p5.pop();
  };

  // Draw flow field tile
  const drawFlowFieldTile = (p5: P5Instance, x: number, y: number, size: number, variant: number, time: number, color: string) => {
    p5.push();
    p5.translate(x, y);
    p5.stroke(color);
    p5.strokeWeight(state.lineWidth * 0.5);
    p5.noFill();

    const steps = 10;
    let px = size / 2;
    let py = size / 2;

    p5.beginPath?.();
    const ctx = (p5 as any).canvas?.getContext('2d');
    ctx?.moveTo(px, py);

    for (let i = 0; i < steps; i++) {
      const angle = p5.noise(px * 0.01, py * 0.01, variant + time * 0.001) * p5.TWO_PI * 2;
      px += Math.cos(angle) * (size / steps);
      py += Math.sin(angle) * (size / steps);
      ctx?.lineTo(px, py);
    }
    ctx?.stroke();

    p5.pop();
  };

  // Draw dot pattern
  const drawDotTile = (p5: P5Instance, x: number, y: number, size: number, variant: number, color: string) => {
    p5.push();
    p5.translate(x, y);
    p5.fill(color);
    p5.noStroke();

    const dotSize = (size / 4) * (0.5 + variant * 0.5);
    p5.circle(size / 2, size / 2, dotSize);

    p5.pop();
  };

  // Draw wave pattern
  const drawWaveTile = (p5: P5Instance, x: number, y: number, size: number, variant: number, time: number, color: string) => {
    p5.push();
    p5.translate(x, y);
    p5.stroke(color);
    p5.strokeWeight(state.lineWidth);
    p5.noFill();

    const amplitude = size / 4;
    const frequency = 2 + variant * 2;

    p5.beginPath?.();
    const ctx = (p5 as any).canvas?.getContext('2d');
    for (let i = 0; i <= size; i += 2) {
      const py = size / 2 + Math.sin((i / size) * frequency * p5.TWO_PI + time * 0.001) * amplitude;
      if (i === 0) {
        ctx?.moveTo(i, py);
      } else {
        ctx?.lineTo(i, py);
      }
    }
    ctx?.stroke();

    p5.pop();
  };

  const setup = React.useCallback((p5: P5Instance) => {
    p5.background(20);
  }, []);

  const draw = React.useCallback((p5: P5Instance) => {
    p5.background(20);

    const {
      patternType,
      symmetryType,
      tileSize,
      gridCols,
      gridRows,
      complexity,
      randomSeed,
      colorMode,
      primaryColor,
      secondaryColor,
      lineWidth,
      animate,
      animationSpeed,
    } = state;

    const time = animate ? p5.frameCount * animationSpeed : 0;

    // Draw pattern grid
    for (let col = 0; col < gridCols; col++) {
      for (let row = 0; row < gridRows; row++) {
        const x = col * tileSize;
        const y = row * tileSize;

        // Seeded random for this tile
        const tileIndex = row * gridCols + col;
        const variant = seededRandom(randomSeed + tileIndex);

        // Color
        let color = primaryColor;
        if (colorMode === "gradient") {
          const progress = (col + row) / (gridCols + gridRows);
          const hue = 180 + progress * 60;
          color = `hsl(${hue}, 70%, 60%)`;
        } else if (colorMode === "palette") {
          color = variant > 0.5 ? primaryColor : secondaryColor;
        }

        // Apply symmetry
        const shouldDraw =
          symmetryType === "none" ||
          (symmetryType === "mirror-h" && col < gridCols / 2) ||
          (symmetryType === "mirror-v" && row < gridRows / 2) ||
          (symmetryType === "mirror-both" && col < gridCols / 2 && row < gridRows / 2) ||
          (symmetryType === "rotate-2" && (col + row) % 2 === 0) ||
          (symmetryType === "rotate-4" && (col + row) % 4 === 0);

        if (shouldDraw || symmetryType === "none") {
          // Draw tile based on pattern type
          switch (patternType) {
            case "truchet":
              drawTruchetTile(p5, x, y, tileSize, variant, color);
              break;
            case "islamic":
              drawIslamicTile(p5, x, y, tileSize, variant, color);
              break;
            case "flowfield":
              drawFlowFieldTile(p5, x, y, tileSize, variant, time, color);
              break;
            case "dots":
              drawDotTile(p5, x, y, tileSize, variant, color);
              break;
            case "waves":
              drawWaveTile(p5, x, y, tileSize, variant, time, color);
              break;
          }
        }

        // Mirror if needed
        if (symmetryType.includes("mirror")) {
          if (symmetryType === "mirror-h" || symmetryType === "mirror-both") {
            const mirrorX = (gridCols - 1 - col) * tileSize;
            if (col < gridCols / 2) {
              switch (patternType) {
                case "truchet":
                  drawTruchetTile(p5, mirrorX, y, tileSize, variant, color);
                  break;
                case "islamic":
                  drawIslamicTile(p5, mirrorX, y, tileSize, variant, color);
                  break;
                case "flowfield":
                  drawFlowFieldTile(p5, mirrorX, y, tileSize, variant, time, color);
                  break;
                case "dots":
                  drawDotTile(p5, mirrorX, y, tileSize, variant, color);
                  break;
                case "waves":
                  drawWaveTile(p5, mirrorX, y, tileSize, variant, time, color);
                  break;
              }
            }
          }

          if (symmetryType === "mirror-v" || symmetryType === "mirror-both") {
            const mirrorY = (gridRows - 1 - row) * tileSize;
            if (row < gridRows / 2) {
              switch (patternType) {
                case "truchet":
                  drawTruchetTile(p5, x, mirrorY, tileSize, variant, color);
                  break;
                case "islamic":
                  drawIslamicTile(p5, x, mirrorY, tileSize, variant, color);
                  break;
                case "flowfield":
                  drawFlowFieldTile(p5, x, mirrorY, tileSize, variant, time, color);
                  break;
                case "dots":
                  drawDotTile(p5, x, mirrorY, tileSize, variant, color);
                  break;
                case "waves":
                  drawWaveTile(p5, x, mirrorY, tileSize, variant, time, color);
                  break;
              }
            }
          }

          if (symmetryType === "mirror-both" && col < gridCols / 2 && row < gridRows / 2) {
            const mirrorX = (gridCols - 1 - col) * tileSize;
            const mirrorY = (gridRows - 1 - row) * tileSize;
            switch (patternType) {
              case "truchet":
                drawTruchetTile(p5, mirrorX, mirrorY, tileSize, variant, color);
                break;
              case "islamic":
                drawIslamicTile(p5, mirrorX, mirrorY, tileSize, variant, color);
                break;
              case "flowfield":
                drawFlowFieldTile(p5, mirrorX, mirrorY, tileSize, variant, time, color);
                break;
              case "dots":
                drawDotTile(p5, mirrorX, mirrorY, tileSize, variant, color);
                break;
              case "waves":
                drawWaveTile(p5, mirrorX, mirrorY, tileSize, variant, time, color);
                break;
            }
          }
        }
      }
    }

    // Info
    p5.fill(255);
    p5.textSize(12);
    p5.textAlign('left', 'top');
    p5.text(`${patternType} | ${gridCols}x${gridRows} | seed: ${randomSeed}`, 10, 10);
  }, [state, seededRandom]);

  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Pattern Studio Project");
    }
  }, []);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Pattern Controls</h2>
      </div>

      <ControlPanel title="Pattern Type" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {(["truchet", "islamic", "flowfield", "dots", "waves"] as PatternType[]).map((type) => (
            <Button
              key={type}
              variant={state.patternType === type ? "default" : "outline"}
              onClick={() => setState({ ...state, patternType: type })}
              size="sm"
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </ControlPanel>

      <ControlPanel title="Symmetry">
        <div className="grid grid-cols-2 gap-2">
          {(["none", "mirror-h", "mirror-v", "mirror-both"] as SymmetryType[]).map((type) => (
            <Button
              key={type}
              variant={state.symmetryType === type ? "default" : "outline"}
              onClick={() => setState({ ...state, symmetryType: type })}
              size="sm"
              className="text-xs"
            >
              {type.replace("-", " ")}
            </Button>
          ))}
        </div>
      </ControlPanel>

      <ControlPanel title="Grid">
        <div className="space-y-2">
          <Label>Tile Size: {state.tileSize}px</Label>
          <Slider
            value={[state.tileSize]}
            onValueChange={([v]) => setState({ ...state, tileSize: v, gridCols: Math.floor(800 / v), gridRows: Math.floor(600 / v) })}
            min={20}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Complexity: {state.complexity}%</Label>
          <Slider
            value={[state.complexity]}
            onValueChange={([v]) => setState({ ...state, complexity: v })}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Styling">
        <div className="space-y-2">
          <Label>Line Width: {state.lineWidth}px</Label>
          <Slider
            value={[state.lineWidth]}
            onValueChange={([v]) => setState({ ...state, lineWidth: v })}
            min={0.5}
            max={10}
            step={0.5}
          />
        </div>
        <div className="space-y-2">
          <Label>Color Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["mono", "gradient", "palette"] as const).map((mode) => (
              <Button
                key={mode}
                variant={state.colorMode === mode ? "default" : "outline"}
                onClick={() => setState({ ...state, colorMode: mode })}
                size="sm"
                className="capitalize text-xs"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </ControlPanel>

      <ControlPanel title="Randomization">
        <div className="space-y-2">
          <Label>Seed: {state.randomSeed}</Label>
          <div className="flex gap-2">
            <Slider
              value={[state.randomSeed]}
              onValueChange={([v]) => setState({ ...state, randomSeed: v })}
              min={1}
              max={99999}
              step={1}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setState({ ...state, randomSeed: Math.floor(Math.random() * 99999) })}
              title="Randomize seed"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ControlPanel>

      <ControlPanel title="Animation">
        <div className="flex items-center justify-between">
          <Label>Animate</Label>
          <Switch
            checked={state.animate}
            onCheckedChange={(checked) => setState({ ...state, animate: checked })}
          />
        </div>
        {state.animate && (
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
        )}
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
          title="Generative Pattern Studio"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Pattern");
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-yellow-900/20">
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
