"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AddTrackDialog, {
  AddTrackDialogRef,
} from "@/components/playground/audio-editor/AddTrackDialog";
import ShortcutsDialog from "@/components/playground/audio-editor/ShortcutsDialog";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import {
  createShortcuts,
  flattenShortcuts,
} from "@/lib/shortcuts/audioEditorShortcuts";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Import custom components
import Timeline from "@/components/playground/audio-editor/Timeline";
import Track from "@/components/playground/audio-editor/Track";
import AudioControls from "@/components/playground/audio-editor/AudioControls";
import ScriptEditor from "@/components/playground/audio-editor/ScriptEditor";
import BackgroundSoundManager from "@/components/playground/audio-editor/BackgroundSoundManager";
import PresentationLayer from "@/components/playground/audio-editor/PresentationLayer";
import AudioTrimmer from "@/components/playground/audio-editor/AudioTrimmer";

// Import the audio utilities
import {
  getAudioFileDuration,
  createAudioFileUrl,
  revokeAudioFileUrl,
} from "@/lib/audio-utils";

// Import Redux hooks and actions
import {
  useAppDispatch,
  useAppSelector,
  selectProject,
  selectCurrentTime,
  selectMasterVolume,
  selectAllSegments,
  selectActiveSegment,
  selectSelectedTrack,
  selectZoomLevel,
  selectIsLoading,
  selectEditingScript,
  selectTrimming,
  setCurrentTime,
  setSelectedTrack,
  addSegments,
  updateSegmentTiming,
  setTrimming,
  setEditingScript,
  toggleTrackMute,
  toggleTrackLock,
  updateTrackVolume,
  setIsLoading,
  addTrack,
  deleteSegment,
  setZoomLevel,
  setMasterVolume,
  setPlaying,
} from "@/components/providers/AudioPlaybackProvider";

// Import audio playback hook
import { useAudioPlayback } from "@/lib/hooks/useAudioPlayback";

// Import centralized audio editor types
import {
  AudioSegment,
  AudioSegmentStatus,
  adaptSegmentStatus,
} from "@/types/audio-editor";

// Add debugging helper for audio URLs
const debugAudioUrl = (url: string): string => {
  // For blob URLs, create a reliable URL
  if (url.startsWith("blob:")) {
    try {
      console.log(`Processing blob URL: ${url}`);
      return url;
    } catch (error) {
      console.error("Error with blob URL:", error);
    }
  }

  // For relative URLs, make them absolute
  if (url.startsWith("/")) {
    return window.location.origin + url;
  }

  // Return original for other URLs
  return url;
};

// Define imported segments with proper typing
interface ImportedSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  audioUrl: string;
  status: AudioSegmentStatus;
}

