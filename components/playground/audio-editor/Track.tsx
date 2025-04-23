"use client";

import { useState, useRef } from "react";
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
  Trash,
  Lock,
  UnlockIcon,
  MoreHorizontal,
  Move,
  Scissors,
} from "lucide-react";
import { Waveform } from "@/components/Waveform";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to format duration
const formatSegmentDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

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
  locked?: boolean;
  segments: AudioSegment[];
}

interface TrackProps {
  track: AudioTrack;
  isSelected: boolean;
  currentTime: number;
  duration: number;
  onSelect: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onAddSegment: () => void;
  onPlaySegment?: (segmentId: string) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onMoveSegment?: (segmentId: string, newStartTime: number) => void;
  onToggleLock?: (trackId: number) => void;
  onImportMedia?: (trackId: number) => void;
  onTrimSegment?: (segmentId: string) => void;
  formatDuration?: (seconds: number) => string;
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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
    if (isPlaying[segmentId]) {
      // Stop playing
      setIsPlaying((prev) => ({ ...prev, [segmentId]: false }));
    } else {
      // Start playing
      setIsPlaying((prev) => {
        // Stop all other segments
        const newState = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {} as Record<string, boolean>);

        // Play this segment
        newState[segmentId] = true;
        return newState;
      });

      onPlaySegment?.(segmentId);

      // Auto-stop after segment duration
      const segment = track.segments.find((s) => s.id === segmentId);
      if (segment) {
        const duration = segment.endTime - segment.startTime;
        setTimeout(() => {
          setIsPlaying((prev) => ({ ...prev, [segmentId]: false }));
        }, duration * 1000);
      }
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
      className={`p-4 rounded-md border-2 transition-all ${
        isSelected ? "border-primary" : "border-border"
      } ${track.locked ? "opacity-75" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {renderTrackIcon()}
          <span className="font-medium">{track.name}</span>

          {track.locked ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock?.(track.id);
                    }}
                  >
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Track is locked - click to unlock
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock?.(track.id);
                    }}
                  >
                    <UnlockIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Track is unlocked - click to lock
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Track Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSegment();
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Segment
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onImportMedia?.(track.id);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Media
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
              >
                {track.muted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute Track
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Mute Track
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {track.muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <div className="w-32">
            <Slider
              value={[track.volume]}
              max={100}
              step={1}
              onValueChange={(value) => {
                onVolumeChange(value[0]);
              }}
              disabled={track.muted}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

      {/* Track waveform and segments */}
      <div
        ref={trackRef}
        className="h-24 bg-muted rounded-md relative overflow-hidden"
        style={{ backgroundColor: `${track.color}15` }}
        onDragOver={handleTrackDragOver}
        onDrop={handleTrackDrop}
      >
        {/* Timeline units */}
        {Array.from({ length: Math.ceil(duration / 5) }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-border/30 pointer-events-none"
            style={{
              left: `${((i * 5) / duration) * 100}%`,
              opacity: i % 2 === 0 ? 0.7 : 0.3,
            }}
          >
            {i % 2 === 0 && (
              <div className="text-xs text-muted-foreground absolute -left-3 top-0 select-none">
                {Math.floor((i * 5) / 60)}:
                {String((i * 5) % 60).padStart(2, "0")}
              </div>
            )}
          </div>
        ))}

        {/* Base waveform visualization */}
        {hasAudio && (
          <div className="absolute inset-0 pointer-events-none">
            <Waveform duration={duration} currentTime={currentTime} />
          </div>
        )}

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Audio segments with improved width calculation */}
        {track.segments.map((segment) => {
          const segmentWidth = calculateSegmentWidth(segment);
          const segmentLeft = (segment.startTime / duration) * 100;
          const segmentDuration = segment.endTime - segment.startTime;

          return (
            <div
              key={segment.id}
              draggable={!track.locked}
              onDragStart={(e) => handleSegmentDragStart(e, segment.id)}
              className={`absolute rounded-md transform transition-transform ${
                draggingSegment === segment.id ? "opacity-50" : "opacity-100"
              } ${
                segment.status === "generated"
                  ? "bg-green-500/20 hover:bg-green-500/30 border border-green-600/50"
                  : segment.status === "generating"
                  ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-600/50"
                  : segment.status === "failed"
                  ? "bg-red-500/20 hover:bg-red-500/30 border border-red-600/50"
                  : "bg-blue-500/20 hover:bg-blue-500/30 border border-blue-600/50"
              } cursor-move group`}
              style={{
                top: "8px",
                left: `${segmentLeft}%`,
                width: `${segmentWidth}%`,
                height: "calc(100% - 16px)",
              }}
              onClick={(e) => e.stopPropagation()}
              title={`${segment.content.substring(0, 50)}${
                segment.content.length > 50 ? "..." : ""
              } (${formatDuration(segmentDuration)})`}
            >
              {/* Segment content preview with duration */}
              <div className="text-xs p-1 truncate max-w-full">
                <span>
                  {segment.content.substring(0, 20)}
                  {segment.content.length > 20 ? "..." : ""}
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">
                  ({formatDuration(segmentDuration)})
                </span>
              </div>

              {/* Segment controls */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-md">
                <div className="flex gap-1">
                  {segment.audioUrl && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 w-7 p-0"
                        onClick={() => handleSegmentPlay(segment.id)}
                      >
                        {isPlaying[segment.id] ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>

                      {/* Add trim button for imported audio */}
                      {onTrimSegment && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTrimSegment(segment.id);
                          }}
                          title="Trim Audio"
                        >
                          <Scissors className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}

                  {onDeleteSegment && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0"
                      onClick={() => onDeleteSegment(segment.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Drag handle */}
              <div className="absolute top-1 right-1 text-xs bg-primary/20 rounded p-0.5">
                <Move className="h-3 w-3" />
              </div>

              {/* Segment status indicator */}
              <div className="absolute bottom-1 right-1 text-xs">
                {segment.status === "generated" && (
                  <span className="text-green-600 bg-green-100 px-1 rounded text-[10px]">
                    Ready
                  </span>
                )}
                {segment.status === "generating" && (
                  <span className="text-amber-600 bg-amber-100 px-1 rounded text-[10px]">
                    Generating
                  </span>
                )}
                {segment.status === "failed" && (
                  <span className="text-red-600 bg-red-100 px-1 rounded text-[10px]">
                    Failed
                  </span>
                )}
                {segment.status === "draft" && (
                  <span className="text-blue-600 bg-blue-100 px-1 rounded text-[10px]">
                    Draft
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state message */}
        {!hasAudio && track.segments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {track.type === "emcee"
                ? "Add segments and generate audio to see waveform"
                : track.type === "background"
                ? "Add background music to see waveform"
                : "Add sound effects to see waveform"}
            </span>
          </div>
        )}

        {/* Add segment button overlay */}
        {!track.locked && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-2 right-2 h-7 opacity-70 hover:opacity-100 bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onAddSegment();
            }}
          >
            <PlusCircle className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
