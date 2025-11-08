import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ParticleSwarm() {
  const { toast } = useToast();
  const [particleCount, setParticleCount] = React.useState([1000]);
  const [forceStrength, setForceStrength] = React.useState([50]);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Particle Controls</h2>
      </div>
      <ControlPanel title="Particle Settings" defaultOpen>
        <div className="space-y-2">
          <Label>Particle Count: {particleCount[0]}</Label>
          <Slider
            value={particleCount}
            onValueChange={setParticleCount}
            min={100}
            max={10000}
            step={100}
          />
        </div>
        <div className="space-y-2">
          <Label>Force Strength: {forceStrength[0]}%</Label>
          <Slider
            value={forceStrength}
            onValueChange={setForceStrength}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </ControlPanel>
      <ControlPanel title="Source">
        <Button className="w-full" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      </ControlPanel>
    </div>
  );

  const rightSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Presets</h2>
      </div>
      <ControlPanel title="Effect Presets" defaultOpen>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">Swarm Behavior</Button>
          <Button variant="outline" className="w-full justify-start">Gravity Pull</Button>
          <Button variant="outline" className="w-full justify-start">Chaotic Flow</Button>
        </div>
      </ControlPanel>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Particle Image Swarm"
          onNew={() => toast({ title: "New Project" })}
          onSave={() => toast({ title: "Saved" })}
          onExport={() => toast({ title: "Export" })}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-blue-500/10">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4"><Sparkles className="h-24 w-24 mx-auto" /></div>
          <h2 className="text-3xl font-bold">Particle Image Swarm</h2>
          <p className="text-muted-foreground max-w-md">
            Reconstruct images from swarming particles with interactive force fields and mouse control.
          </p>
          <Button size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Upload Image to Begin
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
