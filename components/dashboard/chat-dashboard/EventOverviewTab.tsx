import { Calendar, Users, AudioLines, Clock, LayoutTemplate } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { EventData } from "@/app/actions/event";

interface EventOverviewTabProps {
  selectedEvent: EventData;
  formatDate: (dateString: string) => string;
  formatDuration: (seconds: number) => string;
  totalDuration: number;
  onContinueEvent?: (eventId: string) => void;
}

export function EventOverviewTab({
  selectedEvent,
  formatDate,
  formatDuration,
  totalDuration,
  onContinueEvent,
}: EventOverviewTabProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-4">
        {/* Event Summary Card */}
        <Card className="bg-background/40">
          <CardContent className="p-4 space-y-4">
            {/* Event Banner */}
            <div className="h-24 rounded-md bg-gradient-to-r from-accent/20 to-primary/20 flex items-center justify-center mb-2">
              <CalendarDays className="h-10 w-10 text-accent/70" />
            </div>

            {/* Event Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  className={`${
                    selectedEvent.status === "ready"
                      ? "bg-green-500/20 text-green-500 hover:bg-green-500/20"
                      : selectedEvent.status === "draft"
                      ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/20"
                      : "bg-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                  }`}
                >
                  {selectedEvent.status}
                </Badge>
                <span className="text-sm font-medium">
                  {selectedEvent.type}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(selectedEvent.date)}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <AudioLines className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedEvent.scriptSegments?.some(
                      (s) => s.audio || s.audio_url
                    )
                      ? `${
                          selectedEvent.scriptSegments.filter(
                            (s) => s.audio || s.audio_url
                          ).length
                        } segments with audio`
                      : "No audio generated"}
                  </span>
                </div>

                {totalDuration > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Duration: {formatDuration(totalDuration)}
                    </span>
                  </div>
                )}
              </div>

              {/* Event Layout */}
              {selectedEvent.layout &&
                selectedEvent.layout.segments?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutTemplate className="h-4 w-4" />
                      <h4 className="text-sm font-medium">
                        Event Layout
                      </h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      {selectedEvent.layout.segments
                        .slice(0, 3)
                        .map((segment: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground flex justify-between"
                          >
                            <span>
                              • {segment.name || segment.type}
                            </span>
                            <span>{segment.duration}s</span>
                          </div>
                        ))}
                      {selectedEvent.layout.segments.length >
                        3 && (
                        <div className="text-xs text-accent">
                          +
                          {selectedEvent.layout.segments.length -
                            3}{" "}
                          more segments
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Event Description */}
              {selectedEvent.description && (
                <div className="pt-2 border-t border-border/50">
                  <h4 className="text-sm font-medium mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() =>
              onContinueEvent && onContinueEvent(selectedEvent.id)
            }
          >
            Open Event
          </Button>
          <Button className="flex-1">Generate Audio</Button>
        </div>
      </div>
    </div>
  );
}
