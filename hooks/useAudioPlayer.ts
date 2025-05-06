import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getPresignedUrlFromS3Key } from "@/app/actions/audio/get-presigned-url";

interface UseAudioPlayerProps {
  audioS3key?: string | null;
  scriptText?: string;
  onNextSegment?: () => void;
  segmentIndex?: number;
  totalSegments?: number;
  initialUrl?: string | null;
}

export default function useAudioPlayer({
  audioS3key,
  scriptText,
  onNextSegment,
  segmentIndex = 0,
  totalSegments = 1,
  initialUrl = null,
}: UseAudioPlayerProps) {
  // Core audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialUrl);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize audio with a URL
  const initializeAudio = useCallback(
    (url: string) => {
      if (!url) {
        console.error("Cannot initialize audio with empty URL");
        return false;
      }

      console.log(`Initializing audio with URL: ${url.substring(0, 100)}...`);

      try {
        // Clean up existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          try {
            audioRef.current.load();
          } catch (e) {
            console.log("Ignoring load error during cleanup");
          }
        }

        // Create new audio element
        const newAudio = new Audio();
        newAudio.crossOrigin = "anonymous";
        newAudio.preload = "auto";

        // Set up event listeners
        newAudio.addEventListener("error", (e) => {
          console.error("Audio element error event:", e);
          toast({
            title: "Audio Error",
            description: "Unable to play audio",
            variant: "destructive",
          });
        });

        newAudio.addEventListener("loadedmetadata", () => {
          console.log(`Audio metadata loaded, duration: ${newAudio.duration}s`);
          setDuration(newAudio.duration || 0);
          setAudioInitialized(true);
        });

        // Set audio properties
        newAudio.volume = volume / 100;
        newAudio.playbackRate = playbackRate;

        // Set source and load
        newAudio.src = url;
        setTimeout(() => {
          try {
            newAudio.load();
          } catch (e) {
            console.error("Error during audio load:", e);
          }
        }, 50);

        // Set as current audio
        audioRef.current = newAudio;
        return true;
      } catch (initError) {
        console.error("Error during audio initialization:", initError);
        return false;
      }
    },
    [volume, playbackRate, toast]
  );

  // Main effect to initialize audio - always prioritize initialUrl
  useEffect(() => {
    if (initialUrl) {
      console.log(
        `Using provided initialUrl: ${initialUrl.substring(0, 50)}...`
      );
      setAudioUrl(initialUrl);
      initializeAudio(initialUrl);
    } else if (audioS3key) {
      console.log("No initialUrl provided, fetching presigned URL from S3 key");
      fetchPresignedUrl();
    } else {
      console.log("No audio sources available");
    }
  }, [initialUrl, audioS3key, initializeAudio]);

  // Fetch presigned URL only if no initialUrl is provided
  const fetchPresignedUrl = useCallback(async () => {
    // Skip if initialUrl is provided
    if (initialUrl) {
      console.log("Using initialUrl instead of fetching presigned URL");
      return;
    }

    // Skip if no audioS3key
    if (!audioS3key) {
      console.warn("No audioS3key provided, cannot fetch presigned URL");
      setUrlError("No audio source available");
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      console.log(`Fetching presigned URL for S3 key: ${audioS3key}`);
      const result = await getPresignedUrlFromS3Key(audioS3key);

      if (result.success && result.url) {
        console.log(`Got presigned URL: ${result.url.substring(0, 100)}...`);
        setAudioUrl(result.url);
        const initialized = initializeAudio(result.url);
        if (!initialized) {
          throw new Error("Failed to initialize audio with presigned URL");
        }
      } else {
        throw new Error(result.error || "Failed to get presigned URL");
      }
    } catch (error) {
      console.error("Error fetching presigned URL:", error);
      setUrlError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Audio Error",
        description:
          "Failed to load audio. Please check AWS credentials and S3 configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUrl(false);
    }
  }, [audioS3key, initialUrl, initializeAudio, toast]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioInitialized) {
        setTimeout(() => togglePlay(), 500);
        return;
      }

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playing successfully");
            setIsPlaying(true);
          })
          .catch((e) => {
            console.error("Error playing audio:", e);
            toast({
              title: "Playback Error",
              description: e.message || "Unable to play audio",
              variant: "destructive",
            });
          });
      } else {
        try {
          setIsPlaying(true);
        } catch (legacyError) {
          console.error("Legacy browser play error:", legacyError);
        }
      }
    }
  }, [isPlaying, audioInitialized, toast]);

  // Refresh presigned URL if needed
  const refreshPresignedUrl = useCallback(async () => {
    if (initialUrl) {
      console.log("Using initialUrl, reinitializing");
      initializeAudio(initialUrl);
      toast({
        title: "Audio Refreshed",
        description: "Audio has been reinitialized",
      });
      return;
    }

    if (!audioS3key) {
      toast({
        title: "Error",
        description: "No audio source available to refresh",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingUrl(true);
    await fetchPresignedUrl();
    setIsLoadingUrl(false);

    toast({
      title: "URL Refreshed",
      description: "Audio URL has been refreshed",
    });
  }, [initialUrl, audioS3key, initializeAudio, fetchPresignedUrl, toast]);

  // Handle seeking
  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;

    const newTime = value[0];
    const wasPlaying = !audioRef.current.paused;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  // Skip forward 10 seconds
  const skipForward = useCallback(() => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.min(audioRef.current.currentTime + 10, duration);

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [duration]);

  // Skip backward 10 seconds
  const skipBackward = useCallback(() => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    const newTime = Math.max(audioRef.current.currentTime - 10, 0);

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    audioRef.current.volume = newVolume / 100;
    setVolume(newVolume);
  }, []);

  // Change playback rate
  const changePlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  }, []);

  // Format time to MM:SS
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, []);

  // Set up event listeners for the audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleError = (e: Event) => {
      console.error("Audio loading error:", e);
      setUrlError("Error loading audio");
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

    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [onNextSegment, segmentIndex, totalSegments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    duration,
    currentTime,
    volume,
    playbackRate,
    audioUrl,
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
  };
}
