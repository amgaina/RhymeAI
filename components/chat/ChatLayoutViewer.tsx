"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Clock, Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { getEventById } from "@/app/actions/event";
import { formatDuration } from "@/lib/utils";

interface ChatLayoutViewerProps {
  eventId: string | number;
  layoutData?: EventLayout;
  onClose: () => void;
}

export default function ChatLayoutViewer({ eventId, layoutData: initialLayoutData, onClose }: ChatLayoutViewerProps) {
  const [layout, setLayout] = useState<EventLayout | null>(initialLayoutData || null);
  const [isLoading, setIsLoading] = useState(!initialLayoutData);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch layout data if not provided
  useEffect(() => {
    if (!initialLayoutData) {
      const fetchLayout = async () => {
        try {
          setIsLoading(true);
          const result = await getEventById(eventId.toString());
          
          if (result.success && result.event?.layout) {
            setLayout(result.event.layout);
          } else {
            setError(result.error || "Failed to load layout data");
            toast({
              title: "Error",
              description: "Failed to load layout data",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching layout:", error);
          setError("An unexpected error occurred");
          toast({
            title: "Error",
            description: "An unexpected error occurred while loading layout",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchLayout();
    }
  }, [eventId, initialLayoutData, toast]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Event Layout</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading layout...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !layout) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Event Layout</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-destructive">Failed to load layout information</p>
            <p className="text-sm text-muted-foreground">{error || "No layout data available"}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Event Layout</CardTitle>
          <CardDescription>
            Total Duration: {formatDuration(layout.totalDuration * 60)}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {layout.segments.sort((a, b) => a.order - b.order).map((segment) => (
            <SegmentCard key={segment.id} segment={segment} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </CardFooter>
    </Card>
  );
}

function SegmentCard({ segment }: { segment: LayoutSegment }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{segment.name}</CardTitle>
            <CardDescription className="text-xs">{segment.type}</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{segment.duration} min</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{segment.description}</p>
        
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
      </CardContent>
    </Card>
  );
}
