import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  Edit,
  Maximize2,
} from "lucide-react";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompactLayoutManagerProps {
  eventId: number;
  layout: EventLayout | null;
  isGenerating: boolean;
  eventName?: string;
  eventDate?: Date;
  eventType?: string;
  onRegenerateLayout: () => void;
  onOpenFullLayout?: () => void;
}

export default function CompactLayoutManager({
  eventId,
  layout,
  isGenerating,
  eventName = "Event",
  eventDate,
  eventType = "conference",
  onRegenerateLayout,
  onOpenFullLayout,
}: CompactLayoutManagerProps) {
  // Function to calculate total duration of all segments
  const getTotalDuration = () => {
    if (!layout || !layout.segments) return 0;
    return layout.segments.reduce(
      (total, segment) => total + (segment.duration || 0),
      0
    );
  };

  // Function to get segment type display name
  const getSegmentTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      introduction: "Intro",
      agenda: "Agenda",
      keynote: "Keynote",
      presentation: "Pres",
      q_and_a: "Q&A",
      break: "Break",
      discussion: "Discuss",
      demo: "Demo",
      conclusion: "Concl",
      segment: "Segment",
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-3 p-2">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-base font-medium leading-none">
            {eventName} Layout
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {layout
              ? `${
                  layout.segments.length
                } segments • ${getTotalDuration()} min total`
              : "No layout available"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onRegenerateLayout}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            <span>Regenerate</span>
          </Button>
          {onOpenFullLayout && (
            <Button onClick={onOpenFullLayout} variant="default" size="sm">
              <Maximize2 className="h-4 w-4 mr-1" />
              <span>Full View</span>
            </Button>
          )}
        </div>
      </div>

      {/* Layout segments */}
      {layout && layout.segments.length > 0 ? (
        <Card className="overflow-hidden border">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Event Timeline
            </CardTitle>
          </CardHeader>
          <ScrollArea className="">
            <div className="p-3">
              {layout.segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="border-l-2 border-primary/20 pl-3 pb-4 relative"
                >
                  {/* Timeline dot */}
                  <div className="w-3 h-3 rounded-full bg-primary absolute -left-[6.5px] top-1"></div>

                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">
                        {segment.name || `Segment ${index + 1}`}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs font-normal border-primary/30 text-primary"
                      >
                        {getSegmentTypeDisplay(segment.type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {segment.duration || 0} min
                    </span>
                  </div>

                  {segment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {segment.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
          <p className="text-muted-foreground mb-2">No layout generated yet</p>
          <Button
            onClick={onRegenerateLayout}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Generate Layout
          </Button>
        </div>
      )}
    </div>
  );
}
