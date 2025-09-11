"use client";
import { useCallback, useEffect, useState, memo } from "react";
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
  RefreshCw,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAudioPlayer from "@/hooks/useAudioPlayer";

interface DOMBasedAudioPlayerProps {
  audioS3key?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  segmentId?: number;
  audioUrl?: string | null;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
  onRefreshUrl?: () => void;
}

function DOMBasedAudioPlayer({
  audioS3key,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  segmentId: _segmentId,
  audioUrl,
  onNextSegment,
  onPrevSegment,
  onRefreshUrl,
}: DOMBasedAudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use our custom hook for audio functionality
  const {
    isPlaying,
    isBrowserTtsPlaying,
    duration,
    currentTime,
    volume,
    playbackRate,
    isLoadingUrl,
    urlError,
    audioRef,
    togglePlay,
    handleSeek,
    skipForward,
    skipBackward,
    handleVolumeChange,
    changePlaybackRate,
    refreshPresignedUrl: defaultRefreshUrl,
    formatTime,
  } = useAudioPlayer({
    audioS3key,
    scriptText,
    onNextSegment,
    segmentIndex,
    totalSegments,
    initialUrl: audioUrl, // Pass the presigned URL directly if available
  });

  // Handle refresh URL with custom callback if provided
  const handleRefreshUrl = useCallback(() => {
    if (onRefreshUrl) {
      onRefreshUrl();
    } else {
      defaultRefreshUrl();
    }
  }, [onRefreshUrl, defaultRefreshUrl]);

  // Toggle expanded view
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }
    };
  }, [audioRef]);

  return (
    <Card
      className={`
        fixed bottom-0 left-0 right-0 z-50 shadow-lg
        transition-all duration-300 ease-in-out
        bg-primary-800 text-white border-t border-primary-700
        ${isExpanded ? "max-h-96" : "max-h-24"}
      `}
    >
      <CardContent
        className={`p-3 transition-all duration-300 ${
          isExpanded ? "pb-6" : "pb-3"
        }`}
      >
        {/* Header with title and expand/collapse button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-md">
              {title || "Audio Player"}
            </h3>
            {isLoadingUrl && (
              <span className="text-xs text-amber-300 flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading...
              </span>
            )}
            {urlError && (
              <span className="text-xs text-red-300">{urlError}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {audioS3key && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-full text-primary-200 hover:text-white hover:bg-primary-700"
                onClick={handleRefreshUrl}
                disabled={isLoadingUrl}
                title="Refresh audio URL"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isLoadingUrl ? "animate-spin" : ""
                  }`}
                />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full text-primary-200 hover:text-white hover:bg-primary-700"
              onClick={toggleExpanded}
              title={isExpanded ? "Collapse player" : "Expand player"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {totalSegments > 1 && (
              <span className="text-xs text-primary-100 bg-primary-700 px-2 py-1 rounded-full">
                Segment {segmentIndex + 1} of {totalSegments}
              </span>
            )}
          </div>
        </div>

        {/* Script text (only shown when expanded) */}
        {isExpanded && scriptText && (
          <div className="my-3 p-3 bg-primary-700 border border-primary-600 rounded-md">
            <p className="text-sm text-primary-100 max-h-32 overflow-y-auto">
              {scriptText}
            </p>
          </div>
        )}

        {/* Hidden audio element for HTML5 audio API */}
        <audio
          ref={audioRef}
          preload="metadata"
          crossOrigin="anonymous"
          style={{ display: "none" }}
        />

        <div className="space-y-2">
          {/* Progress bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary-200">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 mx-2">
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                disabled={!audioRef.current && !isBrowserTtsPlaying}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs font-medium text-primary-200">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-primary-200 hover:bg-primary-700 hover:text-white"
                disabled={(!audioRef.current && !scriptText) || !onPrevSegment}
                onClick={onPrevSegment}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-primary-200 hover:bg-primary-700 hover:text-white"
                disabled={!audioRef.current && !scriptText}
                onClick={skipBackward}
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className={`h-10 w-10 rounded-full p-0 ${
                  isPlaying || isBrowserTtsPlaying
                    ? "bg-accent hover:bg-accent/90"
                    : "bg-primary-500 hover:bg-primary-600"
                }`}
                onClick={togglePlay}
                disabled={isLoadingUrl && !scriptText}
              >
                {isPlaying || isBrowserTtsPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-primary-200 hover:bg-primary-700 hover:text-white"
                disabled={!audioRef.current && !scriptText}
                onClick={skipForward}
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-primary-200 hover:bg-primary-700 hover:text-white"
                disabled={(!audioRef.current && !scriptText) || !onNextSegment}
                onClick={onNextSegment}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full p-1 px-2 text-xs flex items-center gap-1 border-primary-600 text-white hover:bg-primary-700"
                    disabled={!audioRef.current && !scriptText}
                  >
                    <Settings className="h-3 w-3" />
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-1 w-24 md:w-32">
                <Volume2 className="h-4 w-4 text-primary-200" />
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

// Memoize component to prevent unnecessary re-renders
export default memo(DOMBasedAudioPlayer);
