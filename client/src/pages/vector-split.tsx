import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Upload, Waves } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VectorSplit() {
  const { toast } = useToast();
  const [noiseStrength, setNoiseStrength] = React.useState([50]);
  const [duplicates, setDuplicates] = React.useState([5]);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Vector Controls</h2>
      </div>
      <ControlPanel title="Distortion" defaultOpen>
        <div className="space-y-2">
          <Label>Noise Strength: {noiseStrength[0]}%</Label>
          <Slider
            value={noiseStrength}
            onValueChange={setNoiseStrength}
            min={0}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Duplicates: {duplicates[0]}</Label>
          <Slider
            value={duplicates}
            onValueChange={setDuplicates}
            min={1}
            max={20}
            step={1}
          />
        </div>
      </ControlPanel>
      <ControlPanel title="Source">
        <Button className="w-full" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload SVG
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
          <Button variant="outline" className="w-full justify-start">Glitch Wave</Button>
          <Button variant="outline" className="w-full justify-start">Smooth Flow</Button>
          <Button variant="outline" className="w-full justify-start">Spiral Split</Button>
        </div>
      </ControlPanel>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Vector Split & Offset"
          onNew={() => toast({ title: "New Project" })}
          onSave={() => toast({ title: "Saved" })}
          onExport={() => toast({ title: "Export" })}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-green-500/10">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4"><Waves className="h-24 w-24 mx-auto" /></div>
          <h2 className="text-3xl font-bold">Vector Split & Offset</h2>
          <p className="text-muted-foreground max-w-md">
            Import SVG files and create stunning noise-driven animations with duplication and morphing effects.
          </p>
          <Button size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Upload SVG to Begin
          </Button>
        </div>
      </div>
    </ToolLayout>
  );
}
