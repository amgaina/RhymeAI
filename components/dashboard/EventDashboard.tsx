"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { ScriptSegment } from "./ScriptManager";

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
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex justify-between items-center">
          <span>Event Control Panel</span>
          {isRunning ? (
            <Badge className="bg-green-500 animate-pulse">LIVE</Badge>
          ) : (
            <Badge variant="outline">Ready</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Current Script Display */}
        {segments.length > 0 ? (
          <div
            className={`p-4 border-2 rounded-md ${
              isRunning ? "border-green-500 bg-green-50" : "border-primary/20"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">
                {isRunning ? "NOW PLAYING" : "Ready to Start"}
              </h3>
              <div className="text-sm">
                Segment {currentSegmentIndex + 1} of {segments.length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-md shadow-sm mb-3">
              <div className="flex items-start gap-2 mb-2">
                <Badge variant="outline" className="capitalize mt-1">
                  {segments[currentSegmentIndex]?.type || "segment"}
                </Badge>
                {segments[currentSegmentIndex]?.presentationSlide && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 mt-1"
                  >
                    <Presentation className="h-3 w-3" />
                    Slide
                  </Badge>
                )}
              </div>
              <p className="text-lg font-medium">
                {segments[currentSegmentIndex]?.content ||
                  "No content available"}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm flex items-center gap-2">
                <div className="bg-primary/10 px-2 py-1 rounded-md">
                  {timeDisplay.elapsed} / {timeDisplay.total}
                </div>
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
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  className={
                    isRunning
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-cta hover:bg-cta/90"
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
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center border-2 border-dashed rounded-md p-6">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No Script Segments</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add script segments before starting your event
            </p>
            <Button variant="outline" className="flex items-center gap-1">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}

        {/* Progress bar */}
        {segments.length > 0 && (
          <div>
            <Progress
              value={(timeElapsed / totalDuration) * 100}
              className="h-2"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Start</span>
              <span className="text-muted-foreground">End</span>
            </div>
          </div>
        )}

        {/* Upcoming segments */}
        {segments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">All Segments</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`border rounded-md ${
                    index === currentSegmentIndex
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="p-2 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {index + 1}
                        </span>
                        <span className="text-xs text-primary-foreground/60 capitalize">
                          {segment.type}
                        </span>
                        {segment.presentationSlide && (
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            <Presentation className="h-3 w-3" />
                            Slide
                          </Badge>
                        )}
                        {segment.status === "generated" && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm truncate max-w-[300px]">
                        {segment.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap text-xs"
                      >
                        {segment.timing ? formatTime(segment.timing) : "0:00"}
                      </Badge>
                      {index !== currentSegmentIndex && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onSeekTo(index)}
                        >
                          Jump to
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gray-100">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: `${getSegmentProgress(index)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
