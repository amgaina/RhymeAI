"use client";

import { useState, useRef, useEffect } from "react";
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
  onTrimSegment,
  formatDuration = formatSegmentDuration,
}: TrackProps) {
  const [draggingSegment, setDraggingSegment] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
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

  const handleSegmentDragStart = (e: React.DragEvent, segmentId: string) => {
    if (track.locked) {
      e.preventDefault();
      toast.error("Track is locked. Unlock it to move segments.");
      return;
    }

    e.dataTransfer.setData("segmentId", segmentId);
    setDraggingSegment(segmentId);
  };

  const handleTrackDragOver = (e: React.DragEvent) => {
    if (track.locked) return;
    e.preventDefault();
  };

  const handleTrackDrop = (e: React.DragEvent) => {
    if (track.locked) return;
    e.preventDefault();

    const segmentId = e.dataTransfer.getData("segmentId");
    if (!segmentId || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newStartTime = (clickX / rect.width) * duration;

    onMoveSegment?.(segmentId, Math.max(0, newStartTime));
    setDraggingSegment(null);
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

      {/* Track waveform - minimalist styling */}
      <div
        ref={trackRef}
        className={`${
          track.segments.length === 0 ? "h-8" : "h-16"
        } bg-muted/20 relative overflow-hidden`}
        style={{
          backgroundColor: `${track.color}08`,
        }} /* even lighter background */
        onDragOver={handleTrackDragOver}
        onDrop={handleTrackDrop}
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

        {/* Audio segments - simplified styling */}
        {track.segments.map((segment) => {
          const segmentWidth = calculateSegmentWidth(segment);
          const segmentLeft = (segment.startTime / duration) * 100;

          return (
            <div
              key={segment.id}
              draggable={!track.locked}
              onDragStart={(e) => handleSegmentDragStart(e, segment.id)}
              className={`absolute rounded-sm transform ${
                draggingSegment === segment.id ? "opacity-50" : "opacity-100"
              } ${
                segment.status === "generated"
                  ? "bg-green-500/10 hover:bg-green-500/20 border-l-2 border-l-green-600"
                  : segment.status === "generating"
                  ? "bg-amber-500/10 hover:bg-amber-500/20 border-l-2 border-l-amber-600"
                  : segment.status === "failed"
                  ? "bg-red-500/10 hover:bg-red-500/20 border-l-2 border-l-red-600"
                  : "bg-blue-500/10 hover:bg-blue-500/20 border-l-2 border-l-blue-600"
              } ${track.muted ? "opacity-50" : ""} cursor-move group`}
              style={{
                top: "2px",
                left: `${segmentLeft}%`,
                width: `${segmentWidth}%`,
                height: "calc(100% - 4px)",
              }}
              onClick={(e) => e.stopPropagation()}
              title={segment.content}
            >
              {/* Minimal content text */}
              <div className="text-[9px] p-0.5 truncate max-w-full opacity-80">
                {segment.content.substring(0, 15)}
                {segment.content.length > 15 ? "..." : ""}
              </div>

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
    </div>
  );
}
