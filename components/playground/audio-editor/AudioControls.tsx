"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Save,
  Upload,
  Download,
  Loader2,
} from "lucide-react";

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (volume: number) => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  formatTime: (time: number) => string;
  isLoading: boolean;
}

export default function AudioControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  onSave,
  onImport,
  onExport,
  formatTime,
  isLoading,
}: AudioControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onSkipBack}
          disabled={isLoading}
          title="Skip back 5 seconds"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={onPlayPause}
          disabled={isLoading}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onSkipForward}
          disabled={isLoading}
          title="Skip forward 5 seconds"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-sm ml-2">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="w-32">
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange(value[0])}
            aria-label="Master volume"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onImport}
          disabled={isLoading}
          title="Import project"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onExport}
          disabled={isLoading}
          title="Export audio"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={onSave}
          disabled={isLoading}
          title="Save project"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
