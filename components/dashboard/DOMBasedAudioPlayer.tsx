"use client";
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
  /**
   * The S3 key for the audio file (not a full URL)
   * This should be the key stored in the database (e.g., "audio/event-123/segment-456.mp3")
   */
  audioS3key?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  segmentId?: number;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
  onRefreshUrl?: () => void;
}

export default function DOMBasedAudioPlayer({
  audioS3key,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  segmentId: _segmentId, // Prefix with underscore to indicate it's not used
  onNextSegment,
  onPrevSegment,
  onRefreshUrl,
}: DOMBasedAudioPlayerProps) {
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
  });

  // Handle refresh URL with custom callback if provided
  const handleRefreshUrl = () => {
    if (onRefreshUrl) {
      onRefreshUrl();
    } else {
      defaultRefreshUrl();
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 shadow-md">
      <CardContent className="p-4">
        {title && (
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-indigo-800">{title}</h3>
              {isLoadingUrl && (
                <span className="text-xs text-amber-600 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </span>
              )}
              {urlError && (
                <span className="text-xs text-red-500">{urlError}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {audioS3key && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
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
              {totalSegments > 1 && (
                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  Segment {segmentIndex + 1} of {totalSegments}
                </span>
              )}
            </div>
          </div>
        )}

        {scriptText && (
          <div className="mb-4 p-3 bg-white border border-indigo-100 rounded-md shadow-sm">
            <p className="text-sm text-gray-700">{scriptText}</p>
          </div>
        )}

        {/* Hidden audio element for HTML5 audio API */}
        <audio
          ref={audioRef}
          preload="metadata"
          crossOrigin="anonymous"
          style={{ display: "none" }}
        />

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">
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
            <span className="text-xs font-medium text-indigo-700">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-indigo-700 hover:bg-indigo-100"
                disabled={(!audioRef.current && !scriptText) || !onPrevSegment}
                onClick={onPrevSegment}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-indigo-700 hover:bg-indigo-100"
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
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
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
                className="h-8 w-8 rounded-full p-0 text-indigo-700 hover:bg-indigo-100"
                disabled={!audioRef.current && !scriptText}
                onClick={skipForward}
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-indigo-700 hover:bg-indigo-100"
                disabled={(!audioRef.current && !scriptText) || !onNextSegment}
                onClick={onNextSegment}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full p-1 px-2 text-xs flex items-center gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    disabled={!audioRef.current && !scriptText}
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
                <Volume2 className="h-4 w-4 text-indigo-600" />
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
