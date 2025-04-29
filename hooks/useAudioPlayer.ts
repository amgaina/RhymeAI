import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { getPresignedUrlFromS3Key } from "@/app/actions/audio/get-presigned-url";

interface UseAudioPlayerProps {
  // Only use S3 key as the audio source
  audioS3key?: string | null;

  // Additional props
  scriptText?: string;
  onNextSegment?: () => void;
  segmentIndex?: number;
  totalSegments?: number;
}

export default function useAudioPlayer({
  audioS3key,
  scriptText,
  onNextSegment,
  segmentIndex = 0,
  totalSegments = 1,
}: UseAudioPlayerProps) {
  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // State for audio URL
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

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

  // Initialize audio element with a URL
  const initializeAudio = (url: string) => {
    console.log(`Initializing audio with URL: ${url.substring(0, 100)}...`);

    // Pause and unload any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }

    // Create a new audio element
    const newAudio = new Audio();

    // Set crossOrigin to anonymous to handle CORS issues
    newAudio.crossOrigin = "anonymous";

    // Set audio properties
    newAudio.volume = volume / 100;
    newAudio.playbackRate = playbackRate;

    // IMPORTANT: Do NOT modify the presigned URL - use it exactly as returned
    newAudio.src = url;

    // Add detailed error logging
    newAudio.onerror = (e) => {
      const error = e as ErrorEvent;
      console.error("Audio element error:", error);

      // Get detailed error information
      let errorMessage = "Unknown error";
      let errorCode = "";

      if (newAudio.error) {
        errorCode = newAudio.error.code.toString();
        switch (newAudio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Playback aborted by the user";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error while loading audio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio decoding error";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported or CORS error";
            break;
          default:
            errorMessage = `Unknown error (${newAudio.error.code})`;
        }
      }

      console.error(`Audio error (${errorCode}): ${errorMessage}`);
      console.error(`Audio URL: ${url}`);

      // Immediately try the audio-proxy endpoint for format or CORS issues
      if (audioS3key) {
        console.log(
          "Audio format or CORS issue detected, trying proxy fallback"
        );
        const proxyUrl = `/api/audio-proxy/${encodeURIComponent(audioS3key)}`;
        console.log(`Using proxy URL: ${proxyUrl}`);

        // Create a new audio element for the proxy URL
        const proxyAudio = new Audio();
        proxyAudio.crossOrigin = "anonymous";
        proxyAudio.volume = volume / 100;
        proxyAudio.playbackRate = playbackRate;
        proxyAudio.src = proxyUrl;
        proxyAudio.load();

        // Handle potential proxy errors too
        proxyAudio.onerror = () => {
          console.error("Proxy audio fallback also failed");
          // Fall back to TTS only if both direct and proxy fail
          if (scriptText) {
            toast({
              title: "Audio format issues",
              description: "Falling back to text-to-speech",
            });
            speakText(scriptText, { rate: playbackRate });
          }
        };

        // Replace the current audio element
        audioRef.current = proxyAudio;
      } else if (scriptText) {
        // If no S3 key for proxy or direct access fails
        toast({
          title: "Audio playback issue",
          description: "Using browser text-to-speech as fallback",
        });
        speakText(scriptText, { rate: playbackRate });
      }
    };

    // Load the audio
    newAudio.load();

    // Replace the current audio element
    audioRef.current = newAudio;
  };

  // Fetch presigned URL from S3 key
  const fetchPresignedUrl = async (s3key: string) => {
    try {
      setIsLoadingUrl(true);
      setUrlError(null);

      console.log(`Fetching presigned URL for S3 key: ${s3key}`);
      const result = await getPresignedUrlFromS3Key(s3key);

      console.log(`Result: ${JSON.stringify(result)}`);

      if (result.success && result.url) {
        console.log(`Got presigned URL: ${result.url.substring(0, 100)}...`);
        setPresignedUrl(result.url);

        try {
          // First try with the presigned URL
          initializeAudio(result.url);
        } catch (directError) {
          console.error(
            "Error initializing audio with presigned URL:",
            directError
          );

          // If that fails, try with the proxy endpoint
          console.log("Falling back to audio proxy endpoint");
          const proxyUrl = `/api/audio-proxy/${encodeURIComponent(s3key)}`;
          console.log(`Using proxy URL: ${proxyUrl}`);
          initializeAudio(proxyUrl);
        }
      } else {
        throw new Error(result.error || "Failed to get presigned URL");
      }
    } catch (error) {
      console.error("Error fetching presigned URL:", error);
      setUrlError(error instanceof Error ? error.message : "Unknown error");

      // Fall back to TTS if available
      if (scriptText) {
        toast({
          title: "Audio URL Error",
          description: "Using browser's text-to-speech as fallback",
        });
        speakText(scriptText, { rate: playbackRate });
      }
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Fetch audio URL when audioS3key changes
  useEffect(() => {
    if (!audioS3key) {
      console.log("No S3 key provided");
      return;
    }

    // Create a ref to track the current request
    let isCurrentRequest = true;

    // Store the current audioS3key to prevent stale closures
    const currentKey = audioS3key;

    // Define fetchUrl inside the effect to properly handle cleanup
    const fetchUrl = async () => {
      try {
        setIsLoadingUrl(true);
        setUrlError(null);

        console.log(`Fetching presigned URL for S3 key: ${currentKey}`);
        const result = await getPresignedUrlFromS3Key(currentKey);

        // Only update state if this is still the current request
        if (!isCurrentRequest) {
          console.log(
            "Request cancelled - component updated before completion"
          );
          return;
        }

        if (result.success && result.url) {
          console.log(`Got presigned URL: ${result.url.substring(0, 100)}...`);
          setPresignedUrl(result.url);

          try {
            // First try with the presigned URL
            initializeAudio(result.url);
          } catch (directError) {
            console.error(
              "Error initializing audio with presigned URL:",
              directError
            );

            // If that fails, try with the proxy endpoint
            console.log("Falling back to audio proxy endpoint");
            const proxyUrl = `/api/audio-proxy/${encodeURIComponent(
              currentKey
            )}`;
            console.log(`Using proxy URL: ${proxyUrl}`);
            initializeAudio(proxyUrl);
          }
        } else {
          throw new Error(result.error || "Failed to get presigned URL");
        }
      } catch (error) {
        if (!isCurrentRequest) return;

        console.error("Error fetching presigned URL:", error);
        setUrlError(error instanceof Error ? error.message : "Unknown error");

        // Fall back to TTS if available
        if (scriptText) {
          toast({
            title: "Audio URL Error",
            description: "Using browser's text-to-speech as fallback",
          });
          speakText(scriptText, { rate: playbackRate });
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingUrl(false);
        }
      }
    };

    // Fetch the URL
    fetchUrl();

    // Cleanup function to cancel in-flight requests
    return () => {
      isCurrentRequest = false;
    };
  }, [audioS3key]); // Only audioS3key as dependency - other dependencies handled inside

  // Refresh presigned URL
  const refreshPresignedUrl = async () => {
    if (!audioS3key) {
      toast({
        title: "Error",
        description: "No S3 key available to refresh URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingUrl(true);
      await fetchPresignedUrl(audioS3key);
      toast({
        title: "URL Refreshed",
        description: "Audio URL has been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing URL:", error);
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
    if (isBrowserTtsPlaying) {
      stopSpeaking();
      return;
    }

    if (!audioRef.current) {
      if (scriptText) {
        speakText(scriptText, { rate: playbackRate });
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.error("Error playing audio:", e);
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

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.min(audioRef.current.currentTime + 10, duration);

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.max(audioRef.current.currentTime - 10, 0);

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
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
      console.error("Audio loading error:", e);
      setUrlError("Error loading audio");

      if (scriptText) {
        toast({
          title: "Falling back to browser TTS",
          description: "Using browser's text-to-speech as fallback",
        });
        speakText(scriptText, { rate: playbackRate });
      }
    };

    const handleLoadedMetadata = () => {
      console.log(`Audio metadata loaded, duration: ${audioElement.duration}s`);
      setDuration(audioElement.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      console.log("Audio playback ended");
      setIsPlaying(false);
      setCurrentTime(0);

      if (onNextSegment && segmentIndex < totalSegments - 1) {
        setTimeout(onNextSegment, 500);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
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
    segmentIndex,
    totalSegments,
    scriptText,
    playbackRate,
    speakText,
    toast,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stopSpeaking]);

  return {
    isPlaying,
    isBrowserTtsPlaying,
    duration,
    currentTime,
    volume,
    playbackRate,
    presignedUrl,
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
  };
}
