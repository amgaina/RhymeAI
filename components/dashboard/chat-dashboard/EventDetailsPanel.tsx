import { XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventData } from "@/app/actions/event";
import { EventOverviewTab } from "./EventOverviewTab";
import { EventScriptsTab } from "./EventScriptsTab";
import { EventMetricsTab } from "./EventMetricsTab";

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
