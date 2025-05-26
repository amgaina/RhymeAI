"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getEventById } from "@/app/actions/event";
import { EventData } from "@/app/actions/event";
import { ScriptSegment } from "@/types/event";
import { AudioSegment, adaptSegmentStatus } from "@/types/audio-editor";
import { toast } from "sonner";
import { getPresignedUrl } from "@/lib/s3-utils"; // Import S3 utilities
import { v4 as uuidv4 } from "uuid";

// Import Redux hooks and actions
import {
  useAppDispatch,
  useAppSelector,
  selectProject,
  selectCurrentTime,
  selectMasterVolume,
  selectAllSegments,
  selectTrimming,
  addSegments,
  setCurrentTime,
  updateSegmentTiming,
  setTrimming,
  setMasterVolume,
  setIsLoading,
} from "@/components/providers/AudioPlaybackProvider";

// Import components from the playground
import Timeline from "@/components/playground/audio-editor/Timeline";
import Track from "@/components/playground/audio-editor/Track";
import AudioControls from "@/components/playground/audio-editor/AudioControls";
import AudioTrimmer from "@/components/playground/audio-editor/AudioTrimmer";
import { useAudioPlayback } from "@/lib/hooks/useAudioPlayback";
import {
  getScriptSegments,
  updateScriptSegment,
} from "@/app/actions/event/script";

export default function EventAudioEditor() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redux state
  const dispatch = useAppDispatch();
  const project = useAppSelector(selectProject);
  const currentTime = useAppSelector(selectCurrentTime);
  const masterVolume = useAppSelector(selectMasterVolume);
  const allSegments = useAppSelector(selectAllSegments);
  const trimming = useAppSelector(selectTrimming);

  // Audio playback hooks
  const { isPlaying, togglePlayback, playSegmentAudio, stopAllAudio } =
    useAudioPlayback();

  // Format time helper function
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Load event data and initialize audio editor
  useEffect(() => {
    async function loadEventData() {
      try {
        dispatch(setIsLoading(true));

        // Get event data
        const eventResult = await getEventById(eventId);
        if (!eventResult.success || !eventResult.event) {
          setError(eventResult.error || "Failed to load event");
          return;
        }

        setEvent(eventResult.event);

        console.log("event", eventResult);

        // Get script segments
        const segmentsResult = await getScriptSegments(eventId);
        if (segmentsResult.success && segmentsResult.segments) {
          // Convert script segments to audio segments
          const audioSegments = segmentsResult.segments.map(
            (segment: any, index: number) => {
              const durationInSeconds = segment.timing || 60;
              return {
                id: segment.id.toString(),
                startTime: index * durationInSeconds,
                endTime: (index + 1) * durationInSeconds,
                content: segment.content || "",
                audioUrl: segment.audio || null,
                status: adaptSegmentStatus(segment.status || "draft"),
              } as AudioSegment;
            }
          );

          // Add segments to track 1 (emcee track)
          if (audioSegments.length > 0) {
            dispatch(addSegments({ trackId: 1, segments: audioSegments }));
          }
        }
      } catch (err) {
        console.error("Error loading event data:", err);
        setError("An error occurred while loading the event");
      } finally {
        dispatch(setIsLoading(false));
        setLoading(false);
      }
    }

    loadEventData();
  }, [eventId, dispatch]);

  // Handle saving audio changes back to the event
  const handleSaveAudioChanges = async () => {
    try {
      dispatch(setIsLoading(true));
      toast.info("Saving audio changes...");

      // For each segment, update the script segment in the database
      for (const segment of allSegments) {
        await updateScriptSegment(segment.id, {
          // Only update relevant fields - timing and audio_url
          timing: Math.round(segment.endTime - segment.startTime),
          audio_url: segment.audioUrl || undefined,
        });
      }

      toast.success("Audio changes saved successfully");
    } catch (error) {
      console.error("Error saving audio changes:", error);
      toast.error("Failed to save audio changes");
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // Handle seek in timeline
  const handleSeek = useCallback(
    (newTime: number) => {
      stopAllAudio();
      dispatch(
        setCurrentTime(Math.max(0, Math.min(newTime, project.duration)))
      );
    },
    [dispatch, project.duration, stopAllAudio]
  );

  // Handle trim save
  const handleSaveTrim = useCallback(
    (segmentId: string, startTime: number, endTime: number) => {
      dispatch(updateSegmentTiming({ segmentId, startTime, endTime }));
      dispatch(setTrimming(null));
      toast.success("Audio segment trimmed successfully");
    },
    [dispatch]
  );

  // Handle adding a new segment
  const handleAddSegment = useCallback(
    (trackId: number) => {
      // Find the last segment in this track to calculate the start time
      const trackSegments = allSegments.filter(
        (segment) => segment.trackId === trackId
      );

      let startTime = 0;

      // If there are existing segments, set the start time after the last segment
      if (trackSegments.length > 0) {
        const lastSegment = trackSegments.reduce(
          (latest, segment) =>
            segment.endTime > latest.endTime ? segment : latest,
          trackSegments[0]
        );
        startTime = lastSegment.endTime;
      }

      // Create a new segment
      const newSegment: AudioSegment = {
        id: uuidv4(),
        trackId: trackId,
        startTime: startTime,
        endTime: startTime + 60, // Default 60 seconds duration
        content: "New Segment",
        audioUrl: null,
        status: "draft",
      };

      // Add the segment to the track
      dispatch(addSegments({ trackId, segments: [newSegment] }));

      // Show a success message
      toast.success("New segment added");
    },
    [allSegments, dispatch]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading audio editor...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          Error: {error || "Event not found"}
        </div>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
          <h1 className="text-xl font-bold ml-4">
            {event.name} - Audio Editor
          </h1>
        </div>
        <Button onClick={handleSaveAudioChanges}>Save Changes</Button>
      </div>

      {/* Timeline and controls */}
      <div className="p-4 border-b">
        <Timeline
          duration={project.duration}
          currentTime={currentTime}
          segments={allSegments}
          zoomLevel={1}
          onSeek={handleSeek}
          formatTime={formatTime}
        />

        <div className="mt-2">
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
            onVolumeChange={(newVolume) => dispatch(setMasterVolume(newVolume))}
            onSave={handleSaveAudioChanges}
            onImport={() => toast.info("Import functionality coming soon")}
            onExport={() => toast.info("Export functionality coming soon")}
            formatTime={formatTime}
            isLoading={false}
          />
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto p-4">
        {project.tracks.map((track) => (
          <div key={track.id} className="mb-2">
            <Track
              track={track}
              isSelected={true}
              currentTime={currentTime}
              duration={project.duration}
              onSelect={() => {}}
              onVolumeChange={() => {}}
              onToggleMute={() => {}}
              onAddSegment={() => handleAddSegment(track.id)}
              onPlaySegment={playSegmentAudio}
              onDeleteSegment={() => {}}
              onMoveSegment={() => {}}
              onToggleLock={() => {}}
              onImportMedia={() => {}}
              onFileDrop={() => {}}
              formatDuration={formatTime}
              onTrimSegment={(segmentId) => {
                const segment = allSegments.find((s) => s.id === segmentId);
                if (segment && segment.audioUrl) {
                  dispatch(
                    setTrimming({
                      segmentId,
                      trackId: track.id,
                      audioUrl: segment.audioUrl,
                      name: segment.content || "Segment",
                    })
                  );
                } else {
                  toast.error("No audio available for this segment");
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Trimming dialog */}
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
