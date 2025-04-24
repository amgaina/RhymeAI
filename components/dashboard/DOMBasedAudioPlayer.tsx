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
  Loader2,
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
import useTextToSpeech from "@/hooks/useTextToSpeech";

interface DOMBasedAudioPlayerProps {
  audioUrl?: string | null;
  title?: string;
  scriptText?: string;
  segmentIndex?: number;
  totalSegments?: number;
  segmentId?: number;
  onNextSegment?: () => void;
  onPrevSegment?: () => void;
}

export default function DOMBasedAudioPlayer({
  audioUrl,
  title,
  scriptText,
  segmentIndex = 0,
  totalSegments = 1,
  segmentId,
  onNextSegment,
  onPrevSegment,
}: DOMBasedAudioPlayerProps) {
  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // State for presigned URL
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement>(null);

  // Toast notifications
  const { toast } = useToast();

  // Browser TTS fallback
  const {
    speakText,
    stopSpeaking,
    isPlaying: isBrowserTtsPlaying,
  } = useTextToSpeech();

  // Fetch presigned URL when segmentId or audioUrl changes
  useEffect(() => {
    // Check if we have a segmentId or audioUrl
    if (!segmentId && !audioUrl) {
      console.log("No segmentId or audioUrl provided");
      return;
    }

    // Check if the audioUrl is a full URL or just an S3 key
    const isFullUrl =
      audioUrl &&
      (audioUrl.startsWith("http://") || audioUrl.startsWith("https://"));
    const isS3Key =
      audioUrl &&
      !isFullUrl &&
      (audioUrl.startsWith("audio/") || audioUrl.includes(".mp3"));

    console.log(
      `Audio URL type: ${
        isFullUrl ? "full URL" : isS3Key ? "S3 key" : "unknown"
      }`
    );

    const fetchPresignedUrl = async () => {
      try {
        setIsLoadingUrl(true);
        setUrlError(null);

        // If we have a segmentId, use that to get a presigned URL
        if (segmentId) {
          console.log(`Fetching presigned URL for segment ${segmentId}`);
          const result = await getPresignedAudioUrl(segmentId);

          if (result.success && result.presignedUrl) {
            console.log(
              `Got presigned URL: ${result.presignedUrl.substring(0, 100)}...`
            );
            setPresignedUrl(result.presignedUrl);
            return;
          } else {
            console.error(`Error getting presigned URL: ${result.error}`);
            setUrlError(result.error || "Failed to get presigned URL");

            // Continue to try other methods
          }
        }

        // If we have an S3 key, try to get a presigned URL for it directly
        if (isS3Key) {
          try {
            console.log(`Generating presigned URL for S3 key: ${audioUrl}`);
            // Import the getPresignedUrl function directly
            const { getPresignedUrl } = await import("@/lib/s3-utils");
            const presignedUrl = await getPresignedUrl(audioUrl!, 3600);

            console.log(
              `Got presigned URL for S3 key: ${presignedUrl.substring(
                0,
                100
              )}...`
            );
            setPresignedUrl(presignedUrl);
            return;
          } catch (error) {
            console.error(
              `Error generating presigned URL for S3 key: ${audioUrl}`,
              error
            );
            setUrlError(
              `Failed to generate presigned URL: ${
                error instanceof Error ? error.message : String(error)
              }`
            );

            // Continue to try other methods
          }
        }

        // If we have a full URL, use it directly
        if (isFullUrl) {
          console.log(`Using full URL directly: ${audioUrl}`);
          setPresignedUrl(audioUrl);
          return;
        }

        // If we get here, we couldn't play the audio
        console.error("Could not play audio: no valid URL available");
        setUrlError("Could not play audio: no valid URL available");

        toast({
          title: "Error",
          description: "Could not play audio: no valid URL available",
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
        setUrlError(error instanceof Error ? error.message : "Unknown error");

        // Try with the original URL as fallback if it's a full URL
        if (isFullUrl) {
          console.log(
            `Using original URL as fallback after error: ${audioUrl}`
          );
          setPresignedUrl(audioUrl);
        }
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchPresignedUrl();
  }, [segmentId, audioUrl, toast]);

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
    // If browser TTS is playing, stop it
    if (isBrowserTtsPlaying) {
      stopSpeaking();
      return;
    }

    if (!audioRef.current) {
      console.error("No audio element available");

      // Fall back to browser TTS if script text is available
      if (scriptText) {
        speakText(scriptText, { rate: playbackRate });
      }

      return;
    }

    if (isPlaying) {
      console.log("Pausing audio");
      audioRef.current.pause();
    } else {
      console.log(`Attempting to play audio`);
      audioRef.current.play().catch((e) => {
        console.error("Error playing audio:", e);

        // Fall back to browser TTS if script text is available
        if (scriptText) {
          toast({
            title: "Falling back to browser TTS",
            description: "Using browser's text-to-speech as fallback",
          });
          speakText(scriptText, { rate: playbackRate });
        } else {
          toast({
            title: "Playback Error",
            description: `Error playing audio: ${e.message}`,
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={refreshPresignedUrl}>
                Refresh URL
              </Button>
            ),
          });
        }
      });
    }
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;

    const newTime = value[0];
    const wasPlaying = !audioRef.current.paused;

    // Update the current time
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    // If the audio was playing before seeking, resume playback
    if (wasPlaying) {
      console.log("Resuming playback after seek");
      audioRef.current.play().catch((e) => {
        console.error("Error resuming playback after seek:", e);
        toast({
          title: "Playback Error",
          description: "Failed to resume playback after seeking",
          variant: "destructive",
        });
      });
    }
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.min(audioRef.current.currentTime + 10, duration);

    // Update the current time
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    // If the audio was playing before skipping, ensure it continues playing
    if (wasPlaying) {
      console.log("Resuming playback after skip forward");
      audioRef.current.play().catch((e) => {
        console.error("Error resuming playback after skip forward:", e);
      });
    }
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.max(audioRef.current.currentTime - 10, 0);

    // Update the current time
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    // If the audio was playing before skipping, ensure it continues playing
    if (wasPlaying) {
      console.log("Resuming playback after skip backward");
      audioRef.current.play().catch((e) => {
        console.error("Error resuming playback after skip backward:", e);
      });
    }
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
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  };

  // Format time to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Set up event listeners for the audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleError = (e: Event) => {
      console.error(`Audio loading error:`, e);

      // Get detailed error information
      let errorMessage = "Unknown error";
      let errorCode = "";

      if (audioElement.error) {
        errorMessage = audioElement.error.message || "Unknown error";
        errorCode = audioElement.error.code?.toString() || "";

        // Map error codes to more descriptive messages
        switch (audioElement.error.code) {
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

      console.error(
        `Audio error details: Code ${errorCode}, Message: ${errorMessage}`
      );
      if (audioElement.src) {
        console.error(`Audio URL: ${audioElement.src}`);
      }

      setUrlError(`Error: ${errorMessage}`);

      // Fall back to browser TTS if available
      if (scriptText) {
        toast({
          title: "Falling back to browser TTS",
          description: "Using browser's text-to-speech as fallback",
        });
        speakText(scriptText, { rate: playbackRate });
      } else {
        toast({
          title: "Audio Error",
          description: `Error loading audio: ${errorMessage}`,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={refreshPresignedUrl}>
              Refresh URL
            </Button>
          ),
        });
      }
    };

    const handleLoadedMetadata = () => {
      console.log(`Audio metadata loaded, duration: ${audioElement.duration}s`);
      setDuration(audioElement.duration || 60);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      console.log("Audio playback ended");
      setIsPlaying(false);
      setCurrentTime(0);

      if (onNextSegment && segmentIndex < totalSegments - 1) {
        console.log("Moving to next segment after playback ended");
        setTimeout(() => onNextSegment(), 500);
      }
    };

    const handlePlay = () => {
      console.log("Audio playback started");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("Audio playback paused");
      setIsPlaying(false);
    };

    // Add event listeners
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    // Clean up event listeners on unmount
    return () => {
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [
    onNextSegment,
    playbackRate,
    scriptText,
    segmentIndex,
    toast,
    totalSegments,
  ]);

  // Update audio element when presignedUrl changes
  useEffect(() => {
    if (!audioRef.current || !presignedUrl) return;

    // Set audio properties
    audioRef.current.volume = volume / 100;
    audioRef.current.playbackRate = playbackRate;

    // Set the source
    audioRef.current.src = presignedUrl;
    audioRef.current.load();

    console.log(
      `Updated audio element with URL: ${presignedUrl.substring(0, 100)}...`
    );
  }, [presignedUrl, volume, playbackRate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

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
                      {scriptText && (
                        <DropdownMenuItem
                          onClick={() => {
                            console.log("Using browser TTS as fallback");
                            speakText(scriptText, { rate: playbackRate });
                          }}
                        >
                          Use Browser TTS
                        </DropdownMenuItem>
                      )}
                      {!presignedUrl && !audioUrl && !scriptText && (
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

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          preload="metadata"
          crossOrigin="anonymous"
          style={{ display: "none" }}
        />

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
                disabled={!audioRef.current && !isBrowserTtsPlaying}
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
                disabled={(!audioRef.current && !scriptText) || !onPrevSegment}
                onClick={onPrevSegment}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

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

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 rounded-full p-0"
                disabled={(!audioRef.current && !scriptText) || !onNextSegment}
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
