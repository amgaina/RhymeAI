import { ToolCall } from "./BaseToolView";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, VolumeX, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EventScriptToolViewProps {
  tool: ToolCall;
  eventId?: string | number;
}

export function EventScriptToolView({
  tool,
  eventId,
}: EventScriptToolViewProps) {
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);

  if (!tool.result?.segments || !Array.isArray(tool.result.segments)) {
    return (
      <div className="text-sm text-muted-foreground">
        No script segments found
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="text-sm mb-2">
        Script content ({tool.result.segments.length} segments):
      </div>
      <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
        {tool.result.segments.map((segment: any) => (
          <div
            key={segment.id}
            className="border rounded-md p-3 bg-background/80 hover:bg-background transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {segment.type.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Order: {segment.order}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    segment.status === "draft"
                      ? "secondary"
                      : segment.status === "review"
                      ? "warning"
                      : "success"
                  }
                >
                  {segment.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {Math.floor(segment.timing / 60)}:
                    {(segment.timing % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2">
              {expandedSegment === segment.id ? (
                <div className="text-sm mt-1">{segment.content}</div>
              ) : (
                <div className="text-sm mt-1 line-clamp-2">
                  {segment.content}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-xs"
                onClick={() =>
                  setExpandedSegment(
                    expandedSegment === segment.id ? null : segment.id
                  )
                }
              >
                {expandedSegment === segment.id ? "Show less" : "Show more"}
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-muted/50">
              {segment.audioUrl ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Volume2 className="h-3 w-3" />
                  <span>Audio available</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <VolumeX className="h-3 w-3" />
                  <span>No audio</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
