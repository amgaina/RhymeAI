"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Waveform } from "./Waveform";

export interface AudioPreviewProps {
  title: string;
  scriptText: string;
  audioUrl: string | null | undefined;
  onTtsPlay?: () => void;
  onTtsStop?: () => void;
  isPlaying?: boolean;
}

export default function AudioPreview({
  title,
  scriptText,
  audioUrl,
  onTtsPlay,
  onTtsStop,
  isPlaying: externalIsPlaying,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to sync with external playing state (for TTS)
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying]);

  // Effect to create audio element
  useEffect(() => {
    if (audioUrl && !audioUrl.startsWith("mock-audio-url")) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audio.volume = volume;

      return () => {
        audio.pause();
        audio.src = "";
      };
    }

    return undefined;
  }, [audioUrl]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause toggle
  const togglePlayback = () => {
    if (audioUrl?.startsWith("mock-audio-url") && (onTtsPlay || onTtsStop)) {
      // Use TTS callbacks for mock audio
      if (!isPlaying && onTtsPlay) {
        onTtsPlay();
      } else if (isPlaying && onTtsStop) {
        onTtsStop();
      }
    } else if (audioRef.current) {
      // Use actual audio element
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }

    // Only update internal state if not controlled externally
    if (externalIsPlaying === undefined) {
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Skip forward/backward
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 10,
        0
      );
    }
  };

  // Format time display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-primary/5 rounded-md text-primary-foreground text-sm">
          {scriptText}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={skipBackward}
                disabled={
                  !audioUrl ||
                  (audioUrl.startsWith("mock-audio-url") && !onTtsPlay)
                }
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={togglePlayback}
                disabled={!audioUrl && !onTtsPlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={skipForward}
                disabled={
                  !audioUrl ||
                  (audioUrl.startsWith("mock-audio-url") && !onTtsPlay)
                }
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Volume2 className="h-3 w-3 mr-1 text-primary-foreground/70" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                className="w-16"
                onValueChange={(value) => setVolume(value[0] / 100)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-primary-foreground/70">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              {audioUrl && !audioUrl.startsWith("mock-audio-url") ? (
                <Waveform duration={duration} currentTime={currentTime} />
              ) : (
                <Slider
                  value={[currentTime]}
                  max={duration || 60} // Use 60 seconds as default for mock audio
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={!audioUrl || audioUrl.startsWith("mock-audio-url")}
                />
              )}
            </div>
            <span className="text-xs text-primary-foreground/70">
              {formatTime(duration || 60)}
            </span>
          </div>

          <div className="pt-1 text-xs text-center text-primary-foreground/70">
            {audioUrl?.startsWith("mock-audio-url")
              ? "Using text-to-speech preview"
              : audioUrl
              ? "Audio preview"
              : "Generate audio to preview"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
