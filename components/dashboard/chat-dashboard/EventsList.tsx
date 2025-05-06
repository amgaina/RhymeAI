import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EventData } from "@/app/actions/event";

interface EventsListProps {
  events: EventData[];
  isLoading: boolean;
  sidebarCollapsed: boolean;
  selectedEventId: string | null;
  isDeleting: Record<string, boolean>;
  onSelectEvent: (eventId: string) => void;
  onContinueEvent?: (eventId: string) => void;
  formatDate: (dateString: string) => string;
  getEventProgress: (event: EventData) => number;
}

export function EventsList({
  events,
  isLoading,
  sidebarCollapsed,
  selectedEventId,
  isDeleting,
  onSelectEvent,
  onContinueEvent,
  formatDate,
  getEventProgress,
}: EventsListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2">
      {!sidebarCollapsed && (
        <h3 className="text-sm font-medium my-2 px-2 text-muted-foreground">
          YOUR EVENTS
        </h3>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
          <span
            className={`${sidebarCollapsed ? "hidden" : "ml-3 text-sm"}`}
          >
            Loading...
          </span>
        </div>
      ) : events.length === 0 ? (
        <div
          className={`${
            sidebarCollapsed
              ? "hidden"
              : "text-center p-4 text-muted-foreground text-sm"
          }`}
        >
          No events yet. Create your first event using the chat or button
          above!
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className={`${
                sidebarCollapsed ? "px-2 py-3" : "p-3"
              } rounded-lg cursor-pointer transition-colors ${
                selectedEventId === event.id
                  ? "bg-accent/20"
                  : "hover:bg-accent/10"
              }`}
              onClick={() => onSelectEvent(event.id)}
            >
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                    <span className="text-xs font-bold text-primary">
                      {event.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      event.status === "ready"
                        ? "bg-green-500"
                        : event.status === "draft"
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    }`}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {event.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium truncate text-sm">
                          {event.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {onContinueEvent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event selection
                            onContinueEvent(event.id);
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${
                          event.status === "ready"
                            ? "bg-green-500/20 text-green-500"
                            : event.status === "draft"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {event.status.replace("_", " ")}
                      </span>
                      <span className="text-muted-foreground">
                        {event.type}
                      </span>
                    </div>
                    <Progress
                      value={getEventProgress(event)}
                      className="h-1.5"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
