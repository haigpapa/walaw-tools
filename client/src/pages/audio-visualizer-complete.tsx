import { useState, useEffect, useRef, useCallback } from "react";
import ToolLayout from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Upload,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Save,
  FolderOpen,
  Settings,
} from "lucide-react";
import P5Canvas from "@/components/canvas/p5-canvas";
import type { P5Instance } from "@/components/canvas/p5-canvas";
import ExportDialog from "@/components/export/export-dialog";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { usePresets } from "@/hooks/use-presets";
import { useProject } from "@/hooks/use-project";

type VisualizerType = "waveform" | "bars" | "circular" | "particles" | "radial";
type ColorScheme = "rainbow" | "monochrome" | "fire" | "ocean" | "neon";

interface AudioVisualizerState {
  visualizerType: VisualizerType;
  colorScheme: ColorScheme;
  sensitivity: number;
  smoothing: number;
  barCount: number;
  particleCount: number;
  lineThickness: number;
  glowIntensity: number;
  mirrorMode: boolean;
  rotationSpeed: number;
  audioSource: "none" | "mic" | "file";
}

const DEFAULT_STATE: AudioVisualizerState = {
  visualizerType: "bars",
  colorScheme: "rainbow",
  sensitivity: 1.5,
  smoothing: 0.8,
  barCount: 64,
  particleCount: 100,
  lineThickness: 2,
  glowIntensity: 0.5,
  mirrorMode: false,
  rotationSpeed: 0,
  audioSource: "none",
};

const DEFAULT_PRESETS = [
  {
    name: "EDM Spectrum",
    data: {
      visualizerType: "bars" as VisualizerType,
      colorScheme: "neon" as ColorScheme,
      sensitivity: 2,
      smoothing: 0.7,
      barCount: 128,
      particleCount: 100,
      lineThickness: 3,
      glowIntensity: 0.8,
      mirrorMode: true,
      rotationSpeed: 0,
      audioSource: "none" as const,
    },
  },
  {
    name: "Ambient Waves",
    data: {
      visualizerType: "waveform" as VisualizerType,
      colorScheme: "ocean" as ColorScheme,
      sensitivity: 1,
      smoothing: 0.9,
      barCount: 64,
      particleCount: 150,
      lineThickness: 2,
      glowIntensity: 0.3,
      mirrorMode: false,
      rotationSpeed: 0.5,
      audioSource: "none" as const,
    },
  },
  {
    name: "Particle Storm",
    data: {
      visualizerType: "particles" as VisualizerType,
      colorScheme: "fire" as ColorScheme,
      sensitivity: 1.8,
      smoothing: 0.6,
      barCount: 64,
      particleCount: 200,
      lineThickness: 1,
      glowIntensity: 0.6,
      mirrorMode: false,
      rotationSpeed: 1,
      audioSource: "none" as const,
    },
  },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
}

