"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Plus,
  Save,
  Upload,
  Download,
} from "lucide-react";
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

// Import server actions
import {
  generateSegmentAudio,
  saveProject,
  exportProjectAudio,
} from "@/app/actions/playground/audio-editor";

// Import the audio utilities
import {
  createAudioManager,
  getAudioFileDuration,
  createAudioFileUrl,
  revokeAudioFileUrl,
} from "@/lib/audio-utils";

// Define types for better type safety
interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  audioUrl: string | null;
  status: "draft" | "generating" | "generated" | "failed";
}

interface AudioTrack {
  id: number;
  type: "emcee" | "background" | "effects";
  name: string;
  volume: number;
  muted: boolean;
  color: string;
  locked: boolean;
  segments: AudioSegment[];
}

interface PresentationSlide {
  id: number;
  title: string;
  time: number;
  imageUrl: string;
  notes: string;
}

interface ProjectData {
  id: string;
  name: string;
  duration: number;
  tracks: AudioTrack[];
  currentTime: number;
  masterVolume: number;
  slides: PresentationSlide[];
}

// Add debugging helper for audio URLs
const debugAudioUrl = (url: string): string => {
  // For blob URLs, create a reliable URL
  if (url.startsWith("blob:")) {
    try {
      // Log for debugging
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

export default function AudioEditorPlayground() {
  const [projectData, setProjectData] = useState<ProjectData>({
    id: uuidv4(),
    name: "New Project",
    duration: 60,
    tracks: [
      {
        id: 1,
        type: "emcee",
        name: "Emcee Voice",
        volume: 100,
        muted: false,
        color: "#4f46e5",
        locked: false,
        segments: [],
      },
      {
        id: 2,
        type: "background",
        name: "Background Music",
        volume: 50,
        muted: false,
        color: "#10b981",
        locked: false,
        segments: [],
      },
      {
        id: 3,
        type: "effects",
        name: "Sound Effects",
        volume: 70,
        muted: false,
        color: "#f59e0b",
        locked: false,
        segments: [],
      },
    ],
    currentTime: 0,
    masterVolume: 80,
    slides: [],
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [editingScript, setEditingScript] = useState<string>("");
  const [trimming, setTrimming] = useState<{
    segmentId: string;
    trackId: number;
    audioUrl: string;
    name: string;
  } | null>(null);

  const audioManager = useRef(
    createAudioManager({
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
    })
  );

  const fileUrlsRef = useRef<string[]>([]);

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playingSegmentsRef = useRef<Set<string>>(new Set());
  const playbackDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const currentTrack =
    projectData.tracks.find((track) => track.id === selectedTrack) ||
    projectData.tracks[0];
  const allSegments = projectData.tracks.flatMap((track) => track.segments);

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

  const togglePlayback = () => {
    if (!isPlaying) {
      audioManager.current.stopAll();
      playingSegmentsRef.current.clear();

      const segmentsToPlay = allSegments.filter(
        (segment) =>
          segment.status === "generated" &&
          segment.audioUrl !== null &&
          projectData.currentTime >= segment.startTime &&
          projectData.currentTime <= segment.endTime
      );

      segmentsToPlay.forEach((segment, index) => {
        const track = projectData.tracks.find((t) =>
          t.segments.some((s) => s.id === segment.id)
        );

        if (track && !track.muted) {
          const effectiveVolume =
            (track.volume / 100) * (projectData.masterVolume / 100);
          const segmentProgress = projectData.currentTime - segment.startTime;

          playingSegmentsRef.current.add(segment.id);

          setTimeout(() => {
            audioManager.current.play(segment.id, segment.audioUrl!, {
              volume: effectiveVolume,
              currentTime: segmentProgress,
            });
          }, index * 100);
        }
      });
    } else {
      audioManager.current.stopAll();
      playingSegmentsRef.current.clear();

      Object.values(playbackDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
      playbackDebounceTimers.current = {};
    }

    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }

      let lastUpdateTime = Date.now();

      playbackIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        setProjectData((prev) => {
          const newTime = prev.currentTime + elapsedSeconds;

          if (newTime >= prev.duration) {
            setIsPlaying(false);
            audioManager.current.stopAll();
            playingSegmentsRef.current.clear();
            return { ...prev, currentTime: 0 };
          }

          const shouldBePlayingSegments = allSegments.filter(
            (segment) =>
              segment.status === "generated" &&
              segment.audioUrl !== null &&
              newTime >= segment.startTime &&
              newTime <= segment.endTime
          );

          const shouldStopSegments = Array.from(
            playingSegmentsRef.current
          ).filter(
            (segmentId) =>
              !shouldBePlayingSegments.some((s) => s.id === segmentId)
          );

          shouldStopSegments.forEach((segmentId) => {
            playingSegmentsRef.current.delete(segmentId);

            if (audioManager.current.isPlaying(segmentId)) {
              audioManager.current.pause(segmentId);
            }

            if (playbackDebounceTimers.current[segmentId]) {
              clearTimeout(playbackDebounceTimers.current[segmentId]);
              delete playbackDebounceTimers.current[segmentId];
            }
          });

          shouldBePlayingSegments.forEach((segment) => {
            if (playingSegmentsRef.current.has(segment.id)) {
              return;
            }

            const track = prev.tracks.find((t) =>
              t.segments.some((s) => s.id === segment.id)
            );

            if (!track || track.muted) {
              return;
            }

            const effectiveVolume =
              (track.volume / 100) * (prev.masterVolume / 100);

            const segmentProgress = newTime - segment.startTime;

            playingSegmentsRef.current.add(segment.id);

            if (playbackDebounceTimers.current[segment.id]) {
              clearTimeout(playbackDebounceTimers.current[segment.id]);
            }

            playbackDebounceTimers.current[segment.id] = setTimeout(() => {
              if (
                playingSegmentsRef.current.has(segment.id) &&
                !audioManager.current.isPlaying(segment.id)
              ) {
                console.log(
                  `Starting segment ${
                    segment.id
                  } at position ${segmentProgress.toFixed(2)}s`
                );

                audioManager.current.play(segment.id, segment.audioUrl!, {
                  volume: effectiveVolume,
                  currentTime: segmentProgress,
                });
              }

              delete playbackDebounceTimers.current[segment.id];
            }, 300);
          });

          return { ...prev, currentTime: newTime };
        });
      }, 50);
    } else {
      audioManager.current.stopAll();
      playingSegmentsRef.current.clear();

      Object.values(playbackDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
      playbackDebounceTimers.current = {};

      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }

      audioManager.current.stopAll();
      playingSegmentsRef.current.clear();

      Object.values(playbackDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, [isPlaying, allSegments]);

  useEffect(() => {
    const currentSegment = allSegments.find(
      (segment) =>
        projectData.currentTime >= segment.startTime &&
        projectData.currentTime <= segment.endTime
    );

    if (currentSegment && currentSegment.id !== activeSegment) {
      setActiveSegment(currentSegment.id);
      setEditingScript(currentSegment.content);
    }
  }, [projectData.currentTime, allSegments, activeSegment]);

  useEffect(() => {
    return () => {
      audioManager.current.dispose();
      fileUrlsRef.current.forEach((url) => {
        revokeAudioFileUrl(url);
      });
    };
  }, []);

  const getPlayingSegmentsInfo = () => {
    const playing = allSegments.filter(
      (segment) =>
        segment.audioUrl &&
        projectData.currentTime >= segment.startTime &&
        projectData.currentTime <= segment.endTime
    );

    return playing.length > 0
      ? `Playing ${playing.length} segment(s)`
      : "No segments at current position";
  };

  const importMediaToTrack = async (trackId: number) => {
    const track = projectData.tracks.find((t) => t.id === trackId);
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

        setIsLoading(true);
        toast.info(`Analyzing ${files.length} audio file(s)...`);

        const fileArray = Array.from(files);
        let currentTime = projectData.currentTime;
        const newSegments: AudioSegment[] = [];

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

            // Create a new segment
            const segment: AudioSegment = {
              id: uuidv4(),
              startTime: currentTime,
              endTime: currentTime + duration,
              content: file.name,
              audioUrl: fileUrl,
              status: "generated",
            };

            newSegments.push(segment);
            currentTime += duration + 1; // Add a 1-second gap between segments
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`);
          }
        }

        if (newSegments.length === 0) {
          toast.error("No valid audio files were imported");
          setIsLoading(false);
          return;
        }

        // Update project data with new segments
        setProjectData((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trackId
              ? { ...t, segments: [...t.segments, ...newSegments] }
              : t
          ),
        }));

        toast.success(
          `Added ${newSegments.length} audio file${
            newSegments.length > 1 ? "s" : ""
          } to ${track.name}`
        );

        // Offer to trim if only one file was added
        if (newSegments.length === 1) {
          setTimeout(() => {
            setTrimming({
              segmentId: newSegments[0].id,
              trackId: trackId,
              audioUrl: newSegments[0].audioUrl!,
              name: fileArray[0].name,
            });
          }, 500);
        }
      } catch (error) {
        console.error("Error importing audio files:", error);
        toast.error("Failed to import audio files");
      } finally {
        setIsLoading(false);
      }
    };

    // Open the file picker
    input.click();
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Audio Editor Playground
      </h1>
      <p className="text-center mb-8 text-muted-foreground">
        Edit emcee scripts in layers with background sounds and presentation
        sync
      </p>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <Timeline
              duration={projectData.duration}
              currentTime={projectData.currentTime}
              segments={allSegments}
              zoomLevel={zoomLevel}
              onSeek={(newTime) => {
                audioManager.current.stopAll();
                playingSegmentsRef.current.clear();

                Object.values(playbackDebounceTimers.current).forEach(
                  (timer) => {
                    clearTimeout(timer);
                  }
                );
                playbackDebounceTimers.current = {};

                setProjectData((prev) => ({
                  ...prev,
                  currentTime: Math.max(0, Math.min(newTime, prev.duration)),
                }));

                if (isPlaying) {
                  setTimeout(togglePlayback, 50);
                  setTimeout(() => setIsPlaying(true), 100);
                }
              }}
              formatTime={formatTime}
            />

            <div className="mb-4">
              <AudioControls
                isPlaying={isPlaying}
                currentTime={projectData.currentTime}
                duration={projectData.duration}
                volume={projectData.masterVolume}
                onPlayPause={togglePlayback}
                onSkipBack={() => {
                  audioManager.current.stopAll();
                  playingSegmentsRef.current.clear();

                  Object.values(playbackDebounceTimers.current).forEach(
                    (timer) => {
                      clearTimeout(timer);
                    }
                  );
                  playbackDebounceTimers.current = {};

                  setProjectData((prev) => ({
                    ...prev,
                    currentTime: Math.max(0, prev.currentTime - 5),
                  }));

                  if (isPlaying) {
                    setTimeout(togglePlayback, 50);
                    setTimeout(() => setIsPlaying(true), 100);
                  }
                }}
                onSkipForward={() => {
                  audioManager.current.stopAll();
                  playingSegmentsRef.current.clear();

                  Object.values(playbackDebounceTimers.current).forEach(
                    (timer) => {
                      clearTimeout(timer);
                    }
                  );
                  playbackDebounceTimers.current = {};

                  setProjectData((prev) => ({
                    ...prev,
                    currentTime: Math.min(prev.duration, prev.currentTime + 5),
                  }));

                  if (isPlaying) {
                    setTimeout(togglePlayback, 50);
                    setTimeout(() => setIsPlaying(true), 100);
                  }
                }}
                onVolumeChange={(newVolume) =>
                  setProjectData((prev) => ({
                    ...prev,
                    masterVolume: newVolume,
                  }))
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
              {projectData.tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack === track.id}
                  currentTime={projectData.currentTime}
                  duration={projectData.duration}
                  onSelect={() => setSelectedTrack(track.id)}
                  onVolumeChange={(volume) =>
                    setProjectData((prev) => ({
                      ...prev,
                      tracks: prev.tracks.map((t) =>
                        t.id === track.id ? { ...t, volume } : t
                      ),
                    }))
                  }
                  onToggleMute={() =>
                    setProjectData((prev) => ({
                      ...prev,
                      tracks: prev.tracks.map((t) =>
                        t.id === track.id ? { ...t, muted: !t.muted } : t
                      ),
                    }))
                  }
                  onAddSegment={() =>
                    toast.info("Add segment functionality coming soon")
                  }
                  onPlaySegment={() =>
                    toast.info("Play segment functionality coming soon")
                  }
                  onDeleteSegment={() =>
                    toast.info("Delete segment functionality coming soon")
                  }
                  onMoveSegment={() =>
                    toast.info("Move segment functionality coming soon")
                  }
                  onToggleLock={() =>
                    setProjectData((prev) => ({
                      ...prev,
                      tracks: prev.tracks.map((t) =>
                        t.id === track.id ? { ...t, locked: !t.locked } : t
                      ),
                    }))
                  }
                  onImportMedia={() => importMediaToTrack(track.id)}
                  formatDuration={formatDuration}
                  onTrimSegment={() =>
                    toast.info("Trim segment functionality coming soon")
                  }
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

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="script">Emcee Script</TabsTrigger>
            <TabsTrigger value="background">Background Sounds</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
          </TabsList>

          <TabsContent value="script">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Emcee Script Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Edit your emcee script here. Changes will be reflected in the
                  audio track.
                </p>

                <ScriptEditor
                  content={editingScript}
                  onChange={setEditingScript}
                  onSave={() =>
                    toast.info("Save script functionality coming soon")
                  }
                  onGenerate={() =>
                    toast.info("Generate audio functionality coming soon")
                  }
                  onPlay={() =>
                    toast.info("Play audio functionality coming soon")
                  }
                  isGenerating={isLoading}
                  hasAudio={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="background">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">
                  Background Sound Library
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose background music and sound effects for your
                  presentation.
                </p>

                <BackgroundSoundManager
                  onAddToTrack={(soundUrl, trackId, metadata) =>
                    toast.info("Add background sound functionality coming soon")
                  }
                  trackId={2}
                  projectDuration={projectData.duration}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presentation">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Presentation Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Synchronize your presentation slides with the audio timeline.
                </p>

                <PresentationLayer
                  currentTime={projectData.currentTime}
                  duration={projectData.duration}
                  onAddSlideMarker={(time, slideData) =>
                    toast.info("Add slide marker functionality coming soon")
                  }
                  onUpdateSlide={(slideId, slideData) =>
                    toast.info("Update slide functionality coming soon")
                  }
                  onRemoveSlide={(slideId) =>
                    toast.info("Remove slide functionality coming soon")
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {trimming && (
        <AudioTrimmer
          audioUrl={trimming.audioUrl}
          segmentId={trimming.segmentId}
          segmentName={trimming.name}
          onSave={(segmentId, startTime, endTime) =>
            toast.info("Save trim functionality coming soon")
          }
          onCancel={() => setTrimming(null)}
        />
      )}
    </div>
  );
}
