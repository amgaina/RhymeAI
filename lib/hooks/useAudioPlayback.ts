"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import audioRegistry from "@/lib/audio-registry";
import { AudioSegment, AudioTrack } from "@/types/audio-editor";
import {
  useAppDispatch,
  useAppSelector,
  selectIsPlaying,
  selectAudioManager,
  selectAudioElementIds,
  selectPlayingSegments,
  selectAllSegments,
  selectMasterVolume,
  selectTracks,
  selectAudioInitialized,
  selectCurrentTime,
  setPlaying,
  addPlayingSegment,
  removePlayingSegment,
  clearPlayingSegments,
  registerAudioElement,
  unregisterAudioElement,
} from "@/components/providers/AudioPlaybackProvider";

/**
 * Custom hook for audio playback functionality
 */
export function useAudioPlayback() {
  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector(selectIsPlaying);
  const audioManager = useAppSelector(selectAudioManager);
  const audioElementIds = useAppSelector(selectAudioElementIds);
  const playingSegments = useAppSelector(selectPlayingSegments);
  const allSegments = useAppSelector(selectAllSegments); // This now uses the memoized selector
  const masterVolume = useAppSelector(selectMasterVolume);
  const tracks = useAppSelector(selectTracks); // This now uses the memoized selector
  const audioInitialized = useAppSelector(selectAudioInitialized);
  const currentTime = useAppSelector(selectCurrentTime);

  /**
   * Get or create an audio element
   */
  const getAudioElement = useCallback(
    (id: string, src?: string): HTMLAudioElement => {
      // Check if we already have this audio element in the registry
      if (audioRegistry.has(id)) {
        return audioRegistry.get(id)!;
      }

      // Create a new audio element
      const audio = new Audio(src);

      // Add event listeners
      audio.onended = () => {
        console.log(`Audio ended: ${id}`);
        dispatch(removePlayingSegment(id.replace("direct-", "")));
      };

      audio.onerror = (e) => {
        console.error(`Audio error for ${id}:`, e);
        dispatch(removePlayingSegment(id.replace("direct-", "")));
      };

      // Store in registry
      audioRegistry.set(id, audio);

      // Register in Redux
      dispatch(registerAudioElement(id));

      return audio;
    },
    [dispatch]
  );

  /**
   * Stop all audio playback
   */
  const stopAllAudio = useCallback(() => {
    if (audioManager) {
      audioManager.stopAll();
    }

    audioRegistry.stopAll();
    dispatch(clearPlayingSegments());
  }, [audioManager, dispatch]);

  /**
   * Cleanup audio elements
   */
  const cleanupAudio = useCallback(
    (id: string) => {
      audioRegistry.remove(id);
      dispatch(unregisterAudioElement(id));
    },
    [dispatch]
  );

  /**
   * Play a specific segment
   */
  const playSegmentAudio = useCallback(
    (segmentId: string) => {
      console.log(`Attempting to play segment: ${segmentId}`);

      // Find the segment
      const segment = allSegments.find((s: AudioSegment) => s.id === segmentId);
      if (!segment) {
        console.error(`Segment not found: ${segmentId}`);
        toast.error("Segment not found");
        return;
      }

      if (!segment.audioUrl) {
        console.error(`No audio URL for segment: ${segmentId}`);
        toast.error("No audio available for this segment");
        return;
      }

      // Find track for volume
      const track = tracks.find((t: AudioTrack) =>
        t.segments.some((s) => s.id === segmentId)
      );

      if (!track) {
        console.error(`Track not found for segment: ${segmentId}`);
        return;
      }

      // Get or create direct audio element
      const audioId = `direct-${segmentId}`;
      const audio = getAudioElement(audioId, segment.audioUrl);

      // Play/pause toggle behavior
      const isSegmentPlaying = playingSegments.includes(segmentId);

      if (isSegmentPlaying) {
        console.log(`Pausing segment: ${segmentId}`);

        // Pause the audio
        try {
          audio.pause();
          dispatch(removePlayingSegment(segmentId));
        } catch (err) {
          console.error(`Error pausing segment ${segmentId}:`, err);
        }
      } else {
        // Stop all currently playing audio first
        stopAllAudio();

        dispatch(addPlayingSegment(segmentId));

        // Calculate volume - respect track mute state
        const effectiveVolume = track.muted
          ? 0
          : (track.volume / 100) * (masterVolume / 100);

        // Configure the audio element
        audio.volume = effectiveVolume;
        audio.currentTime = 0;

        // Play the audio with better error handling
        try {
          // Ensure audio is loaded before playing
          if (audio.readyState < 2) {
            console.log(`Loading audio for segment ${segmentId}...`);
            audio.load();
          }

          // If the track is muted, don't actually play but still update UI state
          if (track.muted) {
            console.log(
              `Track is muted. Not playing audio for segment ${segmentId}`
            );
            // Show info message to user
            toast.info("Track is muted. Unmute to hear audio.");

            // Remove from playing segments after a short delay to provide visual feedback
            setTimeout(() => {
              dispatch(removePlayingSegment(segmentId));
            }, 1500);

            return;
          }

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error(`Solo play failed for segment ${segmentId}:`, err);
              dispatch(removePlayingSegment(segmentId));

              if (err.name === "NotAllowedError") {
                toast.error(
                  "Browser blocked audio playback. Please click on the page first, then try again."
                );
              } else {
                toast.error("Failed to play audio: " + err.message);
              }
            });
          }
        } catch (err) {
          console.error(`Error in solo play for segment ${segmentId}:`, err);
          dispatch(removePlayingSegment(segmentId));
          toast.error("Failed to play audio");
        }
      }
    },
    [
      allSegments,
      tracks,
      masterVolume,
      getAudioElement,
      playingSegments,
      dispatch,
      stopAllAudio,
    ]
  );

  /**
   * Play segments at current position (extracted for reuse)
   */
  const playSegmentsAtCurrentTime = useCallback(() => {
    // Find all segments that should be playing at the current time
    const segmentsToPlay = allSegments.filter(
      (segment) =>
        segment.status === "generated" &&
        segment.audioUrl !== null &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    );

    console.log(
      `Found ${segmentsToPlay.length} segments to play at time ${currentTime}`
    );

    if (segmentsToPlay.length === 0) {
      return;
    }

    // Preload and play segments
    const preloadPromises = segmentsToPlay.map((segment) => {
      return new Promise<HTMLAudioElement | null>((resolve) => {
        if (!segment.audioUrl) {
          resolve(null);
          return;
        }

        // Create or get audio element
        const audioId = `direct-${segment.id}`;
        const audio = getAudioElement(audioId, segment.audioUrl);

        // Force preload
        audio.preload = "auto";

        // Set up event for preload completion
        const handleCanPlay = () => {
          audio.removeEventListener("canplaythrough", handleCanPlay);
          resolve(audio);
        };

        // If already loaded, resolve immediately
        if (audio.readyState >= 3) {
          resolve(audio);
        } else {
          // Otherwise wait for canplaythrough event
          audio.addEventListener("canplaythrough", handleCanPlay);

          // Set a timeout to avoid hanging
          setTimeout(() => {
            audio.removeEventListener("canplaythrough", handleCanPlay);
            resolve(audio); // Resolve anyway after timeout
          }, 2000);
        }

        // Start loading the audio
        try {
          audio.load();
        } catch (e) {
          console.error(`Error loading audio for segment ${segment.id}:`, e);
          resolve(null);
        }
      });
    });

    // Wait for all segments to be preloaded
    Promise.all(preloadPromises).then((audios) => {
      // Play each segment with appropriate settings
      segmentsToPlay.forEach((segment, index) => {
        const track = tracks.find((t) =>
          t.segments.some((s) => s.id === segment.id)
        );

        if (!track || track.muted || !segment.audioUrl) {
          return;
        }

        const effectiveVolume = (track.volume / 100) * (masterVolume / 100);
        const segmentProgress = currentTime - segment.startTime;

        // Add to playing set
        dispatch(addPlayingSegment(segment.id));

        // Get the audio element
        const audioId = `direct-${segment.id}`;
        const audio = audioRegistry.get(audioId);

        if (!audio) {
          console.error(`Missing audio element for segment ${segment.id}`);
          return;
        }

        // Configure the audio element
        audio.volume = effectiveVolume;
        audio.currentTime = segmentProgress;

        // Play with slight staggering
        setTimeout(() => {
          try {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                console.error(
                  `Playback failed for segment ${segment.id}:`,
                  err
                );
                dispatch(removePlayingSegment(segment.id));
              });
            }
          } catch (err) {
            console.error(`Error playing segment ${segment.id}:`, err);
            dispatch(removePlayingSegment(segment.id));
          }
        }, index * 100);
      });
    });
  }, [
    currentTime,
    allSegments,
    tracks,
    masterVolume,
    dispatch,
    getAudioElement,
  ]);

  /**
   * Play a specific segment from a given starting position
   */
  const playSegmentFromPosition = useCallback(
    (segmentId: string, startPosition: number) => {
      console.log(
        `Playing segment ${segmentId} from position ${startPosition}`
      );

      // Find the segment
      const segment = allSegments.find((s) => s.id === segmentId);
      if (!segment || !segment.audioUrl) {
        console.error(`No segment or audio URL found for segment ${segmentId}`);
        return false;
      }

      // Find track for volume settings
      const track = tracks.find((t) =>
        t.segments.some((s) => s.id === segmentId)
      );
      if (!track) {
        console.error(`No track found for segment ${segmentId}`);
        return false;
      }

      // If track is muted, don't play
      if (track.muted) {
        console.log(
          `Track ${track.id} is muted, not playing segment ${segmentId}`
        );
        return false;
      }

      // Get the audio element
      const audioId = `direct-${segmentId}`;
      const audio = getAudioElement(audioId, segment.audioUrl);

      // Calculate effective volume
      const effectiveVolume = (track.volume / 100) * (masterVolume / 100);

      // Calculate where in the segment to start (relative to segment start)
      const segmentProgress = startPosition - segment.startTime;

      // Add to playing set
      dispatch(addPlayingSegment(segmentId));

      // Configure audio element
      audio.volume = effectiveVolume;
      audio.currentTime = Math.max(0, segmentProgress);

      // Play with error handling
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error(`Playback failed for segment ${segmentId}:`, err);
            dispatch(removePlayingSegment(segmentId));

            if (err.name === "NotAllowedError") {
              toast.error(
                "Browser blocked audio playback. Please click on the page first."
              );
            }
          });
        }
        return true;
      } catch (err) {
        console.error(`Error playing segment ${segmentId}:`, err);
        dispatch(removePlayingSegment(segmentId));
        return false;
      }
    },
    [allSegments, tracks, masterVolume, dispatch, getAudioElement]
  );

  /**
   * Toggle global playback - refactored to use the extracted function
   */
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      console.log("Stopping playback");

      // Stop all audio playback and clear state
      stopAllAudio();
      dispatch(setPlaying(false));
      return;
    }

    console.log("Starting playback at time:", currentTime);

    // Find segments that should be playing at current time
    const segmentsToPlay = allSegments.filter(
      (segment) =>
        segment.audioUrl &&
        segment.status === "generated" &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    );

    console.log(
      `Found ${segmentsToPlay.length} segments to play at time ${currentTime}`
    );

    // For tracking if we actually played anything
    let anySegmentPlayed = false;

    // If we have segments to play, set up each one with proper delay
    if (segmentsToPlay.length > 0) {
      // Use a counter to track how many segments we've processed for better error logging
      let processedCount = 0;

      segmentsToPlay.forEach((segment, index) => {
        const track = tracks.find((t) =>
          t.segments.some((s) => s.id === segment.id)
        );

        if (!track || track.muted || !segment.audioUrl) {
          processedCount++;
          return;
        }

        try {
          const audioId = `direct-${segment.id}`;
          const audio = getAudioElement(audioId, segment.audioUrl);

          // Calculate volume and position
          const effectiveVolume = (track.volume / 100) * (masterVolume / 100);
          const segmentProgress = Math.max(0, currentTime - segment.startTime);

          // Set up audio
          audio.volume = effectiveVolume;
          audio.currentTime = segmentProgress;

          // Track in redux
          dispatch(addPlayingSegment(segment.id));

          // Play with increased reliability
          setTimeout(() => {
            console.log(
              `Playing segment ${
                segment.id
              } at offset ${segmentProgress.toFixed(2)}s`
            );
            try {
              // Try to force audio context resume first (if applicable)
              if (audio.context && audio.context.state === "suspended") {
                audio.context
                  .resume()
                  .catch((e) =>
                    console.warn("Could not resume audio context:", e)
                  );
              }

              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    anySegmentPlayed = true;
                    processedCount++;
                    console.log(
                      `Successfully started playback for segment ${segment.id}`
                    );
                  })
                  .catch((err) => {
                    console.error(`Error playing segment ${segment.id}:`, err);
                    dispatch(removePlayingSegment(segment.id));
                    processedCount++;
                  });
              } else {
                anySegmentPlayed = true;
                processedCount++;
              }
            } catch (err) {
              console.error(
                `Error in play attempt for segment ${segment.id}:`,
                err
              );
              dispatch(removePlayingSegment(segment.id));
              processedCount++;
            }
          }, index * 50); // Stagger starts to avoid audio conflicts
        } catch (err) {
          console.error(`Error setting up segment ${segment.id}:`, err);
          processedCount++;
        }
      });

      // Check if we actually managed to play anything
      setTimeout(() => {
        if (!anySegmentPlayed && processedCount === segmentsToPlay.length) {
          console.warn(
            "Failed to play any segments despite finding matching segments"
          );
          toast.warning(
            "Audio playback issue - try clicking anywhere and retry"
          );
        }
      }, segmentsToPlay.length * 50 + 100);
    }

    // Always set global state to playing
    dispatch(setPlaying(true));
  }, [
    isPlaying,
    currentTime,
    allSegments,
    tracks,
    masterVolume,
    dispatch,
    getAudioElement,
    stopAllAudio,
  ]);

  // Add effect to update audio volume when track mute/volume changes
  useEffect(() => {
    // Apply volume settings to all currently playing audio elements
    playingSegments.forEach((segmentId) => {
      const audioId = `direct-${segmentId}`;
      const audio = audioRegistry.get(audioId);
      if (!audio) return;

      // Find the track for this segment
      const segment = allSegments.find((s) => s.id === segmentId);
      if (!segment) return;

      const track = tracks.find((t) =>
        t.segments.some((s) => s.id === segmentId)
      );

      if (track) {
        // Calculate effective volume
        const effectiveVolume = track.muted
          ? 0
          : (track.volume / 100) * (masterVolume / 100);

        // Apply volume setting
        audio.volume = effectiveVolume;

        // If track was muted, stop playback
        if (track.muted && !audio.paused) {
          audio.pause();
          dispatch(removePlayingSegment(segmentId));
        }
      }
    });
  }, [tracks, masterVolume, playingSegments, allSegments, dispatch]);

  // Memo-ize any derived values from segments or tracks
  const currentSegmentsAtTime = useMemo(() => {
    return allSegments.filter(
      (segment) =>
        segment.audioUrl &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    );
  }, [allSegments, currentTime]);

  return {
    isPlaying,
    togglePlayback,
    playSegmentAudio,
    stopAllAudio,
    playSegmentFromPosition,
    playSegmentsAtCurrentTime, // Export this function for seeking operations
    cleanupAudio,
    getAudioElement,
    playingSegments,
    // Add the new memoized value
    currentSegmentsAtTime,
  };
}
