"use client";

import {
  Bot,
  User,
  Wrench,
  CircleCheck,
  CircleDot,
  RotateCw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMarkdown } from "./ChatMarkdown";
import { ChatToolDisplay } from "./ChatToolDisplay";
import { transformChatContent } from "@/lib/chat-message-utils";

interface ChatMessageProps {
  message: any;
  eventId?: number;
}

export function ChatMessage({ message, eventId }: ChatMessageProps) {
  return (
    <div
      className={`flex flex-col ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`flex gap-2 max-w-[80%] px-4 py-3 rounded-lg ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {message.role === "user" ? (
            <User className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>
        <div className="markdown-content w-full">
          <div className="font-medium text-sm mb-1 flex justify-between items-center">
            <span>{message.role === "user" ? "You" : "RhymeAI"}</span>

            {/* Tool usage indicator */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
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
                      {message.toolInvocations.map((tool: any) => (
                        <div
                          key={tool.toolCallId}
                          className="flex items-center gap-1 mb-1"
                        >
                          <CircleCheck className="h-3 w-3 text-green-500" />
                          <span>{tool.toolName.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Message content */}
          {message.parts
            ?.filter((part: any) => part.type !== "source")
            .map((part: any, index: number) => {
              if (part.type === "text") {
                return (
                  <div key={index} className="whitespace-pre-wrap text-sm">
                    {typeof part.text === "string" ? (
                      <>
                        <ChatMarkdown content={part.text} />
                        {transformChatContent(
                          part.text,
                          message.toolInvocations,
                          message.eventId
                        )}
                      </>
                    ) : (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(part.text, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              }
              return null;
            })}

          {/* If no parts, use content directly */}
          {(!message.parts || message.parts.length === 0) &&
            message.content && (
              <div className="whitespace-pre-wrap text-sm">
                {typeof message.content === "string" ? (
                  <>
                    <ChatMarkdown content={message.content} />
                    {transformChatContent(
                      message.content,
                      message.toolInvocations,
                      message.eventId
                    )}
                  </>
                ) : (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(message.content, null, 2)}
                  </pre>
                )}
              </div>
            )}

          {/* Tool calls visualization */}
          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <ChatToolDisplay
              toolInvocations={message.toolInvocations}
              eventId={eventId}
            />
          )}
        </div>
      </div>

      {/* Source attribution */}
      {message.parts
        ?.filter((part: any) => part.type === "source")
        .map((part: any) => (
          <div
            key={`source-${part.source.id}`}
            className="text-xs text-muted-foreground mt-1"
          >
            Source: [
            <a
              href={part.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {part.source.title ?? new URL(part.source.url).hostname}
            </a>
            ]
          </div>
        ))}
    </div>
  );
}