export default function AudioEditorPlayground() {
  const dispatch = useAppDispatch();

  // Redux state
  const project = useAppSelector(selectProject);
  const currentTime = useAppSelector(selectCurrentTime);
  const masterVolume = useAppSelector(selectMasterVolume);
  const allSegments = useAppSelector(selectAllSegments);
  const activeSegment = useAppSelector(selectActiveSegment);
  const selectedTrack = useAppSelector(selectSelectedTrack);
  const zoomLevel = useAppSelector(selectZoomLevel);
  const isLoading = useAppSelector(selectIsLoading);
  const editingScript = useAppSelector(selectEditingScript);
  const trimming = useAppSelector(selectTrimming);

  // Audio playback hooks
  const { isPlaying, togglePlayback, playSegmentAudio, stopAllAudio } =
    useAudioPlayback();

  // Reference to track dialog
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const addTrackDialogRef = useRef<{ openDialog: () => void } | null>(null);

  // Define keyboard shortcut actions
  const shortcutActions = {
    // Playback controls
    togglePlayPause: () => togglePlayback(),
    stopPlayback: () => stopAllAudio(),
    skipForward: () => {
      stopAllAudio();
      dispatch(setCurrentTime(Math.min(project.duration, currentTime + 5)));
    },
    skipBackward: () => {
      stopAllAudio();
      dispatch(setCurrentTime(Math.max(0, currentTime - 5)));
    },

    // Volume controls
    increaseVolume: () => {
      const newVolume = Math.min(100, masterVolume + 5);
      dispatch(setMasterVolume(newVolume));
      toast.info(`Volume: ${newVolume}%`);
    },
    decreaseVolume: () => {
      const newVolume = Math.max(0, masterVolume - 5);
      dispatch(setMasterVolume(newVolume));
      toast.info(`Volume: ${newVolume}%`);
    },
    toggleMute: () => {
      // Toggle mute on the selected track
      if (selectedTrack) {
        dispatch(toggleTrackMute(selectedTrack));
        const track = project.tracks.find((t) => t.id === selectedTrack);
        if (track) {
          toast.info(`${track.name} ${track.muted ? "unmuted" : "muted"}`);
        }
      }
    },

    // Track management
    addTrack: () => {
      if (addTrackDialogRef.current) {
        addTrackDialogRef.current.openDialog();
      }
    },
    selectNextTrack: () => {
      const trackIds = project.tracks.map((t) => t.id);

      // Handle null selectedTrack case
      if (selectedTrack === null) {
        // If no track is selected, select the first track
        if (trackIds.length > 0) {
          dispatch(setSelectedTrack(trackIds[0]));
        }
        return;
      }

      const currentIndex = trackIds.indexOf(selectedTrack);
      if (currentIndex < trackIds.length - 1) {
        dispatch(setSelectedTrack(trackIds[currentIndex + 1]));
      }
    },
    selectPreviousTrack: () => {
      const trackIds = project.tracks.map((t) => t.id);

      // Handle null selectedTrack case
      if (selectedTrack === null) {
        // If no track is selected, select the last track
        if (trackIds.length > 0) {
          dispatch(setSelectedTrack(trackIds[trackIds.length - 1]));
        }
        return;
      }

      const currentIndex = trackIds.indexOf(selectedTrack);
      if (currentIndex > 0) {
        dispatch(setSelectedTrack(trackIds[currentIndex - 1]));
      }
    },
    toggleTrackLock: () => {
      if (selectedTrack !== null) {
        dispatch(toggleTrackLock(selectedTrack));
        const track = project.tracks.find((t) => t.id === selectedTrack);
        if (track) {
          toast.info(`${track.name} ${track.locked ? "unlocked" : "locked"}`);
        }
      } else {
        toast.info("Please select a track first");
      }
    },
    toggleTrackMute: () => {
      if (selectedTrack !== null) {
        dispatch(toggleTrackMute(selectedTrack));
        const track = project.tracks.find((t) => t.id === selectedTrack);
        if (track) {
          toast.info(`${track.name} ${track.muted ? "unmuted" : "muted"}`);
        }
      } else {
        toast.info("Please select a track first");
      }
    },

    // Segment management
    addSegment: () => {
      toast.info("Add segment functionality coming soon");
    },
    deleteSelectedSegment: () => {
      // Find the currently selected segment (if any)
      // For now, we'll just show a message
      toast.info("Delete segment shortcut - select a segment first");
    },
    trimSegment: () => {
      // For now, we'll just show a message
      toast.info("Trim segment shortcut - select a segment first");
    },

    // Timeline navigation
    zoomIn: () => {
      dispatch(setZoomLevel(Math.min(5, zoomLevel + 0.5)));
      toast.info(`Zoom level: ${Math.min(5, zoomLevel + 0.5)}`);
    },
    zoomOut: () => {
      dispatch(setZoomLevel(Math.max(0.5, zoomLevel - 0.5)));
      toast.info(`Zoom level: ${Math.max(0.5, zoomLevel - 0.5)}`);
    },
    moveToStart: () => {
      stopAllAudio();
      dispatch(setCurrentTime(0));
    },
    moveToEnd: () => {
      stopAllAudio();
      dispatch(setCurrentTime(project.duration));
    },

    // Clipboard operations
    cut: () => {
      toast.info("Cut functionality coming soon");
    },
    copy: () => {
      toast.info("Copy functionality coming soon");
    },
    paste: () => {
      toast.info("Paste functionality coming soon");
    },

    // Misc
    save: () => {
      toast.info("Save functionality coming soon");
    },
    undo: () => {
      toast.info("Undo functionality coming soon");
    },
    redo: () => {
      toast.info("Redo functionality coming soon");
    },
    showShortcuts: () => {
      setShowShortcutsDialog(true);
    },

    // Additional controls
    splitSegment: () => {
      toast.info("Split segment functionality coming soon");
    },
    mergeSegments: () => {
      toast.info("Merge segments functionality coming soon");
    },
    duplicateSegment: () => {
      toast.info("Duplicate segment functionality coming soon");
    },
    selectAll: () => {
      toast.info("Select all functionality coming soon");
    },
    deselectAll: () => {
      toast.info("Deselect all functionality coming soon");
    },

    // Navigation
    goToNextMarker: () => {
      toast.info("Go to next marker functionality coming soon");
    },
    goToPreviousMarker: () => {
      toast.info("Go to previous marker functionality coming soon");
    },

    // View controls
    toggleFullscreen: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        toast.info("Exited fullscreen mode");
      } else {
        document.documentElement.requestFullscreen();
        toast.info("Entered fullscreen mode");
      }
    },
    toggleWaveform: () => {
      toast.info("Toggle waveform view functionality coming soon");
    },
    toggleGrid: () => {
      toast.info("Toggle grid functionality coming soon");
    },
  };

  // Create and register keyboard shortcuts
  const shortcutGroups = createShortcuts(shortcutActions);
  const shortcuts = flattenShortcuts(shortcutGroups);
  useKeyboardShortcuts(shortcuts);

  // References for file management
  const fileUrlsRef = useRef<string[]>([]);

  // Format time helper function
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return seconds.toFixed(1) + "s";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const estimateContentDuration = (content: string): number => {
    const words = content.trim().split(/\s+/).length;
    const estimatedSeconds = Math.max(3, Math.ceil(words / 2.5));
    return estimatedSeconds;
  };

  // Improved seek handler to maintain playback state
  const handleSeek = useCallback(
    (newTime: number) => {
      // Track current playback state
      const wasPlaying = isPlaying;

      console.log(
        `Timeline seek to ${formatTime(newTime)}, wasPlaying: ${wasPlaying}`
      );

      // First stop any current audio playback
      stopAllAudio();

      // Update the timeline position
      dispatch(
        setCurrentTime(Math.max(0, Math.min(newTime, project.duration)))
      );

      // If we were playing before, we need to restart playback
      if (wasPlaying) {
        // Temporarily set isPlaying to false to ensure proper state transition
        dispatch(setPlaying(false));

        // Use a timer to restart playback after a short delay
        setTimeout(() => {
          console.log(`Forcing playback restart at ${formatTime(newTime)}`);

          // Find segments that should be playing at new position
          const segmentsAtPosition = allSegments.filter(
            (segment: AudioSegment) =>
              segment.audioUrl &&
              newTime >= segment.startTime &&
              newTime <= segment.endTime
          );

          console.log(
            `Found ${segmentsAtPosition.length} segments at seek position`
          );

          // Play each relevant segment directly
          let anyPlayed = false;
          segmentsAtPosition.forEach((segment) => {
            const track = project.tracks.find((t) =>
              t.segments.some((s) => s.id === segment.id)
            );

            if (track && !track.muted && segment.audioUrl) {
              console.log(`Playing segment ${segment.id} after seek`);
              playSegmentAudio(segment.id);
              anyPlayed = true;
            }
          });

          // Set global playing state to true regardless
          dispatch(setPlaying(true));

          // If no segments were played, show a message
          if (segmentsAtPosition.length === 0) {
            console.log("No segments to play at current position");
          } else if (!anyPlayed) {
            console.log("No segments could be played (may be muted)");
          }
        }, 250); // Increased from 200ms to 250ms for better reliability
      }
    },
    [
      isPlaying,
      project.duration,
      project.tracks,
      allSegments,
      dispatch,
      stopAllAudio,
      playSegmentAudio,
      formatTime,
    ]
  );

  // Initialize audio context on user interaction
  useEffect(() => {
    const initializeAudio = () => {
      // Create a silent audio context to initialize Web Audio API
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();

        // Create a silent oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Set the gain to 0 (silent)
        gainNode.gain.value = 0;

        // Connect the oscillator to the gain node and the gain node to the destination
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Start and stop the oscillator immediately
        oscillator.start(0);
        oscillator.stop(0.001);

        // Create a simple audio buffer with silence
        try {
          // Create a short buffer of silence
          const buffer = audioContext.createBuffer(
            1,
            1024,
            audioContext.sampleRate
          );
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);

          // Play the buffer
          source.start(0);
          source.stop(0.001);

          console.log("Audio buffer initialized successfully");
        } catch (bufferError) {
          console.warn("Failed to play audio buffer:", bufferError);
        }

        console.log("Audio context initialized successfully");

        // Remove event listeners once initialized
        document.removeEventListener("click", initializeAudio);
        document.removeEventListener("touchstart", initializeAudio);
      } catch (error) {
        console.error("Failed to initialize audio context:", error);
        toast.error(
          "Failed to initialize audio context. Audio playback may not work."
        );
      }
    };

    // Add event listeners for user interaction
    document.addEventListener("click", initializeAudio);
    document.addEventListener("touchstart", initializeAudio);

    // Show a message to the user
    toast.info("Please click anywhere on the page to enable audio playback", {
      duration: 5000,
    });

    return () => {
      // Clean up event listeners
      document.removeEventListener("click", initializeAudio);
      document.removeEventListener("touchstart", initializeAudio);

      // Clean up file URLs
      fileUrlsRef.current.forEach((url) => {
        revokeAudioFileUrl(url);
      });
    };
  }, []);

  // Track active segment changes
  useEffect(() => {
    const currentSegment = allSegments.find(
      (segment: AudioSegment) =>
        currentTime >= segment.startTime && currentTime <= segment.endTime
    );

    if (currentSegment && currentSegment.id !== activeSegment) {
      dispatch(setEditingScript(currentSegment.content));
    }
  }, [currentTime, allSegments, activeSegment, dispatch]);

  const getPlayingSegmentsInfo = () => {
    const playing = allSegments.filter(
      (segment: AudioSegment) =>
        segment.audioUrl &&
        currentTime >= segment.startTime &&
        currentTime <= segment.endTime
    );

    return playing.length > 0
      ? `Playing ${playing.length} segment(s)`
      : "No segments at current position";
  };

  const importMediaToTrack = async (trackId: number) => {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      toast.error("Track not found");
      return;
    }

    if (track.locked) {
      toast.error("Cannot import media to a locked track");
      return;
    }

    // Create an input element for file selection
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.multiple = true;

    input.onchange = async (e) => {
      try {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;

        dispatch(setIsLoading(true));
        toast.info(`Analyzing ${files.length} audio file(s)...`);

        const fileArray = Array.from(files);
        let segmentStartTime = currentTime;
        const newSegments: ImportedSegment[] = [];

        // Process each file
        for (const file of fileArray) {
          if (!file.type.startsWith("audio/")) {
            toast.error(`${file.name} is not an audio file`);
            continue;
          }

          try {
            // Create a blob URL for the file
            const fileUrl = createAudioFileUrl(file);
            console.log(`Created blob URL for ${file.name}: ${fileUrl}`);
            fileUrlsRef.current.push(fileUrl);

            // Get the audio duration
            let duration: number;
            try {
              duration = await getAudioFileDuration(fileUrl);
              console.log(`Detected duration for ${file.name}: ${duration}s`);
            } catch (error) {
              console.warn(
                `Could not detect duration for ${file.name}. Using fallback.`
              );
              duration = 30; // Fallback duration
            }

            // Create a new segment with correct status type
            const segment: ImportedSegment = {
              id: uuidv4(),
              startTime: segmentStartTime,
              endTime: segmentStartTime + duration,
              content: file.name,
              audioUrl: fileUrl,
              status: "generated", // Using the correctly typed status
            };

            newSegments.push(segment);
            segmentStartTime += duration + 1; // Add a 1-second gap between segments
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`);
          }
        }

        if (newSegments.length === 0) {
          toast.error("No valid audio files were imported");
          dispatch(setIsLoading(false));
          return;
        }

        // Update project data with new segments
        dispatch(addSegments({ trackId, segments: newSegments }));

        toast.success(
          `Added ${newSegments.length} audio file${
            newSegments.length > 1 ? "s" : ""
          } to ${track.name}`
        );

        // Offer to trim if only one file was added
        if (newSegments.length === 1) {
          setTimeout(() => {
            dispatch(
              setTrimming({
                segmentId: newSegments[0].id,
                trackId: trackId,
                audioUrl: newSegments[0].audioUrl,
                name: fileArray[0].name,
              })
            );
          }, 500);
        }
      } catch (error) {
        console.error("Error importing audio files:", error);
        toast.error("Failed to import audio files");
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    // Open the file picker
    input.click();
  };

  const handleDirectFileDrop = async (
    trackId: number,
    files: File[],
    dropPosition: number
  ) => {
    const track = project.tracks.find((t) => t.id === trackId);
    if (!track) {
      toast.error("Track not found");
      return;
    }

    if (track.locked) {
      toast.error("Cannot import media to a locked track");
      return;
    }

    try {
      dispatch(setIsLoading(true));

      // Use the drop position as the start time for the first segment
      let segmentStartTime = dropPosition;
      const newSegments: ImportedSegment[] = [];

      // Process each file directly (similar to importMediaToTrack but without file picker)
      for (const file of files) {
        if (
          !file.type.startsWith("audio/") &&
          !file.name.endsWith(".mp3") &&
          !file.name.endsWith(".wav") &&
          !file.name.endsWith(".m4a") &&
          !file.name.endsWith(".ogg")
        ) {
          toast.error(`${file.name} is not an audio file`);
          continue;
        }

        try {
          // Create blob URL for the file
          const fileUrl = createAudioFileUrl(file);
          console.log(`Created blob URL for ${file.name}: ${fileUrl}`);
          fileUrlsRef.current.push(fileUrl);

          // Get audio duration
          let duration: number;
          try {
            duration = await getAudioFileDuration(fileUrl);
            console.log(`Detected duration for ${file.name}: ${duration}s`);
          } catch (error) {
            console.warn(
              `Could not detect duration for ${file.name}. Using fallback.`
            );
            duration = 30; // Fallback duration
          }

          // Create segment
          const segment: ImportedSegment = {
            id: uuidv4(),
            startTime: segmentStartTime,
            endTime: segmentStartTime + duration,
            content: file.name,
            audioUrl: fileUrl,
            status: "generated",
          };

          newSegments.push(segment);
          segmentStartTime += duration + 1; // Add 1-second gap
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      if (newSegments.length === 0) {
        toast.error("No valid audio files were imported");
        return;
      }

      // Add segments to track
      dispatch(addSegments({ trackId, segments: newSegments }));
      toast.success(
        `Added ${newSegments.length} audio file(s) to ${track.name}`
      );

      // Show trimmer for single file uploads
      if (newSegments.length === 1) {
        setTimeout(() => {
          dispatch(
            setTrimming({
              segmentId: newSegments[0].id,
              trackId: trackId,
              audioUrl: newSegments[0].audioUrl,
              name: files[0].name,
            })
          );
        }, 500);
      }
    } catch (error) {
      console.error("Error handling dropped files:", error);
      toast.error("Failed to process dropped files");
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  const handleSaveTrim = (
    segmentId: string,
    startTime: number,
    endTime: number
  ) => {
    try {
      // Find the segment we're trimming
      const segment = allSegments.find((s: AudioSegment) => s.id === segmentId);
      if (!segment) {
        toast.error("Segment not found");
        dispatch(setTrimming(null));
        return;
      }

      // Calculate the new times - keep the original start position but adjust duration
      const originalStartTime = segment.startTime;

      // The new boundaries should be relative to the original start time
      const newStartTimeOffset = startTime;
      const newEndTimeOffset = endTime;

      const newStartTime = originalStartTime + newStartTimeOffset;
      const newEndTime = originalStartTime + newEndTimeOffset;

      // Make sure we don't go beyond project boundaries
      const clampedStartTime = Math.max(0, newStartTime);
      const clampedEndTime = Math.min(project.duration, newEndTime);

      // Update the segment timing
      dispatch(
        updateSegmentTiming({
          segmentId,
          startTime: clampedStartTime,
          endTime: clampedEndTime,
        })
      );

      // Close the trimming dialog
      dispatch(setTrimming(null));

      // Provide user feedback
      toast.success(
        `Audio segment trimmed successfully (${formatDuration(
          clampedEndTime - clampedStartTime
        )})`
      );
    } catch (error) {
      console.error("Error saving trim:", error);
      toast.error("Failed to save trimmed audio");
      dispatch(setTrimming(null));
    }
  };

  const handleTrimSegment = (segmentId: string) => {
    console.log(`Attempting to trim segment: ${segmentId}`);

    // Find the segment
    const segment = allSegments.find((s: AudioSegment) => s.id === segmentId);
    if (!segment || !segment.audioUrl) {
      console.error(`No audio for segment: ${segmentId}`);
      toast.error("No audio available for this segment");
      return;
    }

    // Find the track
    const track = project.tracks.find((track) =>
      track.segments.some((s) => s.id === segmentId)
    );

    if (!track) {
      console.error(`Track not found for segment: ${segmentId}`);
      toast.error("Track not found for this segment");
      return;
    }

    // Set trimming state
    console.log(`Opening trimmer for segment: ${segmentId}`);
    dispatch(
      setTrimming({
        segmentId,
        trackId: track.id,
        audioUrl: debugAudioUrl(segment.audioUrl),
        name: segment.content,
      })
    );
  };

  const handleMoveSegment = (segmentId: string, newStartTime: number) => {
    console.log(`Moving segment ${segmentId} to start time: ${newStartTime}`);

    try {
      // Find the segment we're moving
      const segment = allSegments.find((s: AudioSegment) => s.id === segmentId);
      if (!segment) {
        console.error(`Segment not found: ${segmentId}`);
        toast.error("Segment not found");
        return;
      }

      // Find the track
      const track = project.tracks.find((track) =>
        track.segments.some((s) => s.id === segmentId)
      );

      if (!track) {
        console.error(`Track not found for segment: ${segmentId}`);
        toast.error("Track not found for this segment");
        return;
      }

      // If the track is locked, prevent movement
      if (track.locked) {
        toast.error("Cannot move segment on a locked track");
        return;
      }

      // Calculate duration of the segment
      const segmentDuration = segment.endTime - segment.startTime;

      // Calculate new end time
      const newEndTime = newStartTime + segmentDuration;

      // Make sure we don't go beyond project boundaries
      const clampedStartTime = Math.max(0, newStartTime);
      const clampedEndTime = Math.min(project.duration, newEndTime);

      console.log(
        `Updating segment timing: start=${clampedStartTime}, end=${clampedEndTime}`
      );

      // Update the segment timing with the action
      dispatch(
        updateSegmentTiming({
          segmentId,
          startTime: clampedStartTime,
          endTime: clampedEndTime,
        })
      );

      // Provide feedback
      toast.success(`Moved segment to ${formatTime(clampedStartTime)}`);
    } catch (error) {
      console.error("Error moving segment:", error);
      toast.error(
        "Failed to move segment: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="h-screen mx-4 flex flex-col overflow-hidden">
      {/* Header area with presentation preview */}
      <div className="flex items-center justify-between p-2 border-b">
        <div>
          <h1 className="text-xl font-bold">Audio Editor</h1>
          <p className="text-xs text-muted-foreground">
            Edit emcee scripts with background sounds and presentation sync
          </p>
        </div>

        {/* Presentation preview */}
        <div className="bg-muted rounded-md w-[200px] h-[112px] flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            Presentation Preview
          </span>
        </div>
      </div>

      {/* Main content area - fills remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline and controls - fixed height */}
        <div className="p-1 border-b">
          <div className="overflow-x-auto">
            <Timeline
              duration={project.duration}
              currentTime={currentTime}
              segments={allSegments}
              zoomLevel={zoomLevel}
              onSeek={handleSeek}
              formatTime={formatTime}
            />
          </div>

          <div className="mt-1">
            <AudioControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={project.duration}
              volume={masterVolume}
              onPlayPause={togglePlayback}
              onSkipBack={() => {
                stopAllAudio();
                dispatch(setCurrentTime(Math.max(0, currentTime - 5)));
              }}
              onSkipForward={() => {
                stopAllAudio();
                dispatch(
                  setCurrentTime(Math.min(project.duration, currentTime + 5))
                );
              }}
              onVolumeChange={(newVolume) =>
                dispatch(setMasterVolume(newVolume))
              }
              onSave={() => toast.info("Save functionality coming soon")}
              onImport={() =>
                toast.info("Import will be implemented in the next update")
              }
              onExport={() => toast.info("Export functionality coming soon")}
              formatTime={formatTime}
              isLoading={isLoading}
            />

            <div className="text-xs text-muted-foreground text-center">
              {getPlayingSegmentsInfo()}
            </div>
          </div>
        </div>

        {/* Tracks and tabs container - fills remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tracks section - fills available space with scrolling */}
          <div className="flex-1 overflow-y-auto p-1">
            <div className="space-y-0.5 mb-1">
              {project.tracks.map((track) => (
                <div
                  key={`track-container-${track.id}`}
                  className="rounded-none hover:bg-accent/5 transition-colors"
                >
                  <Track
                    key={track.id}
                    track={track}
                    isSelected={selectedTrack === track.id}
                    currentTime={currentTime}
                    duration={project.duration}
                    onSelect={() => dispatch(setSelectedTrack(track.id))}
                    onVolumeChange={(volume) =>
                      dispatch(updateTrackVolume({ trackId: track.id, volume }))
                    }
                    onToggleMute={() => dispatch(toggleTrackMute(track.id))}
                    onAddSegment={() =>
                      toast.info("Add segment functionality coming soon")
                    }
                    onPlaySegment={playSegmentAudio}
                    onDeleteSegment={(segmentId) => {
                      // Find the segment to get its info for the toast message
                      const segment = allSegments.find(
                        (s) => s.id === segmentId
                      );

                      if (!segment) {
                        toast.error("Segment not found");
                        return;
                      }

                      const segmentName = segment.content || "segment";

                      // Stop audio playback if this segment is playing
                      if (segment.audioUrl) {
                        stopAllAudio();

                        // If it's a blob URL, revoke it to free up memory
                        if (segment.audioUrl.startsWith("blob:")) {
                          try {
                            revokeAudioFileUrl(segment.audioUrl);
                            console.log(
                              `Revoked blob URL for deleted segment: ${segmentId}`
                            );
                          } catch (error) {
                            console.error("Error revoking blob URL:", error);
                          }
                        }
                      }

                      // Delete the segment
                      dispatch(deleteSegment(segmentId));

                      // Show success message
                      toast.success(`Deleted ${segmentName}`);
                    }}
                    onMoveSegment={handleMoveSegment}
                    onToggleLock={() => dispatch(toggleTrackLock(track.id))}
                    onImportMedia={() => importMediaToTrack(track.id)}
                    onFileDrop={(files, dropPosition) =>
                      handleDirectFileDrop(track.id, files, dropPosition)
                    }
                    formatDuration={formatDuration}
                    onTrimSegment={handleTrimSegment}
                  />
                </div>
              ))}

              {/* Add track button */}
              <div className="text-center py-1 flex items-center justify-between">
                <AddTrackDialog
                  ref={addTrackDialogRef}
                  onAddTrack={(type, name) => {
                    dispatch(addTrack({ type, name }));
                    toast.success(`Added new ${type} track: ${name}`);
                  }}
                />

                {/* Keyboard shortcuts dialog */}
                <ShortcutsDialog
                  shortcutGroups={shortcutGroups}
                  open={showShortcutsDialog}
                  onOpenChange={setShowShortcutsDialog}
                />
              </div>
            </div>
          </div>

          {/* Tabs section - fixed height for panel content */}
          <div className="h-[300px] border-t">
            <Tabs defaultValue="script" className="w-full h-full">
              <TabsList className="w-full grid grid-cols-3 bg-muted">
                <TabsTrigger value="script">Emcee Script</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
                <TabsTrigger value="presentation">Presentation</TabsTrigger>
              </TabsList>

              <div className="p-2 h-[calc(100%-40px)] overflow-auto">
                <TabsContent value="script" className="m-0 h-full">
                  {/* ...existing code... */}
                </TabsContent>

                <TabsContent value="background" className="m-0 h-full">
                  {/* ...existing code... */}
                </TabsContent>

                <TabsContent value="presentation" className="m-0 h-full">
                  {/* ...existing code... */}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {trimming && (
        <AudioTrimmer
          audioUrl={trimming.audioUrl}
          segmentId={trimming.segmentId}
          segmentName={trimming.name}
          onSave={handleSaveTrim}
          onCancel={() => dispatch(setTrimming(null))}
        />
      )}
    </div>
  );
}
