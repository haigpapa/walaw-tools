import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Download, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { exportCanvas, CanvasRecorder, getExportFilename, type ExportFormat } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  projectName?: string;
}

type ExportType = "image" | "video" | "frames";

export default function ExportDialog({
  open,
  onOpenChange,
  canvasRef,
  projectName = "walaw-project",
}: ExportDialogProps) {
  const { toast } = useToast();

  const [exportType, setExportType] = React.useState<ExportType>("image");
  const [imageFormat, setImageFormat] = React.useState<ExportFormat>("png");
  const [quality, setQuality] = React.useState(92);
  const [scale, setScale] = React.useState(1);
  const [transparentBackground, setTransparentBackground] = React.useState(true);
  const [videoDuration, setVideoDuration] = React.useState(5);
  const [videoFPS, setVideoFPS] = React.useState(30);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const recorderRef = React.useRef<CanvasRecorder | null>(null);

  const handleImageExport = async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      const filename = getExportFilename(projectName, imageFormat);
      await exportCanvas(canvasRef.current, filename, {
        format: imageFormat,
        quality: quality / 100,
        backgroundColor: transparentBackground ? "transparent" : "#ffffff",
        scale,
      });

      toast({
        title: "Export Successful",
        description: `Saved as ${filename}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export image",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleVideoStart = async () => {
    if (!canvasRef.current) return;

    setIsRecording(true);
    try {
      recorderRef.current = new CanvasRecorder(canvasRef.current);
      await recorderRef.current.startRecording({
        videoBitsPerSecond: 2500000,
      });

      toast({
        title: "Recording Started",
        description: `Recording for ${videoDuration} seconds...`,
      });

      // Auto-stop after duration
      setTimeout(async () => {
        if (recorderRef.current && isRecording) {
          await handleVideoStop();
        }
      }, videoDuration * 1000);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Failed to start recording",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const handleVideoStop = async () => {
    if (!recorderRef.current) return;

    try {
      const filename = getExportFilename(projectName, "webm" as any);
      await recorderRef.current.stopRecording(filename);

      toast({
        title: "Recording Complete",
        description: `Saved as ${filename}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Failed to save recording",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
      recorderRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Choose export format and quality settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <Label>Export Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={exportType === "image" ? "default" : "outline"}
                onClick={() => setExportType("image")}
                className="justify-start"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Image
              </Button>
              <Button
                variant={exportType === "video" ? "default" : "outline"}
                onClick={() => setExportType("video")}
                className="justify-start"
              >
                <Video className="mr-2 h-4 w-4" />
                Video
              </Button>
            </div>
          </div>

          {/* Image Export Options */}
          {exportType === "image" && (
            <>
              <div className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={imageFormat === "png" ? "default" : "outline"}
                    onClick={() => setImageFormat("png")}
                    size="sm"
                  >
                    PNG
                  </Button>
                  <Button
                    variant={imageFormat === "jpg" ? "default" : "outline"}
                    onClick={() => setImageFormat("jpg")}
                    size="sm"
                  >
                    JPG
                  </Button>
                  <Button
                    variant={imageFormat === "webp" ? "default" : "outline"}
                    onClick={() => setImageFormat("webp")}
                    size="sm"
                  >
                    WebP
                  </Button>
                </div>
              </div>

              {(imageFormat === "jpg" || imageFormat === "webp") && (
                <div className="space-y-2">
                  <Label>Quality: {quality}%</Label>
                  <Slider
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Resolution Scale: {scale}x</Label>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => setScale(v)}
                  min={1}
                  max={4}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  Export at {scale}x resolution (higher = better quality, larger file)
                </p>
              </div>

              {imageFormat === "png" && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="transparent">Transparent Background</Label>
                  <Switch
                    id="transparent"
                    checked={transparentBackground}
                    onCheckedChange={setTransparentBackground}
                  />
                </div>
              )}
            </>
          )}

          {/* Video Export Options */}
          {exportType === "video" && (
            <>
              <div className="space-y-2">
                <Label>Duration: {videoDuration}s</Label>
                <Slider
                  value={[videoDuration]}
                  onValueChange={([v]) => setVideoDuration(v)}
                  min={1}
                  max={60}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Frame Rate: {videoFPS} FPS</Label>
                <Slider
                  value={[videoFPS]}
                  onValueChange={([v]) => setVideoFPS(v)}
                  min={15}
                  max={60}
                  step={5}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Video will be recorded as WebM format. Click "Start Recording" and the animation
                  will be captured for {videoDuration} seconds.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          {exportType === "image" && (
            <Button onClick={handleImageExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Image
                </>
              )}
            </Button>
          )}

          {exportType === "video" && (
            <Button
              onClick={isRecording ? handleVideoStop : handleVideoStart}
              variant={isRecording ? "destructive" : "default"}
              disabled={isExporting}
            >
              {isRecording ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
