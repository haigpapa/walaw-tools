import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContourType() {
  const { toast } = useToast();
  const [fontSize, setFontSize] = React.useState([72]);
  const [samplePoints, setSamplePoints] = React.useState([100]);

  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Typography Controls</h2>
      </div>
      <ControlPanel title="Text Settings" defaultOpen>
        <div className="space-y-2">
          <Label>Font Size: {fontSize[0]}px</Label>
          <Slider
            value={fontSize}
            onValueChange={setFontSize}
            min={12}
            max={200}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Sample Points: {samplePoints[0]}</Label>
          <Slider
            value={samplePoints}
            onValueChange={setSamplePoints}
            min={10}
            max={500}
            step={10}
          />
        </div>
      </ControlPanel>
      <ControlPanel title="Font">
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">System Fonts</Button>
          <Button variant="outline" className="w-full justify-start">Upload Custom Font</Button>
        </div>
      </ControlPanel>
    </div>
  );

  const rightSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Presets</h2>
      </div>
      <ControlPanel title="Animation Presets" defaultOpen>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">Particle Text</Button>
          <Button variant="outline" className="w-full justify-start">Wave Motion</Button>
          <Button variant="outline" className="w-full justify-start">Explode Effect</Button>
        </div>
      </ControlPanel>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Contour Type Sampler"
          onNew={() => toast({ title: "New Project" })}
          onSave={() => toast({ title: "Saved" })}
          onExport={() => toast({ title: "Export" })}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-orange-500/10">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4"><Type className="h-24 w-24 mx-auto" /></div>
          <h2 className="text-3xl font-bold">Contour Type Sampler</h2>
          <p className="text-muted-foreground max-w-md">
            Transform text into dynamic vector contours with customizable sampling and motion effects.
          </p>
          <div className="mt-6 p-4 bg-card rounded-lg border max-w-sm mx-auto">
            <input
              type="text"
              placeholder="Enter your text..."
              className="w-full bg-transparent text-2xl text-center outline-none"
              defaultValue="HELLO"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
