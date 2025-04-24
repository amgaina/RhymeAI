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

      // Create and play a silent audio to unlock audio playback
      const silentAudio = new Audio(
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABTgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJALGQQAAgAAAUi4NqpAAAAAAAAAAAAAAAAD/++DEAAAIoAFnlAAABRiCLPKAAAEEIbn7t9vu/7vd+FBMQglDEFYICAgQhCEJ4nCAIBn/w4EAQ//CCEIQn//CAIAgEAQBAEAQBAEAzcIQhCEIBgCDw+CfP/Lg8HwfB8Hw+D4Ph8Hw+D4Pj/5cHg+D4Pn/ywQBAEAQBAMQTN4gCAIRh+X//hG12kkkkkkk/4hGIRiEMQhGIQjEIhCMQiEYhGIQjEIhGIRiEIxCMQhGIQjEIRiEQjEIhGIRiEIRiEYhGIQjEIRiEYhCEYhGIQjEIRiEYhCEYhEIRiEYhCMQhGIQhGIQjEIRiEIxCEYhGIQjEIRiEYhCEYhGIQjEIRiEYhCMQhCMQhGIQjEQgAIBgEAQCCQyHSTLJJJJJJJJJJJJJJJJJJJPEIxCMQjEIRiEIxCEYhGIQjEIRiEYhCMQhGIRiEIxCEYhCMQjEIRiEIxCEYhGIQjEIRiEYhCEYhGIQjEIRiEIxCEYhGIQhGIRiEIxCEYhGIQjEIRiEIxCMQhGIQjEIRiEYhCMQhGIRiEIxCEIxCMQhGIQjEIRiEIxCEIKAAIAQDwCAAAAAAAAH0AACEAgGAQCBJJJJJJJJJN27f//////mWTk5OScnJycnJyxnJyxv///7m5vyRIBAIBkEhmSSSSSbJJJJJJJJJJJO//tWHfWlDrlWTIgARAQeXrFYoRqoGBx8YH//8KO86JJLZGA1MZbhL2IZxb//9xFKRIoUFDASbQAw0BSs1//8Wfi9nGRZplsNJJHDxwsdXs+NNOI+lQRs7v//8sqoSELsUGClOGBgYVjq8dOT3///4tM4//vgxF8AHD4Q1faKAAMawfK80kACIrYdHWc5rWRJgkAQFAI8dY8DRrh55QkKdSXv///3TOoVCSSdC4wJjgcGgkFg8dEq1Ju///5vXOJCJzowIcLGAYODRFxAadRwpwKMEgEHw+Pwc63u///95tkyJLI2EhxJGgg4OFISiSZtOLX///+VaSJnODYcGCgqPDAQHDRcFDTqdRGOTJGCwkBgYNBf9F3f///2LnMESCsYLBwJGkk6Dg8UEgyNOu9f////LLMKiyMChgiJjQUJCQoLGnLkJgMSNHAVnAh7vd////JZlhQbHBImLjQ8PEhIIiUbHHTXX/////Xk1qoJHRosKjQsICQkKBwyHwgVSIiCRxZAgMPv/X////0LNESDQwKCgkYHB4YFwgaPMqUVx1///5JqPG2/u7u7u7vd3d3TLu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7d3d6ZJd3d33d3d3d3d3dmSXd3d93d3d3d3d3d3d3d3d3d3d3d3d3d6ZZd3d3d3d3d3d3dmaZd3dmZJd3d2ZJmQDu7szMmaZd3dnFku7u7oAA7u7Mku7u7u7uQDu7u7IAAAzMzMAAAAA="
      );
      silentAudio.volume = 0.01;

      // Try to play the silent sound to unlock audio
      silentAudio
        .play()
        .then(() => {
          console.log("Audio context initialized successfully");
          dispatch(setAudioInitialized(true));
        })
        .catch((err) => {
          console.error("Failed to initialize audio context:", err);

          // Still mark as initialized since we tried
          dispatch(setAudioInitialized(true));

          toast.error(
            "Audio playback may be restricted by your browser. Please click on the page first."
          );
        });

      // Remove this listener after initialization
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

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
