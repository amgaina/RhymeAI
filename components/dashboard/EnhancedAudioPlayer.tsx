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
  RefreshCw,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPresignedAudioUrl } from "@/app/actions/event/get-presigned-url";
import { useToast } from "@/components/ui/use-toast";

interface EnhancedAudioPlayerProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  segmentId?: number; // Added segmentId for fetching presigned URL
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
}

export default function EnhancedAudioPlayer({
  audioUrl,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  segmentId,
  onNextSegment,
  onPrevSegment,
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Fetch presigned URL when segmentId changes
  useEffect(() => {
    if (!segmentId) return;

    const fetchPresignedUrl = async () => {
      try {
        setIsLoadingUrl(true);
        setUrlError(null);

        console.log(`Fetching presigned URL for segment ${segmentId}`);
        const result = await getPresignedAudioUrl(segmentId);

        if (result.success && result.presignedUrl) {
          console.log(
            `Got presigned URL: ${result.presignedUrl.substring(0, 100)}...`
          );
          setPresignedUrl(result.presignedUrl);
        } else {
          console.error(`Error getting presigned URL: ${result.error}`);
          setUrlError(result.error || "Failed to get presigned URL");
          toast({
            title: "Error",
            description: result.error || "Failed to get presigned URL",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
        setUrlError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchPresignedUrl();
  }, [segmentId, toast]);

  // Initialize audio element
  useEffect(() => {
    // Use presigned URL if available, otherwise fall back to the original URL
    const effectiveUrl = presignedUrl || audioUrl;
    console.log(
      `EnhancedAudioPlayer: Using URL: ${
        effectiveUrl ? effectiveUrl.substring(0, 100) + "..." : "none"
      }`
    );

    if (!effectiveUrl) {
      console.error("No audio URL available");
      setUrlError("No audio URL available");
      return;
    }

    // Clear any previous error
    setUrlError(null);

    // Create a new audio element with the provided URL
    const audio = new Audio();

    // Set crossOrigin to anonymous to handle CORS issues
    audio.crossOrigin = "anonymous";

    // Add error handling for audio loading
    audio.onerror = (e) => {
      // Get detailed error information
      let errorMessage = "Unknown error";
      let errorCode = "";

      if (audio.error) {
        errorMessage = audio.error.message || "Unknown error";
        errorCode = audio.error.code?.toString() || "";

        // Map error codes to more descriptive messages
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Playback aborted by the user";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error occurred while loading the audio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio decoding error";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported";
            break;
        }
      }

      console.error(`Audio loading error:`, e);
      console.error(
        `Audio error details: Code ${errorCode}, Message: ${errorMessage}`
      );
      console.error(`Audio URL: ${effectiveUrl}`);

      // Try to fetch the URL directly to check for CORS or other issues
      fetch(effectiveUrl, {
        method: "HEAD",
        mode: "no-cors", // Use no-cors mode to avoid CORS errors in the test
        cache: "no-cache",
      })
        .then((response) => {
          console.log(
            `Fetch test result: ${response.status} ${response.statusText}`
          );
          if (!response.ok && response.status !== 0) {
            // Status 0 is normal for no-cors mode
            console.error(`URL fetch failed with status: ${response.status}`);
          } else {
            console.log(
              "URL fetch succeeded (or returned opaque response in no-cors mode)"
            );
          }
        })
        .catch((fetchError) => {
          console.error(`Fetch test error:`, fetchError);

          // If we get a CORS error, try to refresh the presigned URL
          if (
            fetchError.message.includes("CORS") ||
            fetchError.message.includes("cors")
          ) {
            console.log(
              "CORS error detected, attempting to refresh presigned URL"
            );
            if (segmentId) {
              refreshPresignedUrl();
            }
          }
        });

      // Check if we're using a presigned URL and have a fallback
      const isUsingPresignedUrl = presignedUrl && presignedUrl === effectiveUrl;
      const hasFallbackUrl = audioUrl && presignedUrl !== audioUrl;

      toast({
        title: "Audio Error",
        description: `Error loading audio: ${errorMessage} (Code: ${errorCode})`,
        variant: "destructive",
        action: (
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={refreshPresignedUrl}>
              Refresh URL
            </Button>
            {isUsingPresignedUrl && hasFallbackUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Try playing with the original URL
                  console.log("Trying original URL as fallback");
                  if (audioRef.current && audioUrl) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.load();
                    audioRef.current.play().catch((e) => {
                      console.error("Error playing with original URL:", e);
                    });
                  }
                }}
              >
                Try Original URL
              </Button>
            )}
          </div>
        ),
      });
    };

    // Log when audio is loading
    audio.onloadstart = () => {
      console.log(
        `Audio started loading from: ${effectiveUrl.substring(0, 100)}...`
      );
    };

    // Log when audio can play
    audio.oncanplay = () => {
      console.log(
        `Audio can now play from: ${effectiveUrl.substring(0, 100)}...`
      );
    };

    console.log(`Setting audio source to presigned URL`);
    audio.src = effectiveUrl;
    audio.load(); // Explicitly load the audio

    audio.addEventListener("loadedmetadata", () => {
      console.log(`Audio metadata loaded, duration: ${audio.duration}s`);
      setDuration(audio.duration || 60); // Default to 60s if duration not available
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      console.log("Audio playback ended");
      setIsPlaying(false);
      setCurrentTime(0);
      if (onNextSegment && segmentIndex < totalSegments - 1) {
        console.log("Moving to next segment after playback ended");
        setTimeout(() => onNextSegment(), 500);
      }
    });

    // Apply saved playback rate
    audio.playbackRate = playbackRate;

    // Set volume
    audio.volume = volume / 100;

    console.log("Audio element created and configured");
    audioRef.current = audio;

    return () => {
      console.log("Cleaning up audio element");
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", () => {});
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
    };
  }, [
    audioUrl,
    presignedUrl,
    segmentIndex,
    totalSegments,
    onNextSegment,
    playbackRate,
    toast,
  ]);

  // Refresh presigned URL
  const refreshPresignedUrl = async () => {
    if (!segmentId) {
      toast({
        title: "Error",
        description: "No segment ID provided",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingUrl(true);
      setUrlError(null);

      console.log(`Refreshing presigned URL for segment ${segmentId}`);
      const result = await getPresignedAudioUrl(segmentId);

      if (result.success && result.presignedUrl) {
        console.log(
          `Got new presigned URL: ${result.presignedUrl.substring(0, 100)}...`
        );
        setPresignedUrl(result.presignedUrl);

        // Update the audio source if it exists
        if (audioRef.current) {
          const wasPlaying = !audioRef.current.paused;
          const currentTime = audioRef.current.currentTime;

          audioRef.current.src = result.presignedUrl;
          audioRef.current.load();

          // Restore playback state
          audioRef.current.currentTime = currentTime;
          if (wasPlaying) {
            audioRef.current.play().catch((e) => {
              console.error("Error resuming playback after URL refresh:", e);
            });
          }
        }

        toast({
          title: "URL Refreshed",
          description: "Audio URL has been refreshed",
        });
      } else {
        console.error(`Error refreshing presigned URL: ${result.error}`);
        setUrlError(result.error || "Failed to refresh presigned URL");
        toast({
          title: "Error",
          description: result.error || "Failed to refresh presigned URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing presigned URL:", error);
      setUrlError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) {
      console.error("No audio element available");
      return;
    }

    console.log(
      `Toggle play: current state is ${isPlaying ? "playing" : "paused"}`
    );

    if (isPlaying) {
      console.log("Pausing audio");
      audioRef.current.pause();
    } else {
      console.log(`Attempting to play audio from: ${audioRef.current.src}`);
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio playback started successfully");
        })
        .catch((e) => {
          console.error("Error playing audio:", e);
          toast({
            title: "Playback Error",
            description: `Error playing audio: ${e.message}`,
            variant: "destructive",
          });

          // If the error is related to the URL expiring, offer to refresh
          if (
            e.message.includes("403") ||
            e.message.includes("forbidden") ||
            e.message.includes("expired")
          ) {
            toast({
              title: "URL May Have Expired",
              description: "Try refreshing the audio URL",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPresignedUrl}
                >
                  Refresh URL
                </Button>
              ),
            });
          }
        });
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
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{title}</h3>
              {isLoadingUrl && (
                <span className="text-xs text-amber-500">Loading URL...</span>
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
                    onClick={refreshPresignedUrl}
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
                      {presignedUrl && (
                        <DropdownMenuItem
                          onClick={() => {
                            console.log(
                              `Opening presigned URL for testing: ${presignedUrl.substring(
                                0,
                                100
                              )}...`
                            );
                            window.open(presignedUrl, "_blank");
                          }}
                        >
                          Test Presigned URL
                        </DropdownMenuItem>
                      )}
                      {audioUrl && (
                        <DropdownMenuItem
                          onClick={() => {
                            console.log(
                              `Opening original URL for testing: ${audioUrl.substring(
                                0,
                                100
                              )}...`
                            );
                            window.open(audioUrl, "_blank");
                          }}
                        >
                          Test Original URL
                        </DropdownMenuItem>
                      )}
                      {!presignedUrl && !audioUrl && (
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "No URL",
                              description: "No audio URL available to test",
                              variant: "destructive",
                            });
                          }}
                        >
                          No URL Available
                        </DropdownMenuItem>
                      )}
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
