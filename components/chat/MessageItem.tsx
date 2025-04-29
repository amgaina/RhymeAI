import {
  Bot,
  User,
  Wrench,
  CircleCheck,
  Calendar,
  MapPin,
  Info,
} from "lucide-react";
import { MessageContent } from "./MessageContent";
import { MessageToolsContainer } from "@/components/tools/MessageToolsContainer";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { MessageItemProps, SourcePart } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";

// Extract the tool processing logic into a separate function
const processToolData = (tools: any[]) => {
  if (!Array.isArray(tools)) return [];

  return tools.map((tool) => ({
    toolCallId:
      tool.toolCallId || tool.id || `tool-${Math.random().toString().slice(2)}`,
    toolName: tool.toolName || tool.name || "Tool",
    args: tool.args || tool.arguments || {},
    state: tool.state || "result",
    result: tool.result || {}, // Include the tool result data
  }));
};

// Format event data for display
const formatEventData = (event: any) => {
  if (!event) return null;

  return (
    <div className="border rounded-md p-2 mb-2 bg-background/80 hover:bg-background">
      <div className="font-medium">{event.name}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Calendar className="h-3 w-3" />
        <span>{new Date(event.date).toLocaleDateString()}</span>
      </div>
      {event.location && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" />
          <span>{event.location}</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Info className="h-3 w-3" />
        <span>
          Status:{" "}
          <span className="bg-primary/10 px-1 rounded">{event.status}</span>
        </span>
      </div>
    </div>
  );
};

// Display formatted tool results based on tool type
const ToolResult = ({ tool }: { tool: any }) => {
  if (!tool || !tool.result) return null;

  // For list_events tool
  if (tool.toolName === "list_events" && tool.result.events) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2">
          Found {tool.result.events.length} events:
        </div>
        <div className="max-h-80 overflow-y-auto pr-2">
          {tool.result.events.map((event: any) => (
            <div key={event.id}>{formatEventData(event)}</div>
          ))}
        </div>
      </div>
    );
  }

  // For get_event_details tool
  if (tool.toolName === "get_event_details" && tool.result.event) {
    return (
      <div className="mt-2">
        <div className="text-sm mb-2">Event details:</div>
        {formatEventData(tool.result.event)}
        {tool.result.event.description && (
          <div className="text-xs mt-2 border-t border-muted pt-1">
            <div className="font-medium">Description:</div>
            <p className="mt-1">{tool.result.event.description}</p>
          </div>
        )}
      </div>
    );
  }

  // Generic result display for other tools
  return (
    <div className="mt-2 text-sm">
      <div className="font-medium">Result:</div>
      {typeof tool.result === "object" ? (
        <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
          {JSON.stringify(tool.result, null, 2)}
        </pre>
      ) : (
        <div className="text-xs mt-1">{String(tool.result)}</div>
      )}
    </div>
  );
};

export function MessageItem({ message }: MessageItemProps) {
  const isAssistant = message.role === "assistant";

  // Process tool data once
  const toolsData = [
    ...processToolData(
      Array.isArray(message.toolCalls) ? message.toolCalls : []
    ),
    ...processToolData(
      Array.isArray(message.toolInvocations) ? message.toolInvocations : []
    ),
  ];

  return (
    <div
      className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
    >
      <div
        className={`flex gap-2 max-w-[85%] px-4 py-3 rounded-lg ${
          isAssistant ? "bg-muted" : "bg-primary text-primary-foreground"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isAssistant ? (
            <Bot className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <div className="markdown-content w-full">
          <div className="font-medium text-sm mb-1 flex justify-between items-center">
            <span>{isAssistant ? "RhymeAI" : "You"}</span>

            {/* Tool usage indicator */}
            {toolsData.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                      <Wrench className="h-3 w-3" />
                      <span>Tools used</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {toolsData.map((tool) => (
                        <div
                          key={tool.toolCallId}
                          className="flex items-center gap-1 mb-1"
                        >
                          <CircleCheck className="h-3 w-3 text-green-500" />
                          <span>
                            {tool.toolName?.replace(/_/g, " ") || "Tool"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Message Content */}
          <MessageContent message={message} />

          {/* Tool results visualization - enhanced version */}
          {toolsData.length > 0 && (
            <div className="mt-3 border-t border-muted-foreground/20 pt-2 bg-background/40 rounded-md p-2">
              <div className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                <span>Actions performed:</span>
              </div>

              <MessageToolsContainer tools={toolsData} />
            </div>
          )}
        </div>
      </div>

      {/* Source attribution */}
      {message.parts
        ?.filter((part) => part.type === "source")
        .map((part) => (
          <div
            key={`source-${(part as SourcePart).source.id}`}
            className="text-xs text-muted-foreground mt-1"
          >
            Source: [
            <a
              href={(part as SourcePart).source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {(part as SourcePart).source.title ??
                new URL((part as SourcePart).source.url).hostname}
            </a>
            ]
          </div>
        ))}
    </div>
  );
}
