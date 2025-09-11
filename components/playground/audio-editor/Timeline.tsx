"use client";

import React, { useRef, useCallback } from "react";
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

  // Replace the existing handleTimelineClick function with this improved version:
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      // Ensure click is within the timeline bounds
      if (offsetX < 0 || offsetX > rect.width) return;

      const clickPosition = offsetX / rect.width;
      const clampedPosition = Math.max(0, Math.min(clickPosition, 1));
      const newTime = clampedPosition * duration;

      console.log(
        `Timeline clicked at position ${clampedPosition.toFixed(
          2
        )}, time: ${formatTime(newTime)}`
      );

      // Call the seek handler immediately
      onSeek(newTime);
    },
    [duration, onSeek, formatTime]
  );

  // Calculate number of time markers based on duration and zoom
  const timeMarkerInterval = 5; // seconds
  const markerCount = Math.ceil(duration / timeMarkerInterval);

  return (
    <div
      ref={timelineRef}
      className="relative w-full h-12 bg-muted rounded-md cursor-pointer"
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
          <div className="text-[8px] text-muted-foreground absolute -left-2 top-0">
            {formatTime(i * timeMarkerInterval)}
          </div>
        </div>
      ))}

      {/* Render segments on timeline */}
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`absolute h-4 top-5 rounded-sm transition-all ${
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
          <div className="text-[8px] truncate px-0.5 text-foreground whitespace-nowrap">
            {segment.content.substring(0, 15)}
            {segment.content.length > 15 ? "..." : ""}
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
