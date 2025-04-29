import { ToolCall } from "./BaseToolView";
import { Badge } from "@/components/ui/badge";
import { Volume2, FileAudio, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCallPart, ToolResultPart } from "ai";

interface AudioGenerationToolViewProps {
  tool: ToolCall;
}

export function AudioGenerationToolView({
  tool,
}: AudioGenerationToolViewProps) {
  // Safely check for result existence
  if (!tool || !tool.result) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No audio generation result available
      </div>
    );
  }

  // Check for explicit failure
  if (tool.isError) {
    return (
      <div className="mt-2 text-sm text-red-500">
        Audio generation failed: {String(tool.result) || "Unknown error"}
      </div>
    );
  }

  // Handle batch audio result - with proper existence and array checks
  if (
    tool.result.audioFiles &&
    Array.isArray(tool.result.audioFiles) &&
    tool.result.audioFiles.length > 0
  ) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-green-500" />
          <span>
            Generated {tool.result.audioFiles.length} audio files successfully
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {tool.result.audioFiles.map((audio: any, index: number) => (
            <div key={index} className="border rounded-md p-2 bg-background/80">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">
                  Segment {audio?.segmentId || index + 1}
                </div>
                <Badge variant="outline">
                  {audio?.duration
                    ? formatDuration(audio.duration)
                    : "Unknown duration"}
                </Badge>
              </div>
              {audio?.url && (
                <audio
                  controls
                  src={audio.url}
                  className="w-full h-8 mt-2"
                ></audio>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle single audio result
  if (tool.result.audioUrl) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-green-500" />
          <span>Audio generated successfully</span>
        </div>

        <div className="border rounded-md p-3 bg-background/80">
          {tool.result.segmentId !== undefined && (
            <div className="text-sm mb-1">
              Segment ID: {tool.result.segmentId}
            </div>
          )}

          <audio controls src={tool.result.audioUrl} className="w-full"></audio>

          {tool.result.duration !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Duration: {formatDuration(tool.result.duration)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default success message
  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-2">
        <FileAudio className="h-4 w-4 text-green-500" />
        <span>Audio generation completed</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
