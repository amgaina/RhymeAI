import { Badge } from "@/components/ui/badge";
import { ToolResultPart } from "ai";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Info,
  FileText,
  Volume2,
} from "lucide-react";
import Link from "next/link";

interface EventDetailsToolViewProps {
  tool: ToolResultPart;
  eventId?: string | number;
}

export function EventDetailsToolView({
  tool,
  eventId,
}: EventDetailsToolViewProps) {
  if (!tool.result?.event) {
    return (
      <div className="text-sm text-muted-foreground">
        No event details found
      </div>
    );
  }

  const event = tool.result.event;

  return (
    <div className="mt-2 space-y-3">
      <div className="border rounded-md p-3 bg-background">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{event.name}</div>
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

          <Link
            href={`/event/${event.id}`}
            className="text-xs text-primary hover:underline"
          >
            View event
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-y-2 mt-3">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.expectedAttendees && (
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{event.expectedAttendees} attendees</span>
            </div>
          )}

          {event.totalDuration && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{Math.floor(event.totalDuration / 60)} minutes</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-3 text-sm border-t pt-2">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{event.scriptSegments?.length || 0} script segments</span>
          </div>

          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span>{event.audioCount || 0} audio files</span>
          </div>
        </div>
      </div>

      {event.description && (
        <div className="border rounded-md p-3 bg-background">
          <div className="flex items-center gap-1 mb-2 font-medium">
            <Info className="h-4 w-4" />
            <span>Description</span>
          </div>
          <p className="text-sm">{event.description}</p>
        </div>
      )}
    </div>
  );
}
