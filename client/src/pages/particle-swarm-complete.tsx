import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { P5Canvas, type P5Instance } from "@/components/canvas/p5-canvas";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";
import { useCommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Particle class
class Particle {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  targetX: number;
  targetY: number;
  color: { r: number; g: number; b: number };

  constructor(x: number, y: number, targetX: number, targetY: number, color: { r: number; g: number; b: number }) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
  }

  update(forceStrength: number, maxSpeed: number, friction: number) {
    // Calculate force toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const force = (forceStrength / 100) * 0.5;
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }

    // Apply friction
    this.vx *= friction;
    this.vy *= friction;

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }

  applyMouseForce(mouseX: number, mouseY: number, strength: number, radius: number) {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius && dist > 0) {
      const force = ((radius - dist) / radius) * strength;
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }
  }

  draw(p5: P5Instance, size: number, showTrail: boolean) {
    const { r, g, b } = this.color;
    p5.fill(`rgb(${r},${g},${b})`);
    p5.noStroke();

    if (showTrail && (this.vx !== 0 || this.vy !== 0)) {
      // Draw trail
      p5.stroke(`rgba(${r},${g},${b},0.3)`);
      p5.strokeWeight(size * 0.5);
      p5.line(this.x, this.y, this.x - this.vx * 2, this.y - this.vy * 2);
    }

    p5.circle(this.x, this.y, size);
  }
}

// State interface
interface ParticleSwarmState {
  particleCount: number;
  particleSize: number;
  forceStrength: number;
  maxSpeed: number;
  friction: number;
  mouseForce: number;
  mouseRadius: number;
  showTrails: boolean;
  imageUrl: string | null;
  sampleDensity: number;
}

const defaultState: ParticleSwarmState = {
  particleCount: 2000,
  particleSize: 3,
  forceStrength: 50,
  maxSpeed: 10,
  friction: 0.95,
  mouseForce: 5,
  mouseRadius: 100,
  showTrails: true,
  imageUrl: null,
  sampleDensity: 5,
};

