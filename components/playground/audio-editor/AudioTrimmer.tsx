"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Save,
  Scissors,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AudioTrimmerProps {
  audioUrl: string;
  segmentId: string;
  segmentName: string;
  initialStartTime?: number;
  initialEndTime?: number;
  audioDuration?: number;
  onSave: (segmentId: string, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

export default function AudioTrimmer({
  audioUrl,
  segmentId,
  segmentName,
  initialStartTime = 0,
  initialEndTime,
  audioDuration: propDuration,
  onSave,
  onCancel,
}: AudioTrimmerProps) {
  // Load and set audio duration
  const [audioDuration, setAudioDuration] = useState<number | null>(
    propDuration || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Trim range state
  const [trimRange, setTrimRange] = useState<[number, number]>([
    initialStartTime || 0,
    initialEndTime || propDuration || 30,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Load audio and get duration with better error handling
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // Create new audio element for clean state
    const audio = new Audio();
    audioRef.current = audio;

    console.log("Loading audio from URL:", audioUrl);

    // Set timeout for loading to prevent hanging
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        // If still loading after 8 seconds, use a fallback duration
        console.warn("Audio loading timeout, using fallback duration");
        setAudioDuration(30); // Fallback to 30 seconds
        setIsLoading(false);
        setTrimRange([0, 30]);
      }
    }, 8000);

    // Event handlers
    const handleLoadedMetadata = () => {
      if (!isMounted) return;
      clearTimeout(loadingTimeout);

      console.log("Audio metadata loaded, duration:", audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
        if (!initialEndTime) {
          setTrimRange([initialStartTime || 0, audio.duration]);
        }
      } else {
        setAudioDuration(30); // Fallback if duration is not available or NaN
      }
      setIsLoading(false);
    };

    const handleCanPlayThrough = () => {
      if (!isMounted) return;
      clearTimeout(loadingTimeout);

      console.log("Audio can play through");
      if (isLoading) {
        setIsLoading(false);
      }
    };

    const handleError = (e: ErrorEvent) => {
      if (!isMounted) return;
      clearTimeout(loadingTimeout);

      const errorMessage = `Error loading audio: ${
        e.message || "Unknown error"
      }`;
      console.error(errorMessage, e);
      setLoadError(errorMessage);
      setIsLoading(false);
      toast.error("Failed to load audio file");
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("error", handleError as EventListener);

    // Load may fail if CORS or other issues - add crossorigin attribute
    audio.crossOrigin = "anonymous";

    // Try different methods to load the audio
    try {
      // First attempt with src assignment
      audio.src = audioUrl;
      audio.load();

      // If the audio element doesn't work, try fetch to at least get the content
      if (audioUrl.startsWith("blob:") || audioUrl.startsWith("http")) {
        fetch(audioUrl, { method: "HEAD" })
          .then((response) => {
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const contentLength = response.headers.get("content-length");
            console.log("Audio file content length:", contentLength);
          })
          .catch((err) => {
            console.warn("Fetch HEAD request failed:", err);
          });
      }
    } catch (err) {
      console.error("Error setting audio source:", err);
    }

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("error", handleError as EventListener);
      audio.pause();
      try {
        audio.src = "";
      } catch (e) {
        // Ignore errors when cleaning up
      }
    };
  }, [audioUrl, initialEndTime, initialStartTime]);

  // Update audio playback
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Stop playback when we reach the trim end point
      if (audio.currentTime >= trimRange[1]) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = trimRange[0];
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Set volume
    audio.volume = volume / 100;

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [trimRange, volume]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // If at the end of the trim range, reset to beginning
      if (audioRef.current.currentTime >= trimRange[1]) {
        audioRef.current.currentTime = trimRange[0];
      }
      // If before the trim range, move to the start
      else if (audioRef.current.currentTime < trimRange[0]) {
        audioRef.current.currentTime = trimRange[0];
      }

      audioRef.current.play().catch((error) => {
        toast.error("Failed to play audio");
        console.error("Audio play error:", error);
      });
    }

    setIsPlaying(!isPlaying);
  };

  // Handle seeking
  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Handle saving trim
  const handleSaveTrim = () => {
    onSave(segmentId, trimRange[0], trimRange[1]);
  };

  // Validate trimRange when audioDuration changes
  useEffect(() => {
    if (audioDuration) {
      setTrimRange((prev) => [
        Math.min(prev[0], audioDuration),
        Math.min(prev[1], audioDuration),
      ]);
    }
  }, [audioDuration]);

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Trim Audio: {segmentName}</DialogTitle>
          <DialogDescription>
            Adjust the start and end points of your audio segment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hidden audio element - now handled in the effect */}

          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center bg-accent/10 rounded-md">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading audio file...
              </p>
            </div>
          ) : loadError ? (
            <div className="h-40 flex flex-col items-center justify-center bg-red-50 rounded-md p-4 text-center">
              <p className="text-sm text-red-500 mb-2">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force using default duration
                  setAudioDuration(30);
                  setTrimRange([0, 30]);
                  setLoadError(null);
                }}
              >
                Continue with estimated duration
              </Button>
            </div>
          ) : (
            <>
              {/* Waveform visualization (simplified for now) */}
              <div
                className="h-40 bg-accent/10 rounded-md relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to right, #f0f0f0, #e0e0e0, #f0f0f0)",
                }}
              >
                {/* Trimmed region */}
                <div
                  className="absolute h-full bg-primary/20 border-l border-r border-primary/50"
                  style={{
                    left: `${(trimRange[0] / (audioDuration || 1)) * 100}%`,
                    width: `${
                      ((trimRange[1] - trimRange[0]) / (audioDuration || 1)) *
                      100
                    }%`,
                  }}
                />

                {/* Playhead position */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                  style={{
                    left: `${(currentTime / (audioDuration || 1)) * 100}%`,
                  }}
                />

                {/* Time markers */}
                {audioDuration &&
                  Array.from({
                    length: Math.min(10, Math.ceil(audioDuration)),
                  }).map((_, i) => {
                    const interval =
                      audioDuration / Math.min(10, Math.ceil(audioDuration));
                    const time = i * interval;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-gray-300/50 pointer-events-none"
                        style={{ left: `${(time / audioDuration) * 100}%` }}
                      >
                        <div className="text-xs text-muted-foreground absolute -translate-x-1/2 top-0">
                          {formatTime(time)}
                        </div>
                      </div>
                    );
                  })}

                {/* Click to seek */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    const time = percentage * (audioDuration || 0);
                    handleSeek(time);
                  }}
                />
              </div>

              {/* Trim controls */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Trim Range</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(trimRange[0])} - {formatTime(trimRange[1])}(
                    {(trimRange[1] - trimRange[0]).toFixed(1)}s)
                  </div>
                </div>

                <Slider
                  value={trimRange}
                  min={0}
                  max={audioDuration || 30}
                  step={0.1}
                  onValueChange={(value) => {
                    // Make sure start is before end
                    if (value[0] < value[1]) {
                      setTrimRange([value[0], value[1]]);
                    }
                  }}
                />

                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrimRange([0, trimRange[1]])}
                    >
                      Start at 0:00
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTrimRange([trimRange[0], audioDuration || 30])
                      }
                    >
                      End at {formatTime(audioDuration || 30)}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      className="w-24"
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setVolume(value[0])}
                    />
                  </div>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSeek(trimRange[0])}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button variant="default" size="icon" onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSeek(trimRange[1])}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSaveTrim}
            disabled={isLoading || !!loadError}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Apply Trim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
