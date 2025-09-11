"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ChatAudioPlayerProps {
  scriptData: any;
  audioUrls: Record<string, string>;
  onGenerateAudio: (segmentId: string) => void;
}

export function ChatAudioPlayer({
  scriptData,
  audioUrls,
  onGenerateAudio,
}: ChatAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get segments from scriptData
  const segments = scriptData.segments || scriptData.sections || [];
  
  // Get current segment
  const currentSegment = segments[currentSegmentIndex];
  const currentSegmentId = currentSegment?.id || `segment-${currentSegmentIndex}`;
  const currentAudioUrl = audioUrls[currentSegmentId];
  
  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      
      // Add event listeners
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  // Update audio source when segment changes
  useEffect(() => {
    if (audioRef.current && currentAudioUrl) {
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
        startProgressTracking();
      }
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [currentSegmentIndex, currentAudioUrl]);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!currentAudioUrl) {
      // If no audio URL, prompt to generate audio
      onGenerateAudio(currentSegmentId);
      return;
    }
    
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.play();
        startProgressTracking();
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Start tracking progress
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    }, 100);
  };
  
  // Handle audio ended
  const handleAudioEnded = () => {
    // Move to next segment if available
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    } else {
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };
  
  // Handle next/previous segment
  const handlePrevSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setProgress(0);
    }
  };
  
  const handleNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setProgress(0);
    }
  };
  
  // Handle progress change
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">
            {currentSegment?.type || currentSegment?.name || `Segment ${currentSegmentIndex + 1}`}
          </span>
          <span className="text-xs ml-2">
            {currentSegmentIndex + 1}/{segments.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrevSegment}
            disabled={currentSegmentIndex === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant={currentAudioUrl ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              !currentAudioUrl && "text-primary border-primary"
            )}
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : currentAudioUrl ? (
              <Play className="h-4 w-4" />
            ) : (
              <Mic2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNextSegment}
            disabled={currentSegmentIndex === segments.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-10 text-right">
          {formatTime(progress)}
        </span>
        
        <Slider
          value={[progress]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleProgressChange}
          disabled={!currentAudioUrl}
          className="flex-1"
        />
        
        <span className="text-xs text-muted-foreground w-10">
          {formatTime(duration)}
        </span>
        
        <div className="flex items-center gap-1 ml-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
      
      {!currentAudioUrl && (
        <div className="text-xs text-center text-muted-foreground mt-1">
          No audio available for this segment.{" "}
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => onGenerateAudio(currentSegmentId)}
          >
            Generate audio
          </Button>
        </div>
      )}
    </div>
  );
}
