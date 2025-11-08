import * as React from "react";
import ToolLayout from "@/components/layout/tool-layout";
import Toolbar from "@/components/layout/toolbar";
import ControlPanel from "@/components/layout/control-panel";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CellMosaic() {
  const { toast } = useToast();

  // State for tool parameters
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [gridSize, setGridSize] = React.useState([20]);
  const [cellSize, setCellSize] = React.useState([50]);
  const [threshold, setThreshold] = React.useState([128]);
  const [animationSpeed, setAnimationSpeed] = React.useState([1]);
  const [useLetters, setUseLetters] = React.useState(false);

  // Undo/redo state (placeholder)
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // Handlers
  const handleNew = () => {
    toast({
      title: "New Project",
      description: "Starting fresh canvas...",
    });
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Project saved successfully!",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Choose export format...",
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "Upload Image",
      description: "Select an image file to use as background",
    });
  };

  // Left Sidebar - Tool Controls
  const leftSidebar = (
    <div className="h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Cell Mosaic Controls</h2>
      </div>

      <ControlPanel title="Grid Settings" defaultOpen>
        <div className="space-y-2">
          <Label>Grid Size: {gridSize[0]}</Label>
          <Slider
            value={gridSize}
            onValueChange={setGridSize}
            min={5}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Cell Size: {cellSize[0]}px</Label>
          <Slider
            value={cellSize}
            onValueChange={setCellSize}
            min={10}
            max={200}
            step={5}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Appearance">
        <div className="space-y-2">
          <Label>Threshold: {threshold[0]}</Label>
          <Slider
            value={threshold}
            onValueChange={setThreshold}
            min={0}
            max={255}
            step={1}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="use-letters">Use Letters</Label>
          <Switch
            id="use-letters"
            checked={useLetters}
            onCheckedChange={setUseLetters}
          />
        </div>
      </ControlPanel>

      <ControlPanel title="Animation">
        <div className="space-y-2">
          <Label>Speed: {animationSpeed[0]}x</Label>
          <Slider
            value={animationSpeed}
            onValueChange={setAnimationSpeed}
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
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Classic Mosaic
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Letter Matrix
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Glitch Effect
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Wave Pattern
          </Button>
        </div>
      </ControlPanel>

      <ControlPanel title="Recent Projects">
        <p className="text-sm text-muted-foreground">
          No recent projects yet. Create your first masterpiece!
        </p>
      </ControlPanel>

      <ControlPanel title="History">
        <p className="text-sm text-muted-foreground">
          Undo/redo history will appear here
        </p>
      </ControlPanel>
    </div>
  );

  // Main Canvas
  const canvas = (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-accent/10">
      <div className="text-center space-y-4 p-8">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-3xl font-bold">Cell Mosaic Animator</h2>
        <p className="text-muted-foreground max-w-md">
          Upload an image to start creating animated collages with customizable cells that reveal your background image through light/dark masking.
        </p>
        <Button size="lg" onClick={handleImageUpload}>
          <Upload className="mr-2 h-5 w-5" />
          Upload Image to Begin
        </Button>
        <div className="pt-4 text-sm text-muted-foreground">
          <p>Current settings: {gridSize[0]}x{gridSize[0]} grid, {useLetters ? 'letters' : 'shapes'} mode</p>
        </div>
      </div>
    </div>
  );

  return (
    <ToolLayout
      toolbar={
        <Toolbar
          title="Cell Mosaic Animator"
          onNew={handleNew}
          onSave={handleSave}
          onExport={handleExport}
          onUndo={() => console.log("undo")}
          onRedo={() => console.log("redo")}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={() => console.log("zoom in")}
          onZoomOut={() => console.log("zoom out")}
          onFitToScreen={() => console.log("fit to screen")}
          onHelp={() => console.log("help")}
        />
      }
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
    >
      {canvas}
    </ToolLayout>
  );
}