export default function AudioVisualizerComplete() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Audio setup
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Visualization state
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef(0);

  const { state, setState, undo, redo, canUndo, canRedo, clear: clearHistory } = useHistory({
    initialState: DEFAULT_STATE,
  });

  const { presets, savePreset, loadPreset, deletePreset } = usePresets({
    toolName: "audio-visualizer",
    defaultPresets: DEFAULT_PRESETS,
  });

  const { project, hasUnsavedChanges, createNew, updateData, save, load, exportToFile } = useProject({
    toolName: "audio-visualizer",
    autoSave: true,
  });

  // Initialize particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: state.particleCount }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 1,
      hue: Math.random() * 360,
      life: 1,
    }));
  }, [state.particleCount]);

  // Update project data when state changes
  useEffect(() => {
    updateData(state);
  }, [state, updateData]);

  // Setup audio context
  const setupAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = state.smoothing;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
  }, [state.smoothing]);

  // Start microphone
  const startMicrophone = useCallback(async () => {
    try {
      setupAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (audioContextRef.current && analyserRef.current) {
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        setState((prev) => ({ ...prev, audioSource: "mic" }));
        toast({
          title: "Microphone Active",
          description: "Audio visualization started",
        });
      }
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  }, [setupAudioContext, setState, toast]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setState((prev) => ({ ...prev, audioSource: "none" }));
  }, [setState]);

  // Load audio file
  const loadAudioFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setupAudioContext();

      // Stop existing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      stopMicrophone();

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.loop = true;
      audioElementRef.current = audio;

      if (audioContextRef.current && analyserRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        audio.play().then(() => {
          setState((prev) => ({ ...prev, audioSource: "file" }));
          toast({
            title: "Audio Loaded",
            description: file.name,
          });
        });
      }
    },
    [setupAudioContext, stopMicrophone, setState, toast]
  );

  // Color scheme helpers
  const getColor = useCallback(
    (index: number, total: number, amplitude: number = 1): string => {
      const schemes = {
        rainbow: (i: number) => `hsl(${(i / total) * 360}, 80%, ${50 + amplitude * 20}%)`,
        monochrome: (i: number) => `hsl(200, 0%, ${30 + amplitude * 50}%)`,
        fire: (i: number) => `hsl(${20 + (i / total) * 40}, 100%, ${40 + amplitude * 30}%)`,
        ocean: (i: number) => `hsl(${180 + (i / total) * 60}, 80%, ${40 + amplitude * 30}%)`,
        neon: (i: number) =>
          `hsl(${[(0, 120, 240, 300)][Math.floor((i / total) * 4)]}, 100%, ${50 + amplitude * 30}%)`,
      };
      return schemes[state.colorScheme](index);
    },
    [state.colorScheme]
  );

  // Draw visualizations
  const draw = useCallback(
    (p5: P5Instance) => {
      if (!analyserRef.current || !dataArrayRef.current) {
        p5.background(20);
        p5.fill(255, 255, 255, 100);
        p5.textAlign("center", "middle");
        p5.textSize(20);
        p5.text("Load audio or enable microphone to start", p5.width / 2, p5.height / 2);
        return;
      }

      // Update smoothing
      analyserRef.current.smoothingTimeConstant = state.smoothing;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Clear background
      p5.background(20);

      // Apply rotation
      if (state.rotationSpeed !== 0) {
        rotationRef.current += state.rotationSpeed * 0.01;
        p5.ctx.save();
        p5.ctx.translate(p5.width / 2, p5.height / 2);
        p5.ctx.rotate(rotationRef.current);
        p5.ctx.translate(-p5.width / 2, -p5.height / 2);
      }

      // Draw based on type
      switch (state.visualizerType) {
        case "waveform":
          drawWaveform(p5, dataArrayRef.current);
          break;
        case "bars":
          drawBars(p5, dataArrayRef.current);
          break;
        case "circular":
          drawCircular(p5, dataArrayRef.current);
          break;
        case "particles":
          drawParticles(p5, dataArrayRef.current);
          break;
        case "radial":
          drawRadial(p5, dataArrayRef.current);
          break;
      }

      if (state.rotationSpeed !== 0) {
        p5.ctx.restore();
      }
    },
    [state]
  );

  const drawWaveform = (p5: P5Instance, dataArray: Uint8Array) => {
    p5.noFill();
    p5.strokeWeight(state.lineThickness);

    const sliceWidth = p5.width / dataArray.length;
    let x = 0;

    // Main waveform
    p5.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] / 255) * state.sensitivity;
      const y = (v * p5.height) / 2 + p5.height / 2;

      const color = getColor(i, dataArray.length, v);
      p5.stroke(color);

      if (i === 0) {
        p5.ctx.moveTo(x, y);
      } else {
        p5.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    p5.ctx.stroke();

    // Mirror mode
    if (state.mirrorMode) {
      p5.ctx.save();
      p5.ctx.scale(1, -1);
      p5.ctx.translate(0, -p5.height);
      p5.ctx.globalAlpha = 0.5;
      p5.beginPath();
      x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] / 255) * state.sensitivity;
        const y = (v * p5.height) / 2 + p5.height / 2;
        const color = getColor(i, dataArray.length, v);
        p5.stroke(color);
        if (i === 0) {
          p5.ctx.moveTo(x, y);
        } else {
          p5.ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      p5.ctx.stroke();
      p5.ctx.restore();
    }
  };

  const drawBars = (p5: P5Instance, dataArray: Uint8Array) => {
    const barWidth = p5.width / state.barCount;
    const step = Math.floor(dataArray.length / state.barCount);

    for (let i = 0; i < state.barCount; i++) {
      const dataIndex = i * step;
      const amplitude = (dataArray[dataIndex] / 255) * state.sensitivity;
      const barHeight = amplitude * p5.height;

      const x = i * barWidth;
      const y = p5.height - barHeight;

      const color = getColor(i, state.barCount, amplitude);
      p5.fill(color);
      p5.noStroke();

      // Glow effect
      if (state.glowIntensity > 0) {
        p5.ctx.shadowBlur = state.glowIntensity * 20;
        p5.ctx.shadowColor = color;
      }

      p5.rect(x, y, barWidth - 2, barHeight);

      // Mirror mode
      if (state.mirrorMode) {
        p5.rect(x, 0, barWidth - 2, barHeight);
      }
    }

    p5.ctx.shadowBlur = 0;
  };

  const drawCircular = (p5: P5Instance, dataArray: Uint8Array) => {
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const radius = Math.min(p5.width, p5.height) * 0.3;
    const step = Math.floor(dataArray.length / state.barCount);

    for (let i = 0; i < state.barCount; i++) {
      const dataIndex = i * step;
      const amplitude = (dataArray[dataIndex] / 255) * state.sensitivity;
      const angle = (i / state.barCount) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + amplitude * 150);
      const y2 = centerY + Math.sin(angle) * (radius + amplitude * 150);

      const color = getColor(i, state.barCount, amplitude);
      p5.stroke(color);
      p5.strokeWeight(state.lineThickness);

      if (state.glowIntensity > 0) {
        p5.ctx.shadowBlur = state.glowIntensity * 15;
        p5.ctx.shadowColor = color;
      }

      p5.line(x1, y1, x2, y2);
    }

    p5.ctx.shadowBlur = 0;
  };

  const drawParticles = (p5: P5Instance, dataArray: Uint8Array) => {
    const particles = particlesRef.current;

    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avgAmplitude = (sum / dataArray.length / 255) * state.sensitivity;

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const freqIndex = Math.floor((i / particles.length) * dataArray.length);
      const amplitude = (dataArray[freqIndex] / 255) * state.sensitivity;

      // Update position
      particle.x += particle.vx + (Math.random() - 0.5) * amplitude * 2;
      particle.y += particle.vy + (Math.random() - 0.5) * amplitude * 2;

      // Wrap around edges
      if (particle.x < 0) particle.x = p5.width;
      if (particle.x > p5.width) particle.x = 0;
      if (particle.y < 0) particle.y = p5.height;
      if (particle.y > p5.height) particle.y = 0;

      // Update size based on amplitude
      const size = particle.size * (1 + amplitude);

      // Draw particle
      const color = getColor(i, particles.length, amplitude);
      p5.fill(color);
      p5.noStroke();

      if (state.glowIntensity > 0) {
        p5.ctx.shadowBlur = state.glowIntensity * 10 * amplitude;
        p5.ctx.shadowColor = color;
      }

      p5.circle(particle.x, particle.y, size);
    }

    p5.ctx.shadowBlur = 0;
  };

  const drawRadial = (p5: P5Instance, dataArray: Uint8Array) => {
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const rings = 8;
    const step = Math.floor(dataArray.length / state.barCount);

    for (let ring = 0; ring < rings; ring++) {
      const radius = (ring / rings) * Math.min(p5.width, p5.height) * 0.4;

      p5.beginPath();
      for (let i = 0; i <= state.barCount; i++) {
        const dataIndex = (i * step) % dataArray.length;
        const amplitude = (dataArray[dataIndex] / 255) * state.sensitivity;
        const angle = (i / state.barCount) * Math.PI * 2;

        const r = radius + amplitude * 50;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          p5.ctx.moveTo(x, y);
        } else {
          p5.ctx.lineTo(x, y);
        }
      }

      const color = getColor(ring, rings, 1);
      p5.stroke(color);
      p5.strokeWeight(state.lineThickness);
      p5.noFill();

      if (state.glowIntensity > 0) {
        p5.ctx.shadowBlur = state.glowIntensity * 10;
        p5.ctx.shadowColor = color;
      }

      p5.ctx.stroke();
    }

    p5.ctx.shadowBlur = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMicrophone]);

  const handleSavePreset = () => {
    const name = prompt("Enter preset name:");
    if (name) {
      savePreset(name, state);
      toast({ title: "Preset Saved", description: name });
    }
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      setState(preset.data);
      toast({ title: "Preset Loaded", description: presetName });
    }
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
    stopMicrophone();
    clearHistory();
  };

  const handleSaveProject = () => {
    save("Audio Visualizer Project");
    toast({ title: "Project Saved" });
  };

  const handleExportProject = () => {
    exportToFile();
    toast({ title: "Project Exported" });
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 border-r pr-2">
        {state.audioSource === "mic" ? (
          <Button variant="destructive" size="sm" onClick={stopMicrophone}>
            <MicOff className="h-4 w-4 mr-1" />
            Stop Mic
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={startMicrophone}>
            <Mic className="h-4 w-4 mr-1" />
            Microphone
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <label>
            <Upload className="h-4 w-4 mr-1" />
            Load Audio
            <input type="file" accept="audio/*" onChange={loadAudioFile} className="hidden" />
          </label>
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
        <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
          <RotateCcw className="h-4 w-4 scale-x-[-1]" />
        </Button>
      </div>

      <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>

      <div className="flex items-center gap-1 border-l pl-2">
        <Button variant="outline" size="sm" onClick={handleSaveProject}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportProject}>
          <FolderOpen className="h-4 w-4 mr-1" />
          Export Project
        </Button>
      </div>

      {hasUnsavedChanges && (
        <span className="text-xs text-muted-foreground ml-2">● Unsaved changes</span>
      )}
    </div>
  );

  const leftSidebar = (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Visualizer
        </h3>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <div className="grid grid-cols-1 gap-1">
              {(["waveform", "bars", "circular", "particles", "radial"] as const).map((type) => (
                <Button
                  key={type}
                  variant={state.visualizerType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setState((prev) => ({ ...prev, visualizerType: type }))}
                  className="justify-start capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Color Scheme</Label>
            <div className="grid grid-cols-1 gap-1">
              {(["rainbow", "monochrome", "fire", "ocean", "neon"] as const).map((scheme) => (
                <Button
                  key={scheme}
                  variant={state.colorScheme === scheme ? "default" : "outline"}
                  size="sm"
                  onClick={() => setState((prev) => ({ ...prev, colorScheme: scheme }))}
                  className="justify-start capitalize"
                >
                  {scheme}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rightSidebar = (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="font-semibold mb-2">Parameters</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Sensitivity: {state.sensitivity.toFixed(1)}</Label>
            <Slider
              value={[state.sensitivity]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, sensitivity: v }))}
              min={0.5}
              max={3}
              step={0.1}
            />
          </div>

          <div>
            <Label className="text-xs">Smoothing: {state.smoothing.toFixed(2)}</Label>
            <Slider
              value={[state.smoothing]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, smoothing: v }))}
              min={0}
              max={0.99}
              step={0.01}
            />
          </div>

          <div>
            <Label className="text-xs">Bar Count: {state.barCount}</Label>
            <Slider
              value={[state.barCount]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, barCount: v }))}
              min={16}
              max={256}
              step={16}
            />
          </div>

          <div>
            <Label className="text-xs">Line Thickness: {state.lineThickness}</Label>
            <Slider
              value={[state.lineThickness]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, lineThickness: v }))}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div>
            <Label className="text-xs">Glow: {state.glowIntensity.toFixed(1)}</Label>
            <Slider
              value={[state.glowIntensity]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, glowIntensity: v }))}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div>
            <Label className="text-xs">Rotation: {state.rotationSpeed.toFixed(1)}</Label>
            <Slider
              value={[state.rotationSpeed]}
              onValueChange={([v]) => setState((prev) => ({ ...prev, rotationSpeed: v }))}
              min={0}
              max={5}
              step={0.1}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs">Mirror Mode</Label>
            <Switch
              checked={state.mirrorMode}
              onCheckedChange={(checked) => setState((prev) => ({ ...prev, mirrorMode: checked }))}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Presets</h3>
        <div className="space-y-1">
          {presets.map((preset) => (
            <div key={preset.name} className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLoadPreset(preset.name)}
                className="flex-1 justify-start text-xs"
              >
                {preset.name}
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleSavePreset} className="w-full text-xs">
            <Save className="h-3 w-3 mr-1" />
            Save Preset
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset All
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ToolLayout toolbar={toolbar} leftSidebar={leftSidebar} rightSidebar={rightSidebar}>
        <P5Canvas draw={draw} ref={canvasRef} />
      </ToolLayout>
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        canvasRef={canvasRef}
        projectName={project?.name || "audio-visualizer"}
      />
    </>
  );
}
