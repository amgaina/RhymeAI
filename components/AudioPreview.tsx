"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Waveform } from "./Waveform";
import { getPresignedAudioUrl } from "@/app/actions/event/get-presigned-url";
import { useToast } from "@/components/ui/use-toast";

export interface AudioPreviewProps {
  title: string;
  scriptText: string;
  /**
   * The S3 key for the audio file (not a full URL)
   * This should be the key stored in the database (e.g., "audio/event-123/segment-456.mp3")
   */
  audioS3key?: string | null;
  /**
   * @deprecated Use audioS3key instead
   */
  audioUrl?: string | null | undefined;
  segmentId?: number;
  onTtsPlay?: () => void;
  onTtsStop?: () => void;
  isPlaying?: boolean;
}

export default function AudioPreview({
  title,
  scriptText,
  audioS3key,
  audioUrl, // Kept for backward compatibility
  segmentId,
  onTtsPlay,
  onTtsStop,
  isPlaying: externalIsPlaying,
}: AudioPreviewProps) {
  // For backward compatibility, use audioS3key if provided, otherwise fall back to audioUrl
  const audioKey = audioS3key || audioUrl;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [actualAudioUrl, setActualAudioUrl] = useState<
    string | null | undefined
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Effect to sync with external playing state (for TTS)
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying]);

  // Effect to update actual audio URL when audioKey changes
  useEffect(() => {
    // If we have a segment ID and an S3 key, try to get a presigned URL
    if (segmentId && audioKey && !audioKey.startsWith("http")) {
      refreshPresignedUrl();
    } else {
      // Otherwise, use the audioKey directly (might be a full URL or null)
      setActualAudioUrl(audioKey);
    }
  }, [audioKey, segmentId]);

  // Function to refresh the presigned URL
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
      setIsRefreshing(true);
      setError(null);

      // Get a fresh presigned URL
      const result = await getPresignedAudioUrl(segmentId);

      if (result.success && result.presignedUrl) {
        // Update the audio URL
        setActualAudioUrl(result.presignedUrl);

        toast({
          title: "URL Refreshed",
          description: "Audio URL has been refreshed",
        });

        // If audio was playing, restart it
        if (isPlaying && audioRef.current) {
          const currentPosition = audioRef.current.currentTime;
          audioRef.current.src = result.presignedUrl;
          audioRef.current.currentTime = currentPosition;
          audioRef.current.play().catch(console.error);
        }
      } else {
        setError(result.error || "Failed to refresh URL");
        toast({
          title: "Error",
          description: result.error || "Failed to refresh URL",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error refreshing presigned URL:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Effect to create audio element
  useEffect(() => {
    if (actualAudioUrl && !actualAudioUrl.startsWith("mock-audio-url")) {
      const audio = new Audio(actualAudioUrl);
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

      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        // If we get an error and have a segment ID, try to refresh the URL
        if (segmentId && !isRefreshing) {
          toast({
            title: "Audio Error",
            description: "Trying to refresh the audio URL...",
          });
          refreshPresignedUrl();
        }
      });

      audio.volume = volume;

      return () => {
        audio.pause();
        audio.src = "";
      };
    }

    return undefined;
  }, [actualAudioUrl]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause toggle
  const togglePlayback = async () => {
    // If we have a segment ID but no actual audio URL, try to refresh it first
    if (segmentId && !actualAudioUrl && !isRefreshing) {
      await refreshPresignedUrl();
      return; // Return early and let the user try again after refresh
    }

    if (
      actualAudioUrl?.startsWith("mock-audio-url") &&
      (onTtsPlay || onTtsStop)
    ) {
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
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error("Error playing audio:", err);

          // If we get an error and have a segment ID, try to refresh the URL
          if (segmentId && !isRefreshing) {
            toast({
              title: "Playback Error",
              description: "Trying to refresh the audio URL...",
            });
            await refreshPresignedUrl();
            return; // Return early and let the user try again after refresh
          } else {
            toast({
              title: "Playback Error",
              description:
                err instanceof Error ? err.message : "Failed to play audio",
              variant: "destructive",
            });
          }
        }
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
                  !actualAudioUrl ||
                  (actualAudioUrl.startsWith("mock-audio-url") && !onTtsPlay) ||
                  isRefreshing
                }
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={togglePlayback}
                disabled={(!actualAudioUrl && !onTtsPlay) || isRefreshing}
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
                  !actualAudioUrl ||
                  (actualAudioUrl.startsWith("mock-audio-url") && !onTtsPlay) ||
                  isRefreshing
                }
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {segmentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={refreshPresignedUrl}
                  disabled={isRefreshing}
                  title="Refresh audio URL"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
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

          {error && (
            <div className="text-xs text-destructive mt-1 mb-2">
              Error: {error}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-xs text-primary-foreground/70">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              {actualAudioUrl &&
              !actualAudioUrl.startsWith("mock-audio-url") ? (
                <Waveform duration={duration} currentTime={currentTime} />
              ) : (
                <Slider
                  value={[currentTime]}
                  max={duration || 60} // Use 60 seconds as default for mock audio
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={
                    !actualAudioUrl ||
                    actualAudioUrl.startsWith("mock-audio-url") ||
                    isRefreshing
                  }
                />
              )}
            </div>
            <span className="text-xs text-primary-foreground/70">
              {formatTime(duration || 60)}
            </span>
          </div>

          <div className="pt-1 text-xs text-center text-primary-foreground/70">
            {isRefreshing
              ? "Refreshing audio URL..."
              : actualAudioUrl?.startsWith("mock-audio-url")
              ? "Using text-to-speech preview"
              : actualAudioUrl
              ? "Audio preview"
              : segmentId
              ? "Click refresh to get audio URL"
              : "Generate audio to preview"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
