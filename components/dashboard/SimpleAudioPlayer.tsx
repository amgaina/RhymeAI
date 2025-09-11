"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  Loader2,
  FastForward,
  Rewind,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import useAudioPlayer from "@/hooks/useAudioPlayer";

interface SimpleAudioPlayerProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
  segmentId?: number;
}

export default function SimpleAudioPlayer({
  audioUrl,
  title,
  scriptText,
  segmentId,
}: SimpleAudioPlayerProps) {
  // Use our custom hook for audio functionality
  const {
    isPlaying,
    isBrowserTtsPlaying,
    duration,
    currentTime,
    isLoadingUrl,
    urlError,
    audioRef,
    togglePlay,
    handleSeek,
    skipForward,
    skipBackward,
    formatTime,
  } = useAudioPlayer({
    audioUrl,
    scriptText,
    segmentId,
  });

  return (
    <Card className="bg-gray-50 border shadow-sm">
      <CardContent className="p-4">
        {title && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{title}</h3>
              {isLoadingUrl && (
                <span className="text-xs text-amber-500 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </span>
              )}
              {urlError && (
                <span className="text-xs text-red-500">{urlError}</span>
              )}
            </div>
          </div>
        )}

        {scriptText && (
          <div className="mb-4 p-3 bg-white border rounded-md">
            <p className="text-sm text-gray-700">{scriptText}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 mx-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                disabled={!audioRef.current && !isBrowserTtsPlaying}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-500">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioRef.current && !scriptText}
                onClick={skipBackward}
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-9 w-9 rounded-full p-0"
                onClick={togglePlay}
                disabled={isLoadingUrl && !scriptText}
              >
                {isPlaying || isBrowserTtsPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioRef.current && !scriptText}
                onClick={skipForward}
              >
                <FastForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">
                {isPlaying || isBrowserTtsPlaying ? "Playing" : "Paused"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
