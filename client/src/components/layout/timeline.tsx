import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Circle } from "lucide-react";

export interface Keyframe {
  time: number; // 0-1 (percentage of timeline)
  value: any;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

interface TimelineProps {
  duration?: number; // in seconds
  isPlaying: boolean;
  currentTime: number; // in seconds
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onReset?: () => void;
  keyframes?: Keyframe[];
  onKeyframeAdd?: (time: number) => void;
  onKeyframeRemove?: (index: number) => void;
  showKeyframes?: boolean;
  className?: string;
}

/**
 * Timeline component for animation playback control
 *
 * Features:
 * - Play/pause control
 * - Seek bar with scrubbing
 * - Time display
 * - Keyframe markers (optional)
 * - Loop control
 */
export default function Timeline({
  duration = 10,
  isPlaying,
  currentTime,
  onPlayPause,
  onSeek,
  onReset,
  keyframes = [],
  onKeyframeAdd,
  onKeyframeRemove,
  showKeyframes = false,
  className,
}: TimelineProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  const progress = (currentTime / duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(Math.max(0, Math.min(duration, newTime)));
  };

  const handleKeyframeClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onKeyframeRemove) {
      onKeyframeRemove(index);
    }
  };

  const handleAddKeyframe = () => {
    if (onKeyframeAdd) {
      const time = currentTime / duration;
      onKeyframeAdd(time);
    }
  };

  return (
    <div className={cn("bg-card border-t px-4 py-3", className)}>
      <div className="flex items-center gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {onReset && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              title="Reset to start"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSeek(duration)}
            title="Skip to end"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-muted-foreground min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 relative">
          <div
            ref={timelineRef}
            className="h-10 bg-secondary/20 rounded-md cursor-pointer relative overflow-hidden"
            onClick={handleTimelineClick}
          >
            {/* Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-primary/30 transition-all"
              style={{ width: `${progress}%` }}
            />

            {/* Keyframe Markers */}
            {showKeyframes && keyframes.map((keyframe, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 w-1 bg-yellow-500 cursor-pointer hover:bg-yellow-400 group"
                style={{ left: `${keyframe.time * 100}%` }}
                onClick={(e) => handleKeyframeClick(e, index)}
                title={`Keyframe at ${formatTime(keyframe.time * duration)}`}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                  <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                </div>
              </div>
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
              style={{ left: `${progress}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
            </div>

            {/* Time Markers */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground pointer-events-none">
              {Array.from({ length: 11 }).map((_, i) => (
                <span key={i} className="opacity-50">
                  {i === 0 || i === 10 ? formatTime((i / 10) * duration) : '·'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Add Keyframe Button */}
        {showKeyframes && onKeyframeAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddKeyframe}
            title="Add keyframe at current time"
          >
            <Circle className="h-3 w-3 mr-1 fill-current" />
            Add Key
          </Button>
        )}

        {/* Duration Control */}
        <div className="flex items-center gap-2 min-w-[150px]">
          <span className="text-sm text-muted-foreground">Duration:</span>
          <span className="text-sm font-mono">{duration}s</span>
        </div>
      </div>
    </div>
  );
}
