import { ToolCall } from "./BaseToolView";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface EventListingToolViewProps {
  tool: ToolCall;
}

export function EventListingToolView({ tool }: EventListingToolViewProps) {
  if (!tool.result?.events) {
    return <div className="text-sm text-muted-foreground">No events found</div>;
  }

  return (
    <div className="mt-2">
      <div className="text-sm mb-2">
        Found {tool.result.events.length} events:
      </div>
      <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
        {tool.result.events.map((event: any) => (
          <div
            key={event.id}
            className="border rounded-md p-3 bg-background/80 hover:bg-background transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link
                  href={`/event/${event.id}`}
                  className="font-medium text-sm hover:underline text-primary"
                >
                  {event.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      event.status === "draft"
                        ? "outline"
                        : event.status === "script_ready"
                        ? "secondary"
                        : event.status === "ready"
                        ? "default"
                        : "outline"
                    }
                  >
                    {event.status?.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs capitalize">{event.type}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {event.id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    event.hasScript ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span>Script</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    event.hasAudio ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span>Audio</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    event.hasLayout ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span>Layout</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
