"use client";

import { useRef, useEffect, useState } from "react";
import { ScriptSegment } from "@/types/event";

interface Channel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
}

interface AudioClip {
  id: string;
  channelId: string;
  segmentId?: number;
  startTime: number;
  duration: number;
  audioUrl: string;
  name: string;
}

interface MultiTrackTimelineProps {
  channels: Channel[];
  audioClips: AudioClip[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  scriptSegments: ScriptSegment[];
  selectedSegmentId: number | null;
  onSegmentSelect: (segmentId: number) => void;
}

export default function MultiTrackTimeline({
  channels,
  audioClips,
  currentTime,
  duration,
  onSeek,
  scriptSegments,
  selectedSegmentId,
  onSegmentSelect,
}: MultiTrackTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  
  // Calculate pixels per second based on zoom level
  const pixelsPerSecond = 10 * zoomLevel;
  
  // Calculate total width of timeline in pixels
  const timelineWidth = duration * pixelsPerSecond;
  
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollContainer = timelineRef.current.parentElement;
    if (!scrollContainer) return;
    
    const clickX = e.clientX - rect.left;
    const scrollOffset = scrollContainer.scrollLeft;
    
    const clickTimePosition = (clickX + scrollOffset) / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(clickTimePosition, duration)));
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 1) return; // Only middle mouse button
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    
    const scrollContainer = timelineRef.current?.parentElement;
    if (scrollContainer) {
      setDragStartScroll(scrollContainer.scrollLeft);
    }
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const scrollContainer = timelineRef.current?.parentElement;
    if (!scrollContainer) return;
    
    const dx = e.clientX - dragStartX;
    scrollContainer.scrollLeft = dragStartScroll - dx;
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle zoom in/out
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(Math.max(0.5, Math.min(5, zoomLevel + delta)));
    }
  };
  
  // Scroll to current time
  useEffect(() => {
    const scrollContainer = timelineRef.current?.parentElement;
    if (!scrollContainer) return;
    
    const currentTimePosition = currentTime * pixelsPerSecond;
    const containerWidth = scrollContainer.clientWidth;
    
    // Only scroll if current time is outside the visible area
    if (
      currentTimePosition < scrollContainer.scrollLeft ||
      currentTimePosition > scrollContainer.scrollLeft + containerWidth - 100
    ) {
      scrollContainer.scrollLeft = currentTimePosition - containerWidth / 2;
    }
  }, [currentTime, pixelsPerSecond]);
  
  // Generate time markers
  const generateTimeMarkers = () => {
    const markers = [];
    const interval = zoomLevel <= 1 ? 60 : zoomLevel <= 2 ? 30 : zoomLevel <= 3 ? 15 : 5;
    
    for (let time = 0; time <= duration; time += interval) {
      const position = time * pixelsPerSecond;
      
      markers.push(
        <div 
          key={time} 
          className="absolute top-0 h-full border-l border-muted-foreground/20"
          style={{ left: `${position}px` }}
        >
          <div className="text-xs text-muted-foreground absolute -left-6 top-1 w-12 text-center">
            {formatTime(time)}
          </div>
        </div>
      );
    }
    
    return markers;
  };
  
  // Get clips for a specific channel
  const getClipsForChannel = (channelId: string) => {
    return audioClips.filter(clip => clip.channelId === channelId);
  };
  
  // Render audio clip
  const renderAudioClip = (clip: AudioClip, channel: Channel) => {
    const startPosition = clip.startTime * pixelsPerSecond;
    const width = clip.duration * pixelsPerSecond;
    
    // Find associated script segment if any
    const segment = clip.segmentId 
      ? scriptSegments.find(s => s.id === clip.segmentId)
      : null;
    
    const isSelected = segment && selectedSegmentId === segment.id;
    
    return (
      <div 
        key={clip.id}
        className={`absolute top-1 h-[calc(100%-8px)] rounded-md border ${
          isSelected ? 'border-primary shadow-sm' : 'border-muted-foreground/20'
        } overflow-hidden cursor-pointer transition-all hover:brightness-95`}
        style={{ 
          left: `${startPosition}px`, 
          width: `${width}px`,
          backgroundColor: `${channel.color}30`,
          borderColor: isSelected ? channel.color : undefined
        }}
        onClick={() => clip.segmentId && onSegmentSelect(clip.segmentId)}
      >
        <div className="text-xs font-medium p-1 truncate" style={{ color: channel.color }}>
          {clip.name}
        </div>
        
        {/* Waveform visualization (placeholder) */}
        <div className="px-1">
          <div className="w-full h-8 bg-muted-foreground/5 rounded">
            <div className="w-full h-full flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path 
                  d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10" 
                  fill="none" 
                  stroke={channel.color} 
                  strokeWidth="1"
                />
                <path 
                  d="M0,10 Q10,15 20,10 T40,10 T60,10 T80,10 T100,10" 
                  fill="none" 
                  stroke={channel.color} 
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="h-full flex flex-col"
      onWheel={handleWheel}
    >
      {/* Timeline ruler */}
      <div className="h-8 border-b bg-muted/30 relative">
        <div 
          ref={timelineRef}
          className="absolute top-0 left-0 h-full"
          style={{ width: `${timelineWidth}px` }}
          onClick={handleTimelineClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {generateTimeMarkers()}
        </div>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-primary z-10"
          style={{ left: `${currentTime * pixelsPerSecond}px` }}
        />
      </div>
      
      {/* Channels */}
      <div className="flex-1 overflow-hidden">
        {channels.map(channel => (
          <div 
            key={channel.id}
            className="h-16 border-b relative"
            style={{ 
              opacity: channel.muted ? 0.5 : 1,
              backgroundColor: `${channel.color}05`
            }}
          >
            {/* Channel clips */}
            <div 
              className="absolute top-0 left-0 h-full"
              style={{ width: `${timelineWidth}px` }}
            >
              {getClipsForChannel(channel.id).map(clip => renderAudioClip(clip, channel))}
            </div>
            
            {/* Playhead */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-primary z-10"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
            />
          </div>
        ))}
      </div>
      
      {/* Zoom controls */}
      <div className="h-8 border-t bg-muted/30 flex items-center justify-end px-2">
        <div className="flex items-center gap-2">
          <button 
            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.5))}
          >
            Zoom Out
          </button>
          <div className="text-xs text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </div>
          <button 
            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
            onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
          >
            Zoom In
          </button>
        </div>
      </div>
    </div>
  );
}
