import { Badge } from "@/components/ui/badge";
import { ToolResultPart } from "ai";
import { Clock, Layout } from "lucide-react";

interface EventLayoutToolViewProps {
  tool: ToolResultPart;
  eventId?: string | number;
}

export function EventLayoutToolView({
  tool,
  eventId,
}: EventLayoutToolViewProps) {
  if (
    !tool.result?.layout?.segments ||
    !Array.isArray(tool.result.layout.segments)
  ) {
    return (
      <div className="text-sm text-muted-foreground">
        No layout segments found
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="text-sm mb-2">
        Event layout ({tool.result.layout.segments.length} segments):
      </div>
      <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
        {tool.result.layout.segments.map((segment: any, index: number) => (
          <div
            key={segment.id || index}
            className="border rounded-md p-3 bg-background/80 hover:bg-background transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-sm">{segment.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{Math.floor(segment.duration / 60)} min</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">
                {segment.type.replace(/_/g, " ")}
              </Badge>
              {segment.order && (
                <span className="text-xs text-muted-foreground">
                  Order: {segment.order}
                </span>
              )}
            </div>

            {segment.description && (
              <div className="text-xs mt-2 text-muted-foreground">
                {segment.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
