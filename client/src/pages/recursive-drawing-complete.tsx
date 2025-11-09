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
import { Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Fractal types
type FractalType = "tree" | "koch" | "sierpinski" | "dragon" | "lsystem" | "spiral";

// State interface
interface RecursiveDrawingState {
  fractalType: FractalType;
  recursionDepth: number;
  angle: number;
  branchLength: number;
  branchRatio: number;
  strokeWidth: number;
  colorMode: "solid" | "gradient" | "depth";
  primaryColor: string;
  secondaryColor: string;
  animate: boolean;
  animationSpeed: number;
  // L-System specific
  axiom: string;
  rules: string;
  lsystemAngle: number;
}

const defaultState: RecursiveDrawingState = {
  fractalType: "tree",
  recursionDepth: 8,
  angle: 25,
  branchLength: 100,
  branchRatio: 0.67,
  strokeWidth: 2,
  colorMode: "gradient",
  primaryColor: "#4ecdc4",
  secondaryColor: "#ff6b6b",
  animate: true,
  animationSpeed: 1,
  axiom: "F",
  rules: "F=F[+F]F[-F]F",
  lsystemAngle: 25,
};

const defaultPresets = [
  {
    id: "binary-tree",
    name: "Binary Tree",
    description: "Classic recursive tree",
    data: { ...defaultState, fractalType: "tree" as FractalType, recursionDepth: 9, angle: 25 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "koch-snowflake",
    name: "Koch Snowflake",
    description: "Koch curve snowflake",
    data: { ...defaultState, fractalType: "koch" as FractalType, recursionDepth: 5 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "dragon-curve",
    name: "Dragon Curve",
    description: "Heighway dragon fractal",
    data: { ...defaultState, fractalType: "dragon" as FractalType, recursionDepth: 12 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function RecursiveDrawingComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<RecursiveDrawingState>({
    initialState: defaultState,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets<RecursiveDrawingState>({
    toolName: "recursive-drawing",
    defaultPresets,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<RecursiveDrawingState>({
    toolName: "recursive-drawing",
    autoSave: true,
  });

  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  // Recursive tree
  const drawTree = (
    p5: P5Instance,
    depth: number,
    length: number,
    angle: number,
    ratio: number,
    maxDepth: number
  ) => {
    if (depth === 0) return;

    // Color based on depth
    let color = state.primaryColor;
    if (state.colorMode === "gradient") {
      const progress = depth / maxDepth;
      const hue = 120 + progress * 60;
      color = `hsl(${hue}, 70%, 60%)`;
    } else if (state.colorMode === "depth") {
      const brightness = (depth / maxDepth) * 100 + 50;
      color = `hsl(120, 70%, ${brightness}%)`;
    }

    p5.stroke(color);
    p5.strokeWeight(state.strokeWidth * (depth / maxDepth));

    // Draw branch
    p5.line(0, 0, 0, -length);
    p5.translate(0, -length);

    // Left branch
    p5.push();
    p5.rotate(-angle * (p5.PI / 180));
    drawTree(p5, depth - 1, length * ratio, angle, ratio, maxDepth);
    p5.pop();

    // Right branch
    p5.push();
    p5.rotate(angle * (p5.PI / 180));
    drawTree(p5, depth - 1, length * ratio, angle, ratio, maxDepth);
    p5.pop();
  };

  // Koch curve
  const drawKoch = (p5: P5Instance, x1: number, y1: number, x2: number, y2: number, depth: number) => {
    if (depth === 0) {
      p5.line(x1, y1, x2, y2);
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Calculate points
    const x3 = x1 + (dx / 3);
    const y3 = y1 + (dy / 3);
    const x4 = x1 + (dx / 2) - (Math.sqrt(3) / 6) * dist * Math.sin(angle);
    const y4 = y1 + (dy / 2) + (Math.sqrt(3) / 6) * dist * Math.cos(angle);
    const x5 = x1 + (2 * dx / 3);
    const y5 = y1 + (2 * dy / 3);

    // Recursively draw segments
    drawKoch(p5, x1, y1, x3, y3, depth - 1);
    drawKoch(p5, x3, y3, x4, y4, depth - 1);
    drawKoch(p5, x4, y4, x5, y5, depth - 1);
    drawKoch(p5, x5, y5, x2, y2, depth - 1);
  };

  // Sierpinski triangle
  const drawSierpinski = (p5: P5Instance, x: number, y: number, size: number, depth: number) => {
    if (depth === 0) {
      p5.triangle(
        x, y,
        x + size, y,
        x + size / 2, y - (size * Math.sqrt(3)) / 2
      );
      return;
    }

    const newSize = size / 2;
    drawSierpinski(p5, x, y, newSize, depth - 1);
    drawSierpinski(p5, x + newSize, y, newSize, depth - 1);
    drawSierpinski(p5, x + newSize / 2, y - (newSize * Math.sqrt(3)) / 2, newSize, depth - 1);
  };

  // Dragon curve
  const drawDragon = (p5: P5Instance, x1: number, y1: number, x2: number, y2: number, depth: number, sign: number) => {
    if (depth === 0) {
      p5.line(x1, y1, x2, y2);
      return;
    }

    const xm = (x1 + x2) / 2 + sign * (y2 - y1) / 2;
    const ym = (y1 + y2) / 2 - sign * (x2 - x1) / 2;

    drawDragon(p5, x1, y1, xm, ym, depth - 1, 1);
    drawDragon(p5, xm, ym, x2, y2, depth - 1, -1);
  };

  // L-System
  const generateLSystem = (axiom: string, rules: string, iterations: number): string => {
    let result = axiom;

    // Parse rules
    const ruleMap: Record<string, string> = {};
    rules.split(',').forEach(rule => {
      const [from, to] = rule.split('=');
      if (from && to) {
        ruleMap[from.trim()] = to.trim();
      }
    });

    for (let i = 0; i < iterations; i++) {
      let next = '';
      for (const char of result) {
        next += ruleMap[char] || char;
      }
      result = next;
    }

    return result;
  };

  const drawLSystem = (p5: P5Instance, instructions: string, angle: number, length: number) => {
    const stack: Array<{ x: number; y: number; angle: number }> = [];
    let currentAngle = -90; // Start pointing up

    for (const char of instructions) {
      switch (char) {
        case 'F':
          // Draw forward
          const x = length * Math.cos(currentAngle * p5.PI / 180);
          const y = length * Math.sin(currentAngle * p5.PI / 180);
          p5.line(0, 0, x, y);
          p5.translate(x, y);
          break;
        case '+':
          // Turn right
          currentAngle += angle;
          break;
        case '-':
          // Turn left
          currentAngle -= angle;
          break;
        case '[':
          // Save position
          const ctx = (p5 as any).canvas?.getContext('2d');
          if (ctx) {
            ctx.save();
          }
          break;
        case ']':
          // Restore position
          const ctx2 = (p5 as any).canvas?.getContext('2d');
          if (ctx2) {
            ctx2.restore();
          }
          break;
      }
    }
  };

  const setup = React.useCallback((p5: P5Instance) => {
    p5.background(20);
  }, []);

  const draw = React.useCallback((p5: P5Instance) => {
    p5.background(20);

    const {
      fractalType,
      recursionDepth,
      angle,
      branchLength,
      branchRatio,
      strokeWidth,
      colorMode,
      primaryColor,
      secondaryColor,
      animate,
      animationSpeed,
      axiom,
      rules,
      lsystemAngle,
    } = state;

    const time = animate ? p5.frameCount * animationSpeed * 0.1 : 0;
    const animatedDepth = animate ? Math.floor(recursionDepth * (0.5 + 0.5 * Math.sin(time * 0.05))) : recursionDepth;

    p5.stroke(primaryColor);
    p5.strokeWeight(strokeWidth);
    p5.noFill();

    switch (fractalType) {
      case "tree":
        p5.push();
        p5.translate(p5.width / 2, p5.height - 50);
        drawTree(p5, Math.max(1, animatedDepth), branchLength, angle, branchRatio, recursionDepth);
        p5.pop();
        break;

      case "koch":
        p5.push();
        const size = 400;
        const x = p5.width / 2 - size / 2;
        const y = p5.height / 2 + 100;
        drawKoch(p5, x, y, x + size, y, Math.min(animatedDepth, 6));
        drawKoch(p5, x + size, y, x + size / 2, y - size * Math.sqrt(3) / 2, Math.min(animatedDepth, 6));
        drawKoch(p5, x + size / 2, y - size * Math.sqrt(3) / 2, x, y, Math.min(animatedDepth, 6));
        p5.pop();
        break;

      case "sierpinski":
        p5.push();
        p5.fill(primaryColor);
        p5.stroke(primaryColor);
        drawSierpinski(p5, p5.width / 2 - 200, p5.height / 2 + 150, 400, Math.min(animatedDepth, 8));
        p5.pop();
        break;

      case "dragon":
        p5.push();
        p5.translate(p5.width / 3, p5.height / 2);
        drawDragon(p5, 0, 0, 200, 0, Math.min(animatedDepth, 14), 1);
        p5.pop();
        break;

      case "lsystem":
        p5.push();
        p5.translate(p5.width / 2, p5.height - 50);
        const instructions = generateLSystem(axiom, rules, Math.min(animatedDepth, 6));
        drawLSystem(p5, instructions, lsystemAngle, 5);
        p5.pop();
        break;

      case "spiral":
        p5.push();
        p5.translate(p5.width / 2, p5.height / 2);
        let spiralAngle = 0;
        let radius = 1;
        for (let i = 0; i < animatedDepth * 50; i++) {
          const x = radius * Math.cos(spiralAngle);
          const y = radius * Math.sin(spiralAngle);
          p5.point(x, y);
          spiralAngle += 0.1;
          radius += 0.1;
        }
        p5.pop();
        break;
    }

    // Info
    p5.fill(255);
    p5.textSize(12);
    p5.textAlign('left', 'top');
    p5.text(`${fractalType} | depth: ${recursionDepth}`, 10, 10);
  }, [state, drawTree, drawKoch, drawSierpinski, drawDragon, generateLSystem, drawLSystem]);

  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Recursive Drawing Project");
    }
  }, []);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Fractal Controls</h2>
      </div>

      <ControlPanel title="Fractal Type" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {(["tree", "koch", "sierpinski", "dragon", "lsystem", "spiral"] as FractalType[]).map((type) => (
            <Button
              key={type}
              variant={state.fractalType === type ? "default" : "outline"}
              onClick={() => setState({ ...state, fractalType: type })}
              size="sm"
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </ControlPanel>

      <ControlPanel title="Recursion">
        <div className="space-y-2">
          <Label>Depth: {state.recursionDepth}</Label>
          <Slider
            value={[state.recursionDepth]}
            onValueChange={([v]) => setState({ ...state, recursionDepth: v })}
            min={1}
            max={state.fractalType === "dragon" ? 14 : state.fractalType === "lsystem" ? 6 : 12}
            step={1}
          />
        </div>
        {state.fractalType === "tree" && (
          <>
            <div className="space-y-2">
              <Label>Branch Angle: {state.angle}°</Label>
              <Slider
                value={[state.angle]}
                onValueChange={([v]) => setState({ ...state, angle: v })}
                min={0}
                max={90}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Branch Ratio: {(state.branchRatio * 100).toFixed(0)}%</Label>
              <Slider
                value={[state.branchRatio * 100]}
                onValueChange={([v]) => setState({ ...state, branchRatio: v / 100 })}
                min={50}
                max={95}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Branch Length: {state.branchLength}px</Label>
              <Slider
                value={[state.branchLength]}
                onValueChange={([v]) => setState({ ...state, branchLength: v })}
                min={50}
                max={200}
                step={5}
              />
            </div>
          </>
        )}
      </ControlPanel>

      {state.fractalType === "lsystem" && (
        <ControlPanel title="L-System">
          <div className="space-y-2">
            <Label>Axiom (Start)</Label>
            <Input
              value={state.axiom}
              onChange={(e) => setState({ ...state, axiom: e.target.value })}
              placeholder="F"
            />
          </div>
          <div className="space-y-2">
            <Label>Rules (comma separated)</Label>
            <Input
              value={state.rules}
              onChange={(e) => setState({ ...state, rules: e.target.value })}
              placeholder="F=F[+F]F[-F]F"
            />
          </div>
          <div className="space-y-2">
            <Label>Angle: {state.lsystemAngle}°</Label>
            <Slider
              value={[state.lsystemAngle]}
              onValueChange={([v]) => setState({ ...state, lsystemAngle: v })}
              min={5}
              max={90}
              step={1}
            />
          </div>
          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <p className="font-semibold mb-1">L-System Syntax:</p>
            <p>F = draw forward</p>
            <p>+ = turn right</p>
            <p>- = turn left</p>
            <p>[ = save position</p>
            <p>] = restore position</p>
          </div>
        </ControlPanel>
      )}

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
          <Label>Color Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["solid", "gradient", "depth"] as const).map((mode) => (
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

      <ControlPanel title="Animation">
        <div className="flex items-center justify-between">
          <Label>Animate Depth</Label>
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

      <ControlPanel title="Examples">
        <div className="text-xs space-y-2">
          <p className="font-semibold">Popular L-Systems:</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => setState({ ...state, axiom: "F", rules: "F=F[+F]F[-F]F", lsystemAngle: 25 })}
          >
            Plant 1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => setState({ ...state, axiom: "F", rules: "F=FF+[+F-F-F]-[-F+F+F]", lsystemAngle: 22.5 })}
          >
            Plant 2
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => setState({ ...state, axiom: "F", rules: "F=F+F--F+F", lsystemAngle: 60 })}
          >
            Koch
          </Button>
        </div>
      </ControlPanel>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Recursive Drawing Machine"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Fractal");
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
