"use client";

import React, { useRef } from "react";
import { AudioSegment } from "@/types/audio-editor";

interface TimelineProps {
  duration: number;
  currentTime: number;
  zoomLevel: number;
  segments: AudioSegment[];
  onSeek: (time: number) => void;
  formatTime: (time: number) => string;
}

export default function Timeline({
  duration,
  currentTime,
  segments,
  zoomLevel,
  onSeek,
  formatTime,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * duration;

    onSeek(newTime);
  };

  // Calculate number of time markers based on duration and zoom
  const timeMarkerInterval = 5; // seconds
  const markerCount = Math.ceil(duration / timeMarkerInterval);

  return (
    <div
      ref={timelineRef}
      className="h-16 bg-muted rounded-md mb-4 relative cursor-pointer"
      onClick={handleTimelineClick}
    >
      {/* Time markers */}
      {Array.from({ length: markerCount + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 h-full border-l border-border"
          style={{
            left: `${((i * timeMarkerInterval) / duration) * 100}%`,
            opacity: i % 2 === 0 ? 1 : 0.5,
          }}
        >
          <div className="text-xs text-muted-foreground absolute -left-3 top-0">
            {formatTime(i * timeMarkerInterval)}
          </div>
        </div>
      ))}

      {/* Render segments on timeline */}
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`absolute h-8 top-6 rounded-md transition-all ${
            segment.status === "generated"
              ? "bg-green-500/30 border border-green-600"
              : segment.status === "generating"
              ? "bg-amber-500/30 border border-amber-600"
              : segment.status === "failed"
              ? "bg-red-500/30 border border-red-600"
              : "bg-blue-500/30 border border-blue-600"
          }`}
          style={{
            left: `${(segment.startTime / duration) * 100}%`,
            width: `${
              ((segment.endTime - segment.startTime) / duration) * 100
            }%`,
          }}
        >
          <div className="text-xs truncate p-1 text-foreground">
            {segment.content.substring(0, 20)}
            {segment.content.length > 20 ? "..." : ""}
          </div>
        </div>
      ))}

      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-0.5 bg-primary z-10"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
}
