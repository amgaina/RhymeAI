"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  Layers,
  PlusCircle,
  Play,
  Pause,
  Upload,
  Lock,
  UnlockIcon,
  MoreHorizontal,
  Scissors,
  Trash,
} from "lucide-react";
import { Waveform } from "@/components/Waveform";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AudioSegment, AudioTrack } from "@/types/audio-editor";
import { useAudioPlayback } from "@/lib/hooks/useAudioPlayback";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

// Helper function to format duration
const formatSegmentDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface TrackProps {
  track: AudioTrack;
  isSelected: boolean;
  currentTime: number;
  duration: number;
  onSelect: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onAddSegment: () => void;
  onPlaySegment: (segmentId: string) => void;
  onDeleteSegment: (segmentId: string) => void;
  onMoveSegment: (segmentId: string, newTime: number) => void;
  onToggleLock: () => void;
  onImportMedia: () => void;
  onFileDrop?: (files: File[], dropPosition: number) => void; // Add this prop
  formatDuration: (seconds: number) => string;
  onTrimSegment: (segmentId: string) => void;
}

export default function Track({
  track,
  isSelected,
  currentTime,
  duration,
  onSelect,
  onVolumeChange,
  onToggleMute,
  onAddSegment,
  onPlaySegment,
  onDeleteSegment,
  onMoveSegment,
  onToggleLock,
  onImportMedia,
  onFileDrop, // Add this to the component props
  onTrimSegment,
  formatDuration = formatSegmentDuration,
}: TrackProps) {
  const [draggingSegment, setDraggingSegment] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<AudioSegment | null>(
    null
  );
  const [showSegmentInfo, setShowSegmentInfo] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Get the actual playing segments to sync UI state
  const { playingSegments } = useAudioPlayback();

  // Sync local playing state with actual audio playback state
  useEffect(() => {
    const updatedPlayingState: Record<string, boolean> = {};

    // Update each segment's playing state based on the global playback state
    track.segments.forEach((segment) => {
      updatedPlayingState[segment.id] = playingSegments.includes(segment.id);
    });

    setIsPlaying(updatedPlayingState);
  }, [playingSegments, track.segments]);

  const renderTrackIcon = () => {
    switch (track.type) {
      case "emcee":
        return <Mic className="h-4 w-4" style={{ color: track.color }} />;
      case "background":
        return <Music className="h-4 w-4" style={{ color: track.color }} />;
      case "effects":
        return <Layers className="h-4 w-4" style={{ color: track.color }} />;
      default:
        return null;
    }
  };

  // Improved drag and drop handlers
  const handleSegmentDragStart = (e: React.DragEvent, segmentId: string) => {
    if (track.locked) {
      e.preventDefault();
      toast.error("Track is locked. Unlock it to move segments.");
      return;
    }

    console.log(`Starting drag for segment ${segmentId}`);

    // Store the segment ID as plain text (most reliable format)
    e.dataTransfer.setData("text/plain", segmentId);

    // Set effectAllowed to all operations
    e.dataTransfer.effectAllowed = "all";

    // Set dragging segment state
    setDraggingSegment(segmentId);
  };

  const handleTrackDragOver = (e: React.DragEvent) => {
    if (track.locked) return;

    // Must call preventDefault to allow drop
    e.preventDefault();
  };

  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (track.locked) {
      toast.error("Cannot drop on a locked track");
      return;
    }

    // Get segment ID from dataTransfer
    const segmentId = e.dataTransfer.getData("text/plain");

    if (!segmentId) {
      console.error("Missing segment ID in drop event");
      return;
    }

    if (!trackRef.current) {
      console.error("Missing track ref");
      return;
    }

    console.log(`Dropping segment ${segmentId}`);

    try {
      // Calculate dropped position
      const rect = trackRef.current.getBoundingClientRect();
      const dropPositionX = e.clientX - rect.left;

      // Convert position to time
      const dropTimePosition = (dropPositionX / rect.width) * duration;

      // Round to nearest 0.1 second
      const roundedTime = Math.round(dropTimePosition * 10) / 10;

      console.log(`Drop position: ${dropPositionX}px, time: ${roundedTime}s`);

      // Call the move handler callback with the calculated time
      onMoveSegment(segmentId, roundedTime);
    } catch (error) {
      console.error("Error during segment drop:", error);
      toast.error("Failed to move segment");
    } finally {
      // Clear dragging state
      setDraggingSegment(null);
    }
  };

  const handleSegmentPlay = (segmentId: string) => {
    if (track.muted) {
      // If track is muted, unmute it first before playing
      onToggleMute();
      // Small delay to let the mute state update before playing
      setTimeout(() => {
        onPlaySegment(segmentId);
      }, 50);
    } else {
      // Normal behavior - toggle playback
      onPlaySegment(segmentId);
    }
  };

  // Handle file drag and drop
  const handleFileDragOver = useCallback(
    (e: React.DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();

      // Check if track is locked
      if (track.locked) return;

      // Look for files in the data transfer
      if (e.dataTransfer.types.includes("Files")) {
        setIsDraggingFile(true);
        // Update drop position indicator
        if (trackRef.current) {
          const rect = trackRef.current.getBoundingClientRect();
          const posX = e.clientX - rect.left;
          setDragOverPosition(posX);
        }
      }
    },
    [track.locked]
  );

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if leaving the track (not entering child elements)
    if (!trackRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  }, []);

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      setDragOverPosition(null);

      // Check if track is locked
      if (track.locked) {
        toast.error("Cannot add audio to a locked track");
        return;
      }

      // Check if we have files
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = e.dataTransfer.files;

        // Filter for audio files
        const audioFiles = Array.from(files).filter(
          (file) =>
            file.type.startsWith("audio/") ||
            file.name.endsWith(".mp3") ||
            file.name.endsWith(".wav") ||
            file.name.endsWith(".m4a") ||
            file.name.endsWith(".ogg")
        );

        if (audioFiles.length === 0) {
          toast.error("No valid audio files were dropped");
          return;
        }

        // Calculate drop position
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return;

        const dropX = e.clientX - rect.left;
        const dropTimePosition = (dropX / rect.width) * duration;

        // If we have the direct file drop handler, use it
        if (onFileDrop) {
          toast.info(`Processing ${audioFiles.length} audio file(s)...`);
          onFileDrop(audioFiles, dropTimePosition);
        } else {
          // Fallback to standard import dialog if no direct handler
          toast.info("Uploading audio files through standard import...");
          onImportMedia();
        }
      }
    },
    [track.locked, duration, onImportMedia, onFileDrop]
  );

  // Handle segment double-click to show info
  const handleSegmentDoubleClick = useCallback((segment: AudioSegment) => {
    setSelectedSegment(segment);
    setShowSegmentInfo(true);
  }, []);

  // Close segment info dialog
  const handleCloseSegmentInfo = useCallback(() => {
    setShowSegmentInfo(false);
    setSelectedSegment(null);
  }, []);

  // Calculate track duration for waveform
  const hasAudio = track.segments.some(
    (s) => s.audioUrl !== null && s.status === "generated"
  );

  // Calculate segment width properly
  const calculateSegmentWidth = (segment: AudioSegment) => {
    const segmentDuration = segment.endTime - segment.startTime;
    const widthPercentage = (segmentDuration / duration) * 100;
    // Ensure minimum width for visibility
    return Math.max(2, widthPercentage);
  };

  return (
    <div
      className={`px-1 py-1 ${isSelected ? "bg-muted/40" : ""} ${
        track.locked ? "opacity-75" : ""
      }`}
      onClick={onSelect}
    >
      {/* Ultra compact header row */}
      <div className="flex items-center justify-between mb-0.5 h-6">
        <div className="flex items-center gap-1 overflow-hidden">
          {renderTrackIcon()}
          <span className="text-xs font-medium truncate max-w-[100px]">
            {track.name}
          </span>
          {track.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-1">
          {/* Volume control */}
          <Button
            variant={track.muted ? "destructive" : "ghost"}
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {track.muted ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>

          <Slider
            value={[track.volume]}
            max={100}
            step={1}
            onValueChange={(value) => {
              onVolumeChange(value[0]);
            }}
            disabled={track.muted}
            onClick={(e) => e.stopPropagation()}
            className="w-20 h-1"
          />

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSegment();
                }}
                className="text-xs py-1 h-7"
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                Add Segment
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onImportMedia?.();
                }}
                className="text-xs py-1 h-7"
              >
                <Upload className="h-3 w-3 mr-1" />
                Import Media
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock?.();
                }}
                className="text-xs py-1 h-7"
              >
                {track.locked ? (
                  <>
                    <UnlockIcon className="h-3 w-3 mr-1" />
                    Unlock Track
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Lock Track
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Track waveform with file drop support */}
      <div
        ref={trackRef}
        className={`${
          track.segments.length === 0 ? "h-8" : "h-16"
        } bg-muted/20 relative overflow-hidden ${
          isDraggingFile ? "border-2 border-dashed border-primary" : ""
        }`}
        style={{
          backgroundColor: `${track.color}08`,
        }}
        onDragOver={(e) => {
          // Prevent default to allow drop
          e.preventDefault();

          if (track.locked) return;

          // Check for files or segments
          if (e.dataTransfer.types.includes("Files")) {
            setIsDraggingFile(true);
            // Update drop position indicator
            if (trackRef.current) {
              const rect = trackRef.current.getBoundingClientRect();
              const posX = e.clientX - rect.left;
              setDragOverPosition(posX);
            }
          } else {
            // Handle segment drag
            handleTrackDragOver(e);
          }
        }}
        onDragLeave={(e) => {
          // Only hide indicator if we're actually leaving the track
          if (!trackRef.current?.contains(e.relatedTarget as Node)) {
            setDragOverPosition(null);
            setIsDraggingFile(false);
          }
        }}
        onDrop={(e) => {
          // Reset visual state
          setDragOverPosition(null);

          // Check for file drop vs segment drop
          if (e.dataTransfer.types.includes("Files")) {
            handleFileDrop(e);
          } else {
            handleTrackDrop(e);
          }
        }}
      >
        {/* Timeline ticks - simplified */}
        {Array.from({ length: Math.ceil(duration / 15) }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-border/20 pointer-events-none"
            style={{
              left: `${((i * 15) / duration) * 100}%`,
              opacity: 0.3,
            }}
          />
        ))}

        {/* File drop zone indicator */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none z-50">
            <div className="bg-background/80 rounded-md p-2 text-xs font-medium">
              Drop audio files to add to track
            </div>
          </div>
        )}

        {/* Drop position indicator */}
        {dragOverPosition !== null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-blue-500 z-40 pointer-events-none animate-pulse"
            style={{ left: `${dragOverPosition}px` }}
          />
        )}

        {/* Base waveform visualization */}
        {hasAudio && (
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <Waveform duration={duration} currentTime={currentTime} />
          </div>
        )}

        {/* Current time indicator - thinner */}
        <div
          className="absolute top-0 bottom-0 w-px bg-primary z-30 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Audio segments with double-click support */}
        {track.segments.map((segment) => {
          const segmentWidth = calculateSegmentWidth(segment);
          const segmentLeft = (segment.startTime / duration) * 100;
          const isDragging = draggingSegment === segment.id;

          return (
            <div
              key={segment.id}
              draggable={!track.locked}
              onDragStart={(e) => handleSegmentDragStart(e, segment.id)}
              onDoubleClick={() => handleSegmentDoubleClick(segment)}
              className={`absolute rounded-sm transform transition-opacity ${
                isDragging ? "opacity-40" : "opacity-100"
              } ${
                segment.status === "generated"
                  ? "bg-green-500/10 hover:bg-green-500/20 border-l-2 border-l-green-600"
                  : segment.status === "generating"
                  ? "bg-amber-500/10 hover:bg-amber-500/20 border-l-2 border-l-amber-600"
                  : segment.status === "failed"
                  ? "bg-red-500/10 hover:bg-red-500/20 border-l-2 border-l-red-600"
                  : "bg-blue-500/10 hover:bg-blue-500/20 border-l-2 border-l-blue-600"
              } ${track.muted ? "opacity-50" : ""} ${
                !track.locked ? "cursor-move" : "cursor-not-allowed"
              } group`}
              style={{
                top: "2px",
                left: `${segmentLeft}%`,
                width: `${segmentWidth}%`,
                height: "calc(100% - 4px)",
              }}
              onClick={(e) => e.stopPropagation()}
              title={`${segment.content} (Double-click for details, drag to move)`}
            >
              {/* Minimal content text */}
              <div className="text-[9px] p-0.5 truncate max-w-full opacity-80">
                {segment.content.substring(0, 15)}
                {segment.content.length > 15 ? "..." : ""}
              </div>

              {/* Add drag handle indicator for better UX */}
              {!track.locked && (
                <div className="absolute top-0 left-0 w-full h-4 cursor-move opacity-0 group-hover:opacity-100">
                  <div className="flex justify-center items-center text-[8px] text-muted-foreground">
                    ⣿⣿⣿
                  </div>
                </div>
              )}

              {/* Simplified controls */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                <div className="flex gap-0.5">
                  {segment.audioUrl && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 bg-background/60"
                        onClick={() => handleSegmentPlay(segment.id)}
                      >
                        {isPlaying[segment.id] ? (
                          <Pause className="h-2.5 w-2.5" />
                        ) : (
                          <Play className="h-2.5 w-2.5" />
                        )}
                      </Button>

                      {onTrimSegment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 bg-background/60"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTrimSegment(segment.id);
                          }}
                          title="Trim Audio"
                        >
                          <Scissors className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </>
                  )}

                  {/* Add back the delete button */}
                  {onDeleteSegment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 bg-background/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSegment(segment.id);
                      }}
                      title="Delete Segment"
                    >
                      <Trash className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state - minimal text */}
        {!hasAudio && track.segments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">
              {track.type === "emcee"
                ? "Add script"
                : track.type === "background"
                ? "Add music"
                : "Add effects"}
            </span>
          </div>
        )}

        {/* Add segment button - tiny */}
        {!track.locked && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-0.5 right-0.5 h-4 text-[9px] p-0 opacity-40 hover:opacity-100 bg-background/40"
            onClick={(e) => {
              e.stopPropagation();
              onAddSegment();
            }}
          >
            <PlusCircle className="h-2.5 w-2.5 mr-0.5" />
            Add
          </Button>
        )}
      </div>

      {/* Segment info dialog */}
      <AlertDialog open={showSegmentInfo} onOpenChange={setShowSegmentInfo}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedSegment?.content || "Segment Details"}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {selectedSegment && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {/* Waveform visualization if audio available */}
                  {selectedSegment.audioUrl && (
                    <div className="bg-muted/30 rounded-md h-16 mb-2 relative overflow-hidden">
                      <Waveform
                        duration={
                          selectedSegment.endTime - selectedSegment.startTime
                        }
                        currentTime={0}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Duration:</div>
                    <div>
                      {formatDuration(
                        selectedSegment.endTime - selectedSegment.startTime
                      )}
                    </div>

                    <div className="font-medium">Start Time:</div>
                    <div>{formatDuration(selectedSegment.startTime)}</div>

                    <div className="font-medium">End Time:</div>
                    <div>{formatDuration(selectedSegment.endTime)}</div>

                    <div className="font-medium">Status:</div>
                    <div className="capitalize">{selectedSegment.status}</div>

                    <div className="font-medium">Track:</div>
                    <div>{track.name}</div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-sm font-medium">Content:</div>
              <div className="text-sm max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/10">
                {selectedSegment.content}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {selectedSegment.audioUrl && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSegmentPlay(selectedSegment.id);
                      handleCloseSegmentInfo();
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                )}

                {selectedSegment.audioUrl && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onTrimSegment(selectedSegment.id);
                      handleCloseSegmentInfo();
                    }}
                  >
                    <Scissors className="h-4 w-4 mr-1" />
                    Trim
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseSegmentInfo}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
