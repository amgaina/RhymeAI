"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LayoutSegment {
  id: number;
  name: string;
  type: string;
  description: string;
  duration: number;
  order: number;
  startTime?: string;
  endTime?: string;
}

interface EventLayout {
  id: number;
  eventId: number;
  totalDuration: number;
  lastUpdated: string;
  segments: LayoutSegment[];
}

interface ChatEventLayoutProps {
  layout: EventLayout;
  eventName: string;
  compact?: boolean;
}

export function ChatEventLayout({ layout, eventName, compact = true }: ChatEventLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({});
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Toggle a specific segment
  const toggleSegment = (segmentId: number) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };
  
  // Sort segments by order
  const sortedSegments = [...layout.segments].sort((a, b) => a.order - b.order);
  
  return (
    <div className="my-4 border rounded-lg overflow-hidden bg-card">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{eventName}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Total Duration: {formatDuration(layout.totalDuration * 60)}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="h-8 w-8 p-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {sortedSegments.map((segment) => (
            <div 
              key={segment.id} 
              className="mb-3 border rounded-md overflow-hidden"
            >
              <div 
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSegment(segment.id)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 px-2 flex items-center">
                    {segment.order}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-sm">{segment.name}</h4>
                    <p className="text-xs text-muted-foreground">{segment.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {segment.duration} min
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                  >
                    {expandedSegments[segment.id] ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              {expandedSegments[segment.id] && (
                <div className="p-3 pt-0 border-t">
                  <p className="text-sm mt-2">{segment.description}</p>
                  
                  {(segment.startTime || segment.endTime) && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {segment.startTime && segment.endTime 
                          ? `${segment.startTime} - ${segment.endTime}`
                          : segment.startTime || segment.endTime}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!isExpanded && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpanded}
            className="flex items-center gap-1"
          >
            <ChevronDown className="h-4 w-4" />
            Show {layout.segments.length} segments
          </Button>
        </div>
      )}
    </div>
  );
}
