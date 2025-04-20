"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  FastForward,
  Rewind,
  Settings,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedAudioPlayerProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
}

export default function EnhancedAudioPlayer({
  audioUrl,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  onNextSegment,
  onPrevSegment,
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    // For demo purposes, we'll use a mock audio
    const audio = new Audio();
    audio.src = audioUrl || "https://example.com/demo-audio.mp3";

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration || 60); // Default to 60s if duration not available
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onNextSegment && segmentIndex < totalSegments - 1) {
        setTimeout(() => onNextSegment(), 500);
      }
    });

    // Apply saved playback rate
    audio.playbackRate = playbackRate;

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [audioUrl, segmentIndex, totalSegments, onNextSegment, playbackRate]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch((e) => console.error("Error playing audio:", e));
    }

    setIsPlaying(!isPlaying);
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;

    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (!audioRef.current) return;

    const newTime = Math.min(audioRef.current.currentTime + 10, duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (!audioRef.current) return;

    const newTime = Math.max(audioRef.current.currentTime - 10, 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    audioRef.current.volume = newVolume / 100;
    setVolume(newVolume);
  };

  // Handle playback rate change
  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return;

    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Format time to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Card className="bg-gray-50 border shadow-sm">
      <CardContent className="p-4">
        {title && (
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {totalSegments > 1 && (
              <span className="text-xs text-gray-500">
                Segment {segmentIndex + 1} of {totalSegments}
              </span>
            )}
          </div>
        )}

        {scriptText && (
          <div className="mb-4 p-3 bg-white border rounded-md">
            <p className="text-sm text-gray-700">{scriptText}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 mx-2">
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                disabled={!audioUrl}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-500">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioUrl || !onPrevSegment}
                onClick={onPrevSegment}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioUrl}
                onClick={skipBackward}
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-9 w-9 rounded-full p-0"
                onClick={togglePlay}
                disabled={!audioUrl}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioUrl}
                onClick={skipForward}
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioUrl || !onNextSegment}
                onClick={onNextSegment}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full p-1 px-2 text-xs flex items-center gap-1"
                    disabled={!audioUrl}
                  >
                    <Settings className="h-3 w-3" />
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => changePlaybackRate(0.5)}>
                    0.5x
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changePlaybackRate(0.75)}>
                    0.75x
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changePlaybackRate(1.0)}>
                    1.0x
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changePlaybackRate(1.25)}>
                    1.25x
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changePlaybackRate(1.5)}>
                    1.5x
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changePlaybackRate(2.0)}>
                    2.0x
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 w-32">
                <Volume2 className="h-4 w-4 text-gray-500" />
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
