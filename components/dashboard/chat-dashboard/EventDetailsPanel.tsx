import { XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventData } from "@/app/actions/event";
import { EventOverviewTab } from "./EventOverviewTab";
import { EventScriptsTab } from "./EventScriptsTab";
import { EventMetricsTab } from "./EventMetricsTab";
import LayoutManager from "../LayoutManager";
import CompactLayoutManager from "../CompactLayoutManager";
import { useState, useEffect } from "react";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { useToast } from "@/hooks/use-toast";
import { generateEventLayout } from "@/app/actions/event";
import { getEventLayout } from "@/app/actions/event/layout/get-layout";

interface EventDetailsPanelProps {
  selectedEvent: EventData;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (isOpen: boolean) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  formatDate: (dateString: string) => string;
  formatDuration: (seconds: number) => string;
  totalDuration: number;
  getEventProgress: (event: EventData) => number;
  onContinueEvent?: (eventId: string) => void;
  handleSuggestion: (suggestion: string) => void;
}

export function EventDetailsPanel({
  selectedEvent,
  isDetailsOpen,
  setIsDetailsOpen,
  selectedTab,
  setSelectedTab,
  formatDate,
  formatDuration,
  totalDuration,
  getEventProgress,
  onContinueEvent,
  handleSuggestion,
}: EventDetailsPanelProps) {
  const { toast } = useToast();
  const [eventLayout, setEventLayout] = useState<EventLayout | null>(null);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [showFullLayout, setShowFullLayout] = useState(false);

  // Fetch event layout when the selected event changes
  useEffect(() => {
    async function fetchEventLayout() {
      if (!selectedEvent || !selectedEvent.id) return;

      setIsLoadingLayout(true);
      try {
        const result = await getEventLayout(selectedEvent.id as string);
        if (result.success && result.layout) {
          setEventLayout(result.layout);
        } else {
          console.warn("Failed to load event layout:", result.error);
          // If no layout found, set to null but don't show an error toast
          setEventLayout(null);
        }
      } catch (error) {
        console.error("Error fetching event layout:", error);
        toast({
          title: "Error loading layout",
          description: "Failed to load event layout data",
          variant: "destructive",
        });
        setEventLayout(null);
      } finally {
        setIsLoadingLayout(false);
      }
    }

    fetchEventLayout();
  }, [selectedEvent, toast]);

  // Handle regenerating the event layout
  const handleRegenerateLayout = async () => {
    if (!selectedEvent || !selectedEvent.id) return;

    try {
      setIsGeneratingLayout(true);
      const result = await generateEventLayout(selectedEvent.id as string);

      if (result.success && result.layout) {
        setEventLayout(result.layout);
        toast({
          title: "Layout generated",
          description: "Event layout has been successfully generated.",
        });
      } else {
        toast({
          title: "Error generating layout",
          description: result.error || "Failed to generate layout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating layout:", error);
      toast({
        title: "Error",
        description: "Failed to generate layout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  // Handle layout segment updates
  const handleUpdateLayoutSegment = async (segment: LayoutSegment) => {
    if (!eventLayout) return;

    try {
      // Call the server action to update the segment
      // For now, just update the local state
      const updatedSegments = eventLayout.segments.map((s) =>
        s.id === segment.id ? segment : s
      );

      setEventLayout({
        ...eventLayout,
        segments: updatedSegments,
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment updated",
        description: "Layout segment has been updated.",
      });
    } catch (error) {
      console.error("Error updating segment:", error);
      toast({
        title: "Error",
        description: "Failed to update segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new layout segment
  const handleAddLayoutSegment = async (segment: Omit<LayoutSegment, "id">) => {
    if (!eventLayout) return;

    try {
      // Create a temporary ID for optimistic UI updates
      const tempSegment = {
        ...segment,
        id: `temp-${Date.now()}`,
      } as LayoutSegment;

      // Update the local state
      setEventLayout({
        ...eventLayout,
        segments: [...eventLayout.segments, tempSegment],
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment added",
        description: "New layout segment has been added.",
      });
    } catch (error) {
      console.error("Error adding segment:", error);
      toast({
        title: "Error",
        description: "Failed to add segment. Please try again.",
      });
    }
  };

  // Handle deleting a layout segment
  const handleDeleteLayoutSegment = async (segmentId: string) => {
    if (!eventLayout) return;

    try {
      // Update the local state
      setEventLayout({
        ...eventLayout,
        segments: eventLayout.segments.filter((s) => s.id !== segmentId),
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment deleted",
        description: "Layout segment has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting segment:", error);
      toast({
        title: "Error",
        description: "Failed to delete segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isDetailsOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute right-4 top-16 bg-card"
        onClick={() => setIsDetailsOpen(true)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Event Details
      </Button>
    );
  }

  return (
    <div className="w-1/3 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col h-full">
      {/* Details Header */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h3 className="font-semibold">Event Details</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsDetailsOpen(false)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Event Details Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="event-layout">Layout</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <EventOverviewTab
              selectedEvent={selectedEvent}
              formatDate={formatDate}
              formatDuration={formatDuration}
              totalDuration={totalDuration}
              onContinueEvent={onContinueEvent}
            />
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts">
            <EventScriptsTab
              selectedEvent={selectedEvent}
              handleSuggestion={handleSuggestion}
            />
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <EventMetricsTab
              selectedEvent={selectedEvent}
              getEventProgress={getEventProgress}
              formatDuration={formatDuration}
              totalDuration={totalDuration}
            />
          </TabsContent>

          <TabsContent value="event-layout">
            {!showFullLayout ? (
              <CompactLayoutManager
                eventId={parseInt(selectedEvent.id as string)}
                layout={eventLayout}
                isGenerating={isGeneratingLayout || isLoadingLayout}
                eventName={selectedEvent.name}
                eventType={selectedEvent.type}
                eventDate={
                  selectedEvent.date ? new Date(selectedEvent.date) : undefined
                }
                onRegenerateLayout={handleRegenerateLayout}
                onOpenFullLayout={() => setShowFullLayout(true)}
              />
            ) : (
              <>
                <div className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullLayout(false)}
                    className="mb-3"
                  >
                    Back to Compact View
                  </Button>
                </div>
                <LayoutManager
                  eventId={parseInt(selectedEvent.id as string)}
                  layout={eventLayout}
                  isGenerating={isGeneratingLayout || isLoadingLayout}
                  eventName={selectedEvent.name}
                  eventType={selectedEvent.type}
                  eventDate={
                    selectedEvent.date
                      ? new Date(selectedEvent.date)
                      : undefined
                  }
                  eventStartTime={
                    selectedEvent.date
                      ? new Date(selectedEvent.date)
                      : undefined
                  }
                  eventEndTime={
                    selectedEvent.date
                      ? new Date(selectedEvent.date)
                      : undefined
                  }
                  onRegenerateLayout={handleRegenerateLayout}
                  onUpdateSegment={handleUpdateLayoutSegment}
                  onAddSegment={handleAddLayoutSegment}
                  onDeleteSegment={handleDeleteLayoutSegment}
                  onReorderSegments={(segments) => {
                    if (eventLayout) {
                      setEventLayout({
                        ...eventLayout,
                        segments,
                        lastUpdated: new Date().toISOString(),
                      });
                    }
                  }}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
