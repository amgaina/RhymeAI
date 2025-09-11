import { Clock, FileText, AudioLines, LayoutTemplate } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EventData } from "@/app/actions/event";

interface EventMetricsTabProps {
  selectedEvent: EventData;
  getEventProgress: (event: EventData) => number;
  formatDuration: (seconds: number) => string;
  totalDuration: number;
}

export function EventMetricsTab({
  selectedEvent,
  getEventProgress,
  formatDuration,
  totalDuration,
}: EventMetricsTabProps) {
  return (
    <div className="p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">
            Event Progress
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Layout Completion</span>
                <span>
                  {selectedEvent.layout?.segments?.length
                    ? "100%"
                    : "0%"}
                </span>
              </div>
              <Progress
                value={
                  selectedEvent.layout?.segments?.length ? 100 : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Script Generation</span>
                <span>
                  {selectedEvent.scriptSegments?.length
                    ? "100%"
                    : "0%"}
                </span>
              </div>
              <Progress
                value={
                  selectedEvent.scriptSegments?.length ? 100 : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Audio Generation</span>
                <span>{getEventProgress(selectedEvent)}%</span>
              </div>
              <Progress
                value={getEventProgress(selectedEvent)}
                className="h-2"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <h3 className="text-sm font-medium mb-4">
            Event Metrics
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-background/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Total Duration
              </div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4 text-accent" />
                {formatDuration(totalDuration)}
              </div>
            </Card>

            <Card className="bg-background/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Segments
              </div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <FileText className="h-4 w-4 text-accent" />
                {selectedEvent.scriptSegments?.length || 0}
              </div>
            </Card>

            <Card className="bg-background/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Audio Ready
              </div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <AudioLines className="h-4 w-4 text-accent" />
                {selectedEvent.scriptSegments?.filter(
                  (s) => s.audio || s.audio_url
                ).length || 0}
              </div>
            </Card>

            <Card className="bg-background/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Layout Structure
              </div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <LayoutTemplate className="h-4 w-4 text-accent" />
                {selectedEvent.layout?.segments?.length || 0}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
