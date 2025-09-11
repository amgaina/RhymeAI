"use client";

import {
  Wrench,
  CircleCheck,
  CircleDot,
  RotateCw,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { ChatAudioElement } from "./ChatAudioElement";
import { Button } from "@/components/ui/button";

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
  // State for audio playback
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Parse tool args if they're a string
  let parsedArgs: any = {};
  try {
    parsedArgs =
      typeof tool.args === "string" ? JSON.parse(tool.args) : tool.args;

    // Also try to parse the output if it's a string
    if (tool.output && typeof tool.output === "string") {
      try {
        tool.parsedOutput = JSON.parse(tool.output);
      } catch (e) {
        // Ignore parsing errors for output
      }
    }
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
    case "generate_audio":
      // Get audio URL from either args or output
      let audioUrl;

      // Try to parse the output if it's a string
      if (tool.output && typeof tool.output === "string") {
        try {
          const parsedOutput = JSON.parse(tool.output);
          if (parsedOutput.success && parsedOutput.audioUrl) {
            audioUrl = parsedOutput.audioUrl;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Fallback to other sources if we couldn't get the URL from output
      if (!audioUrl) {
        audioUrl =
          parsedArgs?.audioUrl ||
          tool.parsedOutput?.audioUrl ||
          (tool.parsedOutput?.success && tool.parsedOutput?.s3Key
            ? tool.parsedOutput.audioUrl
            : null);
      }

      // Get segment ID
      const segmentId =
        parsedArgs?.segmentId ||
        (tool.output && typeof tool.output === "string"
          ? JSON.parse(tool.output)?.segmentId
          : null) ||
        tool.parsedOutput?.segmentId ||
        "Unknown";

      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated audio for segment: {segmentId}
          </div>

          {audioUrl ? (
            <div className="mt-2">
              {showAudioPlayer ? (
                <ChatAudioElement
                  audioUrl={audioUrl}
                  segmentId={segmentId}
                  compact={true}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAudioPlayer(true)}
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Play Audio
                </Button>
              )}
            </div>
          ) : (
            <div className="text-2xs text-muted-foreground mt-1">
              Audio URL not available
            </div>
          )}
        </div>
      );

    case "generate_batch_audio":
    case "generateBatchAudioTool":
      return (
        <div className="mt-1 overflow-hidden">
          <div className="text-2xs text-muted-foreground">
            Generated audio for multiple segments
          </div>
          <div className="text-2xs text-muted-foreground">
            Event ID:{" "}
            {parsedArgs?.eventId ||
              tool.parsedOutput?.eventId ||
              eventId ||
              "Unknown"}
          </div>
          {(tool.parsedOutput?.success || parsedArgs?.success) && (
            <div className="text-2xs text-muted-foreground">
              Successfully generated{" "}
              {tool.parsedOutput?.successCount ||
                parsedArgs?.successCount ||
                "multiple"}{" "}
              audio segments
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
