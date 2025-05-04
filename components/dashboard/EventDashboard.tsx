"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCcw,
  AlertCircle,
  Presentation,
  CheckCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ScriptSegment } from "@/types/event";

interface EventDashboardProps {
  segments: ScriptSegment[];
  isRunning: boolean;
  currentSegmentIndex: number;
  timeElapsed: number;
  totalDuration: number;
  onPlayPause: () => void;
  onPrevSegment: () => void;
  onNextSegment: () => void;
  onSeekTo: (segmentIndex: number) => void;
}

// Atomic component for segment badge
const SegmentTypeBadge = ({ type }: { type: string }) => (
  <Badge variant="outline" className="capitalize">
    {type.replace(/_/g, " ")}
  </Badge>
);

// Atomic component for slide indicator badge
const SlideIndicator = () => (
  <Badge variant="secondary" className="flex items-center gap-1">
    <Presentation className="h-3 w-3" />
    Slide
  </Badge>
);

// Atomic component for time display
const TimeDisplay = ({ time, label }: { time: string; label?: string }) => (
  <div className="bg-primary/10 px-2 py-1 rounded-md text-primary-foreground text-sm">
    {time}
    {label && (
      <span className="text-xs text-muted-foreground ml-1">{label}</span>
    )}
  </div>
);

// Atomic component for segment progress
const SegmentProgressBar = ({ progress }: { progress: number }) => (
  <div className="h-1 w-full bg-muted">
    <div
      className="h-full bg-primary transition-all duration-300 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

// Atomic component for audio control with player
const AudioSegmentPreview = ({
  segment,
  isActive,
}: {
  segment: ScriptSegment;
  isActive: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop playback when segment changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [segment.id]);

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // No audio available
  if (!segment.audio_url && !segment.audio) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs opacity-50"
        disabled
      >
        <VolumeX className="h-3 w-3 mr-1" />
        No audio
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-primary hover:text-primary"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <>
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </>
        ) : (
          <>
            <Volume2 className="h-3 w-3 mr-1" />
            Play
          </>
        )}
      </Button>
      <audio
        ref={audioRef}
        src={segment.audio || segment.audio_url}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </>
  );
};

export default function EventDashboard({
  segments,
  isRunning,
  currentSegmentIndex,
  timeElapsed,
  totalDuration,
  onPlayPause,
  onPrevSegment,
  onNextSegment,
  onSeekTo,
}: EventDashboardProps) {
  const [timeDisplay, setTimeDisplay] = useState({
    elapsed: "0:00",
    remaining: "0:00",
    total: "0:00",
  });

  // Sort segments by order
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  // Find the correct index based on the sorted array
  const sortedCurrentIndex = sortedSegments.findIndex(
    (segment) => segment === segments[currentSegmentIndex]
  );

  // Format times whenever timeElapsed or totalDuration changes
  useEffect(() => {
    setTimeDisplay({
      elapsed: formatTime(timeElapsed),
      remaining: formatTime(totalDuration - timeElapsed),
      total: formatTime(totalDuration),
    });
  }, [timeElapsed, totalDuration]);

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Calculate segment start time
  const getSegmentStartTime = (index: number): number => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      startTime += segments[i]?.timing || 0;
    }
    return startTime;
  };

  // Calculate percentage progress to segment
  const getSegmentProgress = (index: number): number => {
    if (index < currentSegmentIndex) return 100;
    if (index > currentSegmentIndex) return 0;

    // For current segment
    const segmentStartTime = getSegmentStartTime(currentSegmentIndex);
    const segmentDuration = segments[currentSegmentIndex]?.timing || 0;
    if (segmentDuration === 0) return 0;

    const segmentElapsed = timeElapsed - segmentStartTime;
    return Math.min(100, (segmentElapsed / segmentDuration) * 100);
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="bg-primary/5 pb-3">
        <CardTitle className="flex justify-between items-center text-primary">
          <span>Event Control Panel</span>
          {isRunning ? (
            <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
              LIVE
            </Badge>
          ) : (
            <Badge variant="outline" className="text-primary border-primary">
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Current Script Display */}
        {sortedSegments.length > 0 ? (
          <div
            className={`p-4 border-2 rounded-md ${
              isRunning
                ? "border-green-500 bg-green-50/50 dark:bg-green-950/10"
                : "border-primary/20"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-primary">
                {isRunning ? "NOW PLAYING" : "Ready to Start"}
              </h3>
              <div className="text-sm text-primary/70">
                Segment {sortedSegments[sortedCurrentIndex]?.order || 1} of{" "}
                {sortedSegments.length}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-3">
              <div className="flex items-start gap-2 mb-2">
                <SegmentTypeBadge
                  type={sortedSegments[sortedCurrentIndex]?.type || "segment"}
                />
                {sortedSegments[sortedCurrentIndex]?.presentationSlide && (
                  <SlideIndicator />
                )}
              </div>
              <p className="text-lg font-medium text-primary-foreground">
                {sortedSegments[sortedCurrentIndex]?.content ||
                  "No content available"}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TimeDisplay
                  time={`${timeDisplay.elapsed} / ${timeDisplay.total}`}
                />
                <span className="text-xs text-muted-foreground">
                  Remaining: {timeDisplay.remaining}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrevSegment}
                  disabled={!isRunning || currentSegmentIndex === 0}
                  className="border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  className={
                    isRunning
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }
                  onClick={onPlayPause}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNextSegment}
                  disabled={
                    !isRunning || currentSegmentIndex >= segments.length - 1
                  }
                  className="border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center border-2 border-dashed rounded-md p-6 border-primary/20">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2 text-primary">
              No Script Segments
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add script segments before starting your event
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-1 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}

        {/* Progress bar */}
        {sortedSegments.length > 0 && (
          <div>
            <Progress
              value={(timeElapsed / totalDuration) * 100}
              className="h-2 bg-muted"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Start</span>
              <span className="text-muted-foreground">End</span>
            </div>
          </div>
        )}

        {/* Upcoming segments */}
        {sortedSegments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-primary">
              All Segments
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {sortedSegments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`border rounded-md transition-all ${
                    index === sortedCurrentIndex
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="p-2 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {segment.order}
                        </span>
                        <span className="text-xs text-primary-foreground/70 capitalize">
                          {segment.type}
                        </span>
                        {segment.presentationSlide && (
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1 border-primary/30"
                          >
                            <Presentation className="h-3 w-3" />
                            Slide
                          </Badge>
                        )}
                        {segment.status === "generated" && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm truncate max-w-[300px] text-primary-foreground">
                        {segment.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap text-xs border-primary/30 text-primary"
                      >
                        {segment.timing ? formatTime(segment.timing) : "0:00"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <AudioSegmentPreview
                          segment={segment}
                          isActive={index === sortedCurrentIndex}
                        />
                        {index !== sortedCurrentIndex && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              // Find the original index of this segment
                              const originalIndex = segments.findIndex(
                                (s) => s.id === segment.id
                              );
                              onSeekTo(originalIndex);
                            }}
                          >
                            Jump to
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <SegmentProgressBar progress={getSegmentProgress(index)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
