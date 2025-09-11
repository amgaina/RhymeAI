"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2,
  Loader2
} from "lucide-react";

interface ChatSegmentPlayerProps {
  audioUrl: string;
  compact?: boolean;
}

export function ChatSegmentPlayer({ 
  audioUrl, 
  compact = true
}: ChatSegmentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoading(false);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    });
    
    // Clean up
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('ended', () => {});
      audio.removeEventListener('error', () => {});
    };
  }, [audioUrl]);
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      audioRef.current.play();
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-center h-8 px-2 bg-muted/30 rounded-md">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
        <span className="text-xs">Loading audio...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="inline-flex items-center justify-center h-8 px-2 bg-destructive/10 text-destructive rounded-md">
        <span className="text-xs">Failed to load audio</span>
      </div>
    );
  }
  
  // Compact version (just play/pause button with minimal controls)
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 h-8 px-2 bg-muted/30 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        
        <div className="w-24 flex-shrink-0">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={(value) => {
              if (!audioRef.current) return;
              const newTime = value[0];
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            aria-label="Seek"
            className="h-1"
          />
        </div>
        
        <span className="text-xs text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }
  
  // Full version with more controls
  return (
    <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-md">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={(value) => {
              if (!audioRef.current) return;
              const newTime = value[0];
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            aria-label="Seek"
          />
        </div>
        
        <div className="text-xs text-muted-foreground w-16 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="w-24">
          <Slider
            value={[audioRef.current?.volume || 1]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => {
              if (!audioRef.current) return;
              const newVolume = value[0];
              audioRef.current.volume = newVolume;
            }}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
