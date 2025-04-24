"use client";

import { useCallback, useEffect } from "react";
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
  const allSegments = useAppSelector(selectAllSegments);
  const masterVolume = useAppSelector(selectMasterVolume);
  const tracks = useAppSelector(selectTracks);
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
   * Toggle global playback
   */
  const togglePlayback = useCallback(() => {
    if (!isPlaying) {
      console.log("Starting global playback...");

      // Warn if audio not initialized
      if (!audioInitialized) {
        toast.warning(
          "Audio playback may not work until you interact with the page. Please click anywhere and try again."
        );
      }

      // Stop any currently playing audio first
      if (audioManager) {
        audioManager.stopAll();
      }

      // Also stop any direct audio elements
      audioRegistry.stopAll();
      dispatch(clearPlayingSegments());

      // Find all segments that should be playing at the current time
      const segmentsToPlay = allSegments.filter(
        (segment: AudioSegment) =>
          segment.status === "generated" &&
          segment.audioUrl !== null &&
          currentTime >= segment.startTime &&
          currentTime <= segment.endTime
      );

      console.log(
        `Found ${segmentsToPlay.length} segments to play at time ${currentTime}`
      );

      if (segmentsToPlay.length === 0) {
        console.log("No segments to play at current time");
        dispatch(setPlaying(true));
        return;
      }

      // Preload all segments before playing
      const preloadPromises = segmentsToPlay.map((segment: AudioSegment) => {
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
      Promise.all(preloadPromises).then(() => {
        // Play each segment with staggered start
        segmentsToPlay.forEach((segment: AudioSegment, index: number) => {
          const track = tracks.find((t: AudioTrack) =>
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

          // Stagger playback slightly to avoid audio engine overload
          setTimeout(() => {
            try {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch((err) => {
                  console.error(
                    `Direct playback failed for segment ${segment.id}:`,
                    err
                  );
                  dispatch(removePlayingSegment(segment.id));

                  // Show error to user if it's the first segment that failed
                  if (index === 0) {
                    toast.error(
                      "Failed to play audio. Your browser may be blocking autoplay. Please click on the page and try again."
                    );
                  }
                });
              }
            } catch (err) {
              console.error(
                `Error in direct play for segment ${segment.id}:`,
                err
              );
              dispatch(removePlayingSegment(segment.id));
            }
          }, index * 100);
        });
      });
    } else {
      // Stop all playback
      stopAllAudio();
    }

    // Toggle playing state
    dispatch(setPlaying(!isPlaying));
  }, [
    isPlaying,
    audioManager,
    audioElementIds,
    allSegments,
    tracks,
    masterVolume,
    audioInitialized,
    currentTime,
    getAudioElement,
    dispatch,
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

  return {
    isPlaying,
    togglePlayback,
    playSegmentAudio,
    stopAllAudio,
    cleanupAudio,
    getAudioElement,
    playingSegments,
  };
}
