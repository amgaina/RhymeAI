"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPreviewProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
}

export default function AudioPreview({
  audioUrl,
  title,
  scriptText,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);

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
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [audioUrl]);

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

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    audioRef.current.volume = newVolume / 100;
    setVolume(newVolume);
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
        {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}

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
                disabled={!audioUrl}
              >
                <SkipBack className="h-4 w-4" />
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
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

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
      </CardContent>
    </Card>
  );
}
