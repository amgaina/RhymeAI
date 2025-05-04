import { useState } from "react";
import { ToolCall } from "./BaseToolView";
import { Badge } from "@/components/ui/badge";
import { Volume2, Clock, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScriptAudioToolViewProps {
  tool: ToolCall;
}

// Define the structure of a script segment
interface ScriptSegment {
  id: string | number;
  type: string;
  content: string;
  status: string;
  timing: number;
  order: number;
  audio?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const ScriptAudioToolView = ({ tool }: ScriptAudioToolViewProps) => {
  const [expandedSegment, setExpandedSegment] = useState<
    string | number | null
  >(null);

  // Check if we have valid data
  if (
    !tool ||
    !tool.result ||
    !tool.result.audioFiles ||
    !tool.result.audioFiles.event
  ) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No audio files available for this event
      </div>
    );
  }

  // Extract event data and script segments
  const { event } = tool.result.audioFiles;
  const scriptSegments = event.scriptSegments || [];

  // Filter to only show segments with audio
  const audioSegments = scriptSegments.filter(
    (segment: ScriptSegment) => segment.audio
  );

  if (audioSegments.length === 0) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <span>No audio files found for this event</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Event: {event.name} ({event.type})
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Total segments: {scriptSegments.length} (none with audio)
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="text-sm mb-2 flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-green-500" />
        <span>Found {audioSegments.length} audio files</span>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        Event: {event.name} ({event.type})
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {audioSegments.map((segment: ScriptSegment) => (
          <div
            key={segment.id}
            className="border rounded-md p-2 bg-background/80 hover:bg-background/90 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {segment.type.replace(/_/g, " ")}
                </Badge>
                <span>Segment {segment.id}</span>
              </div>
              <Badge
                variant={
                  segment.status === "generated" ? "outline" : "secondary"
                }
              >
                {segment.status}
              </Badge>
            </div>

            {/* Audio player */}
            <div className="mt-2">
              <audio controls src={segment.audio} className="w-full h-8" />
            </div>

            {/* Segment details (expandable) */}
            <div className="mt-1 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-0 h-6"
                onClick={() =>
                  setExpandedSegment(
                    expandedSegment === segment.id ? null : segment.id
                  )
                }
              >
                {expandedSegment === segment.id
                  ? "Hide details"
                  : "Show details"}
              </Button>

              {segment.timing > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(segment.timing)}
                </div>
              )}
            </div>

            {/* Expanded content */}
            {expandedSegment === segment.id && (
              <div className="mt-2 text-xs border-t pt-2 border-muted/30">
                <div className="line-clamp-3 text-muted-foreground">
                  {segment.content}
                </div>
                <div className="mt-1 text-muted-foreground">
                  Order: {segment.order}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptAudioToolView;
