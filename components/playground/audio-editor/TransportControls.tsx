"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Clock,
  Save,
  Download,
  Upload
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransportControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLooping: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onLoopToggle: () => void;
}

export default function TransportControls({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  isLooping,
  onPlayPause,
  onSeek,
  onPlaybackRateChange,
  onLoopToggle
}: TransportControlsProps) {
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle skip back
  const handleSkipBack = () => {
    onSeek(Math.max(0, currentTime - 5));
  };
  
  // Handle skip forward
  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 5));
  };
  
  // Handle timeline seek
  const handleTimelineSeek = (value: number[]) => {
    onSeek(value[0]);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        {/* Transport buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={handleSkipBack}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            className="h-8 w-8"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={handleSkipForward}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={isLooping ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={onLoopToggle}
          >
            <Repeat className="h-4 w-4" />
          </Button>
          
          <div className="text-sm ml-2">
            <span className="font-mono">{formatTime(currentTime)}</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="font-mono text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Playback rate */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={playbackRate.toString()}
            onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue placeholder="Speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* File operations */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="default" size="sm" className="h-8">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="px-1">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleTimelineSeek}
        />
      </div>
    </div>
  );
}
