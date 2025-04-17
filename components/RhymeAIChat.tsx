"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Bot,
  User,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useState, useEffect } from "react";

interface RhymeAIChatProps {
  title?: string;
  description?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  eventContext?: {
    purpose: string;
    requiredFields: string[];
    contextType: "event-creation" | "script-generation" | "general-assistant";
    additionalInfo?: Record<string, any>;
  };
  onEventDataCollected?: (data: any) => void;
}

export function RhymeAIChat({
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script.",
  placeholder = "Tell me about your event...",
  className = "",
  eventContext = {
    purpose: "event-creation",
    requiredFields: [
      "eventName",
      "eventType",
      "eventDate",
      "eventLocation",
      "expectedAttendees",
      "eventDescription",
      "voicePreferences",
      "languagePreferences",
    ],
    contextType: "event-creation",
  },
  onEventDataCollected,
}: RhymeAIChatProps) {
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >({});
  const [isDataComplete, setIsDataComplete] = useState(false);

  // Track collected information
  useEffect(() => {
    const allRequiredFields = eventContext?.requiredFields || [];
    const requiredFieldsCollected = allRequiredFields.every(
      (field) => collectedFields[field]
    );
    setIsDataComplete(requiredFieldsCollected && allRequiredFields.length > 0);
  }, [collectedFields, eventContext?.requiredFields]);

  // Extract field information from messages
  const extractFieldInfo = (content: string) => {
    const newCollectedFields = { ...collectedFields };
    const fieldPatterns =
      eventContext?.requiredFields?.map((field) => ({
        field,
        regex: new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i"),
      })) || [];

    fieldPatterns.forEach(({ field, regex }) => {
      if (content.toLowerCase().includes(field.toLowerCase())) {
        newCollectedFields[field] = true;
      }
    });

    setCollectedFields(newCollectedFields);
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      eventContext,
    },
    initialMessages: initialMessage
      ? [
          {
            id: "initial-message",
            role: "assistant",
            content: initialMessage,
            parts: [{ type: "text", text: initialMessage }],
          },
        ]
      : undefined,
    onResponse: async (response) => {
      // Extract field information from response
      if (response.text) {
        const text = await response.text();
        extractFieldInfo(text);
      }
    },
  });

  // Generate script when all data is collected
  const handleGenerateScript = () => {
    if (isDataComplete && onEventDataCollected) {
      // Extract event data from conversation
      const eventData: Record<string, string> = {};
      eventContext?.requiredFields?.forEach((field) => {
        messages.forEach((msg) => {
          if (
            msg.content &&
            msg.content.toLowerCase().includes(field.toLowerCase())
          ) {
            const match = msg.content.match(
              new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i")
            );
            if (match && match[1]) {
              eventData[field] = match[1].trim();
            }
          }
        });
      });

      onEventDataCollected(eventData);

      // Add a message to transition to script generation
      setMessages([
        ...messages,
        {
          id: "transition-message",
          role: "assistant",
          content:
            "Great! I've collected all the necessary information. Now let's create an emcee script for your event.",
          parts: [
            {
              type: "text",
              text: "Great! I've collected all the necessary information. Now let's create an emcee script for your event.",
            },
          ],
        },
      ]);
    }
  };

  // Calculate progress percentage
  const progressPercentage = eventContext?.requiredFields?.length
    ? Math.round(
        (Object.values(collectedFields).filter(Boolean).length /
          eventContext.requiredFields.length) *
          100
      )
    : 0;

  return (
    <Card className={`w-full border shadow-md ${className}`}>
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Progress indicator */}
        {eventContext?.contextType === "event-creation" && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Information collection: {progressPercentage}%</span>
              <span>
                {Object.values(collectedFields).filter(Boolean).length}/
                {eventContext.requiredFields.length} fields
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex-1 space-y-4 p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-center p-8">
              <Bot className="h-12 w-12 text-primary/60 mb-4" />
              <p className="text-muted-foreground text-sm max-w-md">
                {initialMessage}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
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
                  <div>
                    <div className="font-medium text-sm mb-1">
                      {message.role === "user" ? "You" : "RhymeAI"}
                    </div>
                    {message.parts
                      ?.filter((part) => part.type !== "source")
                      .map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <div
                              key={index}
                              className="whitespace-pre-wrap text-sm"
                            >
                              {part.text}
                            </div>
                          );
                        }
                        return null;
                      })}
                  </div>
                </div>

                {message.parts
                  ?.filter((part) => part.type === "source")
                  .map((part) => (
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
            ))
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>

      {eventContext?.contextType === "event-creation" && (
        <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            <span>
              Fields remaining:{" "}
              {eventContext.requiredFields.length -
                Object.values(collectedFields).filter(Boolean).length}
            </span>
          </div>

          <Button
            onClick={handleGenerateScript}
            disabled={!isDataComplete}
            className="gap-2"
            size="sm"
            variant={isDataComplete ? "default" : "outline"}
          >
            <CheckCircle2 className="h-4 w-4" />
            Generate Script
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