const defaultPresets = [
  {
    id: "gentle",
    name: "Gentle Swarm",
    description: "Slow, smooth movement",
    data: { ...defaultState, forceStrength: 30, maxSpeed: 5, friction: 0.98 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "chaotic",
    name: "Chaotic Energy",
    description: "Fast, energetic particles",
    data: { ...defaultState, forceStrength: 80, maxSpeed: 20, friction: 0.9 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "minimal",
    name: "Minimal Dots",
    description: "Few particles, clean look",
    data: { ...defaultState, particleCount: 500, showTrails: false },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default function ParticleSwarmComplete() {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(true);

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<ParticleSwarmState>({
    initialState: defaultState,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets<ParticleSwarmState>({
    toolName: "particle-swarm",
    defaultPresets,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save: saveProject, exportToFile } = useProject<ParticleSwarmState>({
    toolName: "particle-swarm",
    autoSave: true,
  });

  React.useEffect(() => {
    if (project) updateData(state);
  }, [state]);

  // Create sample image
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 400, 300);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SWARM', 200, 150);

      setState({ ...state, imageUrl: canvas.toDataURL() });
    }
  }, []);

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
          particlesRef.current = []; // Reset particles
          toast({ title: "Image Loaded" });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const resetParticles = React.useCallback((p5: P5Instance, imageUrl: string) => {
    particlesRef.current = [];

    if (!imageRef.current) return;

    const img = imageRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);

    const pixels: { x: number; y: number; color: { r: number; g: number; b: number } }[] = [];

    // Sample pixels
    for (let y = 0; y < img.height; y += state.sampleDensity) {
      for (let x = 0; x < img.width; x += state.sampleDensity) {
        const i = (y * img.width + x) * 4;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness > 50) {
          pixels.push({
            x: (x / img.width) * p5.width,
            y: (y / img.height) * p5.height,
            color: { r, g, b },
          });
        }
      }
    }

    // Create particles from sampled pixels
    const numParticles = Math.min(state.particleCount, pixels.length);
    for (let i = 0; i < numParticles; i++) {
      const pixel = pixels[Math.floor((i / numParticles) * pixels.length)];
      const startX = p5.random(0, p5.width);
      const startY = p5.random(0, p5.height);

      particlesRef.current.push(
        new Particle(startX, startY, pixel.x, pixel.y, pixel.color)
      );
    }
  }, [state.particleCount, state.sampleDensity]);

  const setup = React.useCallback((p5: P5Instance) => {
    p5.background(0);
  }, []);

  const draw = React.useCallback((p5: P5Instance) => {
    p5.background(0, 20); // Fade effect

    const { imageUrl, forceStrength, maxSpeed, friction, mouseForce, mouseRadius, showTrails, particleSize } = state;

    if (!imageUrl) {
      p5.fill(100);
      p5.textSize(24);
      p5.textAlign('center', 'center');
      p5.text('Upload an image to begin', p5.width / 2, p5.height / 2);
      return;
    }

    // Load image
    if (!imageRef.current && imageUrl) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        resetParticles(p5, imageUrl);
      };
      img.src = imageUrl;
      return;
    }

    // Initialize particles if needed
    if (particlesRef.current.length === 0 && imageRef.current) {
      resetParticles(p5, imageUrl);
    }

    // Update and draw particles
    if (isPlaying) {
      particlesRef.current.forEach(particle => {
        particle.update(forceStrength, maxSpeed, friction);

        // Mouse interaction
        if (p5.mouseIsPressed) {
          particle.applyMouseForce(p5.mouseX, p5.mouseY, mouseForce, mouseRadius);
        }

        particle.draw(p5, particleSize, showTrails);
      });
    } else {
      // Just draw without updating
      particlesRef.current.forEach(particle => {
        particle.draw(p5, particleSize, showTrails);
      });
    }

    // Info
    p5.fill(255);
    p5.textSize(12);
    p5.textAlign('left', 'top');
    p5.text(`${particlesRef.current.length} particles | ${isPlaying ? 'Playing' : 'Paused'}`, 10, 10);
  }, [state, isPlaying, resetParticles]);

  const mouseDragged = React.useCallback((p5: P5Instance) => {
    // Mouse interaction is handled in draw loop
  }, []);

  useCommonShortcuts({
    onSave: saveProject,
    onUndo: undo,
    onRedo: redo,
  });

  React.useEffect(() => {
    if (!project) {
      createNew(defaultState, "Particle Swarm Project");
    }
  }, []);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Particle Controls</h2>
      </div>

      <ControlPanel title="Particle Settings" defaultOpen>
        <div className="space-y-2">
          <Label>Particle Count: {state.particleCount}</Label>
          <Slider
            value={[state.particleCount]}
            onValueChange={([v]) => {
              setState({ ...state, particleCount: v });
              particlesRef.current = [];
            }}
            min={100}
            max={5000}
            step={100}
          />
        </div>
        <div className="space-y-2">
          <Label>Particle Size: {state.particleSize}px</Label>
          <Slider
            value={[state.particleSize]}
            onValueChange={([v]) => setState({ ...state, particleSize: v })}
            min={1}
            max={10}
            step={0.5}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Show Trails</Label>
          <Switch
            checked={state.showTrails}
            onCheckedChange={(checked) => setState({ ...state, showTrails: checked })}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Physics">
        <div className="space-y-2">
          <Label>Force Strength: {state.forceStrength}%</Label>
          <Slider
            value={[state.forceStrength]}
            onValueChange={([v]) => setState({ ...state, forceStrength: v })}
            min={0}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Speed: {state.maxSpeed}</Label>
          <Slider
            value={[state.maxSpeed]}
            onValueChange={([v]) => setState({ ...state, maxSpeed: v })}
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
      </ControlPanel>

      <ControlPanel title="Mouse Interaction">
        <div className="space-y-2">
          <Label>Mouse Force: {state.mouseForce}</Label>
          <Slider
            value={[state.mouseForce]}
            onValueChange={([v]) => setState({ ...state, mouseForce: v })}
            min={0}
            max={20}
            step={0.5}
          />
        </div>
        <div className="space-y-2">
          <Label>Mouse Radius: {state.mouseRadius}px</Label>
          <Slider
            value={[state.mouseRadius]}
            onValueChange={([v]) => setState({ ...state, mouseRadius: v })}
            min={50}
            max={300}
            step={10}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Source">
        <Button className="w-full" variant="outline" onClick={handleImageUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        <Button
          className="w-full mt-2"
          variant="outline"
          onClick={() => {
            particlesRef.current = [];
            toast({ title: "Particles Reset" });
          }}
        >
          Reset Particles
        </Button>
      </ControlPanel>

      <ControlPanel title="Playback">
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
                    particlesRef.current = [];
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
          title="Particle Image Swarm"
          onNew={() => {
            if (hasUnsavedChanges && !window.confirm("Discard changes?")) return;
            createNew(defaultState, "New Particle Swarm");
            setState(defaultState);
            particlesRef.current = [];
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
      <div className="w-full h-full flex items-center justify-center bg-black">
        <P5Canvas
          ref={canvasRef}
          width={800}
          height={600}
          setup={setup}
          draw={draw}
          mouseDragged={mouseDragged}
          className="shadow-2xl"
        />
      </div>
    </ToolLayout>
  );
}
