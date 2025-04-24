"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setAudioInitialized,
  setAudioManager,
  selectIsPlaying,
  selectCurrentTime,
  selectPlayingSegments,
  setCurrentTime,
} from "@/lib/redux/slices/audioSlice";
import { createAudioManager } from "@/lib/audio-utils";
import { AudioManagerCallbacks } from "@/types/audio-editor";
import { toast } from "sonner";

// Re-export types from a centralized location
export * from "@/lib/redux/hooks";
export * from "@/lib/redux/slices";
export type {
  AudioSegment,
  AudioTrack,
  ProjectData,
  TrimSettings,
  AudioManager,
  AudioManagerCallbacks,
} from "@/types/audio-editor";

// Wrapper for the Redux provider
export function AudioReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AudioPlaybackProvider>{children}</AudioPlaybackProvider>
    </Provider>
  );
}

// Internal provider to manage audio contexts and initialization
function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector(selectIsPlaying);
  const currentTime = useAppSelector(selectCurrentTime);
  const playingSegments = useAppSelector(selectPlayingSegments);

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the audio manager
  useEffect(() => {
    const audioManagerWithCallbacks = createAudioManager({
      onPlay: (id) => {
        console.log(`Playing audio segment: ${id}`);
      },
      onEnded: (id) => {
        console.log(`Audio segment completed: ${id}`);
      },
      onError: (id, error) => {
        if (!error.message.includes("AbortError")) {
          console.error(`Audio playback error for segment ${id}:`, error);
          toast.error("Audio playback error. Please try again.");
        }
      },
    });

    // Use the correct type with proper type inference - no casting needed
    dispatch(setAudioManager(audioManagerWithCallbacks));

    return () => {
      audioManagerWithCallbacks.dispose();
    };
  }, [dispatch]);

  // Initialize audio context on user interaction
  useEffect(() => {
    const unlockAudio = () => {
      console.log("Initializing audio context on user interaction");

      try {
        // Create a temporary AudioContext to initialize Web Audio API
        const tempContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Create a silent oscillator
        const oscillator = tempContext.createOscillator();
        const gainNode = tempContext.createGain();

        // Set the gain to 0 (silent)
        gainNode.gain.value = 0;

        // Connect the oscillator to the gain node and the gain node to the destination
        oscillator.connect(gainNode);
        gainNode.connect(tempContext.destination);

        // Start and stop the oscillator immediately
        oscillator.start(0);
        oscillator.stop(0.001);

        // Create a simple audio buffer with silence
        try {
          // Create a short buffer of silence
          const buffer = tempContext.createBuffer(
            1,
            1024,
            tempContext.sampleRate
          );
          const source = tempContext.createBufferSource();
          source.buffer = buffer;
          source.connect(tempContext.destination);

          // Play the buffer
          source.start(0);
          source.stop(0.001);

          console.log("Audio buffer initialized successfully");
        } catch (bufferError) {
          console.warn("Failed to play audio buffer:", bufferError);
        }

        console.log("Audio context initialized successfully");
        dispatch(setAudioInitialized(true));
      } catch (err) {
        console.error("Failed to initialize audio context:", err);

        // Still mark as initialized since we tried
        dispatch(setAudioInitialized(true));

        toast.error(
          "Audio playback may be restricted by your browser. Please click on the page first."
        );
      }

      // Remove this listener after initialization
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    // Add a message to inform the user they need to interact with the page
    toast.info("Please click anywhere on the page to enable audio playback", {
      duration: 5000,
    });

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, [dispatch]);

  // Manage playback timing interval
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing interval
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }

      let lastUpdateTime = Date.now();

      // Create new interval for time tracking
      playbackIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        dispatch(setCurrentTime(currentTime + elapsedSeconds));
      }, 50);
    } else if (playbackIntervalRef.current) {
      // Stop the interval when not playing
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentTime, dispatch]);

  return children;
}

// Export hooks and actions for use in components
export { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
export * from "@/lib/redux/slices";
