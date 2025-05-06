"use client";
import { useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import useAudioPlayer from "@/hooks/useAudioPlayer"; // Import the hook

interface ImprovedAudioPlayerProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  segmentId?: number;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
}

export default function ImprovedAudioPlayer({
  audioUrl,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  segmentId,
  onNextSegment,
  onPrevSegment,
}: ImprovedAudioPlayerProps) {
  const { toast } = useToast();

  // Use the useAudioPlayer hook, passing the audioUrl as initialUrl
  const {
    isPlaying,
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
    refreshPresignedUrl,
    formatTime,
    audioInitialized,
  } = useAudioPlayer({
    initialUrl: audioUrl,
    audioS3key: segmentId ? `segment-${segmentId}` : null,
    scriptText,
    onNextSegment,
    segmentIndex,
    totalSegments,
  });

  // Handle test URL functionality
  const openUrlInNewTab = (url: string, label: string) => {
    if (!url) {
      toast({
        title: "No URL",
        description: `No ${label} available to test`,
        variant: "destructive",
      });
      return;
    }

    console.log(`Opening ${label} for testing: ${url.substring(0, 100)}...`);
    window.open(url, "_blank");
  };

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
            <div className="flex items-center gap-2">
              {segmentId && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-full"
                    onClick={() => refreshPresignedUrl()}
                    disabled={isLoadingUrl}
                    title="Refresh audio URL"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isLoadingUrl ? "animate-spin" : ""
                      }`}
                    />
                  </Button>

                  {/* URL test dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        title="Test URLs"
                      >
                        Test URL
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          openUrlInNewTab(audioUrl || "", "original URL")
                        }
                      >
                        Test Original URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {totalSegments > 1 && (
                <span className="text-xs text-gray-500">
                  Segment {segmentIndex + 1} of {totalSegments}
                </span>
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
                disabled={!audioInitialized}
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
                disabled={!audioInitialized || !onPrevSegment}
                onClick={onPrevSegment}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioInitialized}
                onClick={skipBackward}
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-9 w-9 rounded-full p-0"
                onClick={togglePlay}
                disabled={isLoadingUrl || !audioInitialized}
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
                disabled={!audioInitialized}
                onClick={skipForward}
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={!audioInitialized || !onNextSegment}
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
                    disabled={!audioInitialized}
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
