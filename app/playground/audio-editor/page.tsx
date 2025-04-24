"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
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
  setMasterVolume,
  setSelectedTrack,
  addSegments,
  updateSegmentTiming,
  setTrimming,
  setEditingScript,
  toggleTrackMute,
  toggleTrackLock,
  updateTrackVolume,
  setIsLoading,
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

  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Audio Editor Playground
      </h1>
      <p className="text-center mb-8 text-muted-foreground">
        Edit emcee scripts in layers with background sounds and presentation
        sync.
      </p>

      {/* Add test audio button */}
      <div className="mb-4 flex justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const testAudio = new Audio(
              "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABTgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJALGQQAAgAAAUi4NqpAAAAAAAAAAAAAAAAD/++DEAAAIoAFnlAAABRiCLPKAAAEEIbn7t9vu/7vd+FBMQglDEFYICAgQhCEJ4nCAIBn/w4EAQ//CCEIQn//CAIAgEAQBAEAQBAEAzcIQhCEIBgCDw+CfP/Lg8HwfB8Hw+D4Ph8Hw+D4Pj/5cHg+D4Pn/ywQBAEAQBAMQTN4gCAIRh+X//hG12kkkkkkk/4hGIRiEMQhGIQjEIhCMQiEYhGIQjEIhGIRiEIxCMQhGIQjEIRiEQjEIhGIRiEIRiEYhGIQjEIRiEYhCEYhGIQjEIRiEYhCEYhEIRiEYhCMQhGIQhGIQjEIRiEIxCEYhGIQjEIRiEYhCEYhGIQjEIRiEYhCMQhCMQhGIQjEQgAIBgEAQCCQyHSTLJJJJJJJJJJJJJJJJJJJPEIxCMQjEIRiEIxCEYhGIQjEIRiEYhCMQhGIRiEIxCEYhCMQjEIRiEIxCEYhGIQjEIRiEYhCEYhGIQjEIRiEIxCEYhGIQhGIRiEIxCEYhGIQjEIRiEIxCMQhGIQjEIRiEYhCMQhGIRiEIxCEIxCMQhGIQjEIRiEIxCEIKAAIAQDwCAAAAAAAAH0AACEAgGAQCBJJJJJJJJJN27f//////mWTk5OScnJycnJyxnJyxv///7m5vyRIBAIBkEhmSSSSSbJJJJJJJJJJJO//tWHfWlDrlWTIgARAQeXrFYoRqoGBx8YH//8KO86JJLZGA1MZbhL2IZxb//9xFKRIoUFDASbQAw0BSs1//8Wfi9nGRZplsNJJHDxwsdXs+NNOI+lQRs7v//8sqoSELsUGClOGBgYVjq8dOT3///4tM4//vgxF8AHD4Q1faKAAMawfK80kACIrYdHWc5rWRJgkAQFAI8dY8DRrh55QkKdSXv///3TOoVCSSdC4wJjgcGgkFg8dEq1Ju///5vXOJCJzowIcLGAYODRFxAadRwpwKMEgEHw+Pwc63u///95tkyJLI2EhxJGgg4OFISiSZtOLX///+VaSJnODYcGCgqPDAQHDRcFDTqdRGOTJGCwkBgYNBf9F3f///2LnMESCsYLBwJGkk6Dg8UEgyNOu9f////LLMKiyMChgiJjQUJCQoLGnLkJgMSNHAVnAh7vd////JZlhQbHBImLjQ8PEhIIiUbHHTXX/////Xk1qoJHRosKjQsICQkKBwyHwgVSIiCRxZAgMPv/X////0LNESDQwKCgkYHB4YFwgaPMqUVx1///5JqPG2/u7u7u7u7u7u7vd3d3TLu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7d3d6ZJd3d33d3d3d3d3dmSXd3d93d3d3d3d3d3d3d3d3d3d3d3d3d6ZZd3d3d3d3d3d3dmaZd3dmZJd3d2ZJmQDu7szMmaZd3dnFku7u7oAA7u7Mku7u7u7uQDu7u7IAAAzMzMAAAAA="
            );
            testAudio.volume = 0.2;

            // Play a test sound and report results
            testAudio
              .play()
              .then(() => {
                toast.success("Audio test successful!");
              })
              .catch((err) => {
                console.error("Audio test failed:", err);
                toast.error("Audio test failed: " + err.message);
              });
          }}
        >
          Test Audio
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <Timeline
              duration={project.duration}
              currentTime={currentTime}
              segments={allSegments}
              zoomLevel={zoomLevel}
              onSeek={(newTime) => {
                stopAllAudio();
                dispatch(
                  setCurrentTime(
                    Math.max(0, Math.min(newTime, project.duration))
                  )
                );
              }}
              formatTime={formatTime}
            />

            <div className="mb-4">
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

              <div className="text-xs text-muted-foreground text-center mt-1">
                {getPlayingSegmentsInfo()}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {project.tracks.map((track) => (
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
                  onDeleteSegment={() =>
                    toast.info("Delete segment functionality coming soon")
                  }
                  onMoveSegment={() =>
                    toast.info("Move segment functionality coming soon")
                  }
                  onToggleLock={() => dispatch(toggleTrackLock(track.id))}
                  onImportMedia={() => importMediaToTrack(track.id)}
                  formatDuration={formatDuration}
                  onTrimSegment={handleTrimSegment}
                />
              ))}

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() =>
                  toast.info("Track creation functionality coming soon")
                }
              >
                <Plus className="h-4 w-4" />
                Add Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs section remains largely unchanged */}
        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="script">Emcee Script</TabsTrigger>
            <TabsTrigger value="background">Background Sounds</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
          </TabsList>

          {/* Script editor tab */}
          <TabsContent value="script">{/* ...existing code... */}</TabsContent>

          {/* Background tab */}
          <TabsContent value="background">
            {/* ...existing code... */}
          </TabsContent>

          {/* Presentation tab */}
          <TabsContent value="presentation">
            {/* ...existing code... */}
          </TabsContent>
        </Tabs>
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
