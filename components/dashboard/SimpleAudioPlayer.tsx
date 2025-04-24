"use client";
import { useState, useRef, useEffect } from "react";
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
import { getPresignedAudioUrl } from "@/app/actions/event/get-presigned-url";
import { useToast } from "@/components/ui/use-toast";
import useTextToSpeech from "@/hooks/useTextToSpeech";

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
  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toast notifications
  const { toast } = useToast();

  // Browser TTS fallback
  const {
    speakText,
    stopSpeaking,
    isPlaying: isBrowserTtsPlaying,
  } = useTextToSpeech();

  // Get presigned URL when component mounts
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If we have a segmentId, use that to get a presigned URL
        if (segmentId) {
          console.log(`Fetching presigned URL for segment ${segmentId}`);
          const result = await getPresignedAudioUrl(segmentId);

          if (result.success && result.presignedUrl) {
            console.log(
              `Got presigned URL: ${result.presignedUrl.substring(0, 100)}...`
            );

            // Create a new audio element
            if (audioRef.current) {
              audioRef.current.pause();
            }

            const audio = new Audio(result.presignedUrl);

            // Set up event listeners
            audio.onplay = () => setIsPlaying(true);
            audio.onpause = () => setIsPlaying(false);
            audio.onended = () => {
              setIsPlaying(false);
              setCurrentTime(0);
            };
            audio.ontimeupdate = () => {
              setCurrentTime(audio.currentTime);
            };
            audio.onloadedmetadata = () => {
              setDuration(audio.duration || 0);
              console.log(`Audio duration: ${audio.duration}s`);
            };
            audio.onerror = (e) => {
              console.error("Audio error:", e);
              setError("Error loading audio");

              // Fall back to browser TTS
              if (scriptText) {
                toast({
                  title: "Falling back to browser TTS",
                  description: "Using browser's text-to-speech as fallback",
                });
                speakText(scriptText);
              }
            };

            audioRef.current = audio;
          } else {
            console.error(`Error getting presigned URL: ${result.error}`);
            setError(result.error || "Failed to get presigned URL");

            // Try with the original URL as fallback
            if (audioUrl) {
              console.log(`Using original URL as fallback: ${audioUrl}`);

              const audio = new Audio(audioUrl);

              // Set up event listeners
              audio.onplay = () => setIsPlaying(true);
              audio.onpause = () => setIsPlaying(false);
              audio.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
              };
              audio.ontimeupdate = () => {
                setCurrentTime(audio.currentTime);
              };
              audio.onloadedmetadata = () => {
                setDuration(audio.duration || 0);
                console.log(`Audio duration: ${audio.duration}s`);
              };
              audio.onerror = (e) => {
                console.error("Audio error:", e);
                setError("Error loading audio");

                // Fall back to browser TTS
                if (scriptText) {
                  toast({
                    title: "Falling back to browser TTS",
                    description: "Using browser's text-to-speech as fallback",
                  });
                  speakText(scriptText);
                }
              };

              audioRef.current = audio;
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to get audio URL",
                variant: "destructive",
              });
            }
          }
        } else if (audioUrl) {
          // If we have an audioUrl but no segmentId, use the audioUrl directly
          console.log(`Using audio URL directly: ${audioUrl}`);

          const audio = new Audio(audioUrl);

          // Set up event listeners
          audio.onplay = () => setIsPlaying(true);
          audio.onpause = () => setIsPlaying(false);
          audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
          };
          audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
          };
          audio.onloadedmetadata = () => {
            setDuration(audio.duration || 0);
            console.log(`Audio duration: ${audio.duration}s`);
          };
          audio.onerror = (e) => {
            console.error("Audio error:", e);
            setError("Error loading audio");

            // Fall back to browser TTS
            if (scriptText) {
              toast({
                title: "Falling back to browser TTS",
                description: "Using browser's text-to-speech as fallback",
              });
              speakText(scriptText);
            }
          };

          audioRef.current = audio;
        } else {
          setError("No audio URL available");
        }
      } catch (error) {
        console.error("Error fetching audio:", error);
        setError(error instanceof Error ? error.message : "Unknown error");

        // Fall back to browser TTS
        if (scriptText) {
          toast({
            title: "Falling back to browser TTS",
            description: "Using browser's text-to-speech as fallback",
          });
          speakText(scriptText);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudio();

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopSpeaking();
    };
  }, [segmentId, audioUrl, scriptText, toast, stopSpeaking, speakText]);

  // Handle play/pause
  const handlePlayPause = () => {
    // If browser TTS is playing, stop it
    if (isBrowserTtsPlaying) {
      stopSpeaking();
      return;
    }

    if (!audioRef.current) {
      console.error("No audio element available");

      // Fall back to browser TTS if script text is available
      if (scriptText) {
        speakText(scriptText);
      }

      return;
    }

    if (isPlaying) {
      console.log("Pausing audio");
      audioRef.current.pause();
    } else {
      console.log("Playing audio");
      audioRef.current.play().catch((e) => {
        console.error("Error playing audio:", e);

        // Fall back to browser TTS if script text is available
        if (scriptText) {
          toast({
            title: "Falling back to browser TTS",
            description: "Using browser's text-to-speech as fallback",
          });
          speakText(scriptText);
        } else {
          toast({
            title: "Playback Error",
            description: `Error playing audio: ${e.message}`,
            variant: "destructive",
          });
        }
      });
    }
  };

  // Handle seeking to a specific position
  const handleSeek = (time: number) => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;

    // Update the current time
    audioRef.current.currentTime = time;
    setCurrentTime(time);

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
              {isLoading && (
                <span className="text-xs text-amber-500 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </span>
              )}
              {error && <span className="text-xs text-red-500">{error}</span>}
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
                onValueChange={(values) => handleSeek(values[0])}
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
                onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-9 w-9 rounded-full p-0"
                onClick={handlePlayPause}
                disabled={isLoading && !scriptText}
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
                onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
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
