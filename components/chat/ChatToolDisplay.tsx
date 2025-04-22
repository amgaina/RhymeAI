"use client";

import { Wrench, CircleCheck, CircleDot, RotateCw } from "lucide-react";

interface ChatToolDisplayProps {
  toolInvocations: any[];
  eventId?: number;
}

export function ChatToolDisplay({
  toolInvocations,
  eventId,
}: ChatToolDisplayProps) {
  return (
    <div className="mt-3 border-t border-muted-foreground/20 pt-2">
      <div className="text-xs font-medium mb-1 text-muted-foreground">
        Actions taken:
      </div>
      {toolInvocations.map((tool) => (
        <div
          key={tool.toolCallId}
          className="mb-2 text-xs bg-background/50 rounded p-2"
        >
          <div className="flex items-center gap-1 mb-1 font-medium">
            <Wrench className="h-3 w-3" />
            <span className="capitalize">
              {tool.toolName
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str: string) => str.toUpperCase())}
            </span>
          </div>

          {tool.state === "result" ? (
            <div className="flex items-center gap-1 text-green-500">
              <CircleCheck className="h-3 w-3" />
              <span>Successfully processed</span>
            </div>
          ) : tool.state === "partial-call" ? (
            <div className="flex items-center gap-1 text-amber-500">
              <RotateCw className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-500">
              <CircleDot className="h-3 w-3" />
              <span>
                Error:{" "}
                {typeof tool.args === "string" ? tool.args : "Unknown error"}
              </span>
            </div>
          )}

          {/* Tool-specific displays */}
          {renderToolSpecificContent(tool, eventId)}
        </div>
      ))}
    </div>
  );
}

function renderToolSpecificContent(tool: any, eventId?: number) {
  // Parse tool args if they're a string
  let parsedArgs: any = {};
  try {
    parsedArgs =
      typeof tool.args === "string" ? JSON.parse(tool.args) : tool.args;
  } catch (e) {
    console.error("Error parsing tool args:", e);
    return null;
  }

  switch (tool.toolName) {
    case "storeEventDataTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Event: {parsedArgs?.eventName || "Not specified"}
          </div>
          {parsedArgs?.eventType && (
            <div className="text-2xs text-muted-foreground">
              Type: {parsedArgs.eventType}
            </div>
          )}
          {parsedArgs?.eventDate && (
            <div className="text-2xs text-muted-foreground">
              Date: {parsedArgs.eventDate}
            </div>
          )}
        </div>
      );

    case "generateEventLayoutTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated layout for event ID:{" "}
            {parsedArgs?.eventId || eventId || "Unknown"}
          </div>
          {parsedArgs?.layout && (
            <div className="text-2xs text-muted-foreground">
              Segments:{" "}
              {Array.isArray(parsedArgs.layout) ? parsedArgs.layout.length : 0}
            </div>
          )}
        </div>
      );

    case "generateScriptTool":
    case "generateScriptFromLayoutTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated script for event ID:{" "}
            {parsedArgs?.eventId || eventId || "Unknown"}
          </div>
          {parsedArgs?.segments && (
            <div className="text-2xs text-muted-foreground">
              Segments:{" "}
              {Array.isArray(parsedArgs.segments)
                ? parsedArgs.segments.length
                : 0}
            </div>
          )}
        </div>
      );

    case "generateAudioTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated audio for segment: {parsedArgs?.segmentId || "Unknown"}
          </div>
          {parsedArgs?.audioUrl && (
            <div className="text-2xs text-muted-foreground">
              <a
                href={parsedArgs.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Listen to audio
              </a>
            </div>
          )}
        </div>
      );

    case "generatePresentationTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated presentation for event ID:{" "}
            {parsedArgs?.eventId || eventId || "Unknown"}
          </div>
          {parsedArgs?.presentationUrl && (
            <div className="text-2xs text-muted-foreground">
              <a
                href={parsedArgs.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                View presentation
              </a>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
