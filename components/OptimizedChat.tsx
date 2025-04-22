"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { Mic2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveChatMessage } from "@/app/actions/chat/save";

// Simple message component
function ChatMessage({ message }: { message: any }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// Simple input component
function ChatInputBox({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder: string;
}) {
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}

// Progress indicator component
function ProgressIndicator({
  collectedFields,
  requiredFields,
  onGenerateScript,
}: {
  collectedFields: Record<string, boolean>;
  requiredFields: string[];
  onGenerateScript: () => void;
}) {
  // Memoize these calculations to prevent unnecessary re-renders
  const { collectedCount, totalFields, isComplete, progressPercentage } =
    useMemo(() => {
      const count = Object.values(collectedFields).filter(Boolean).length;
      const total = requiredFields.length;
      return {
        collectedCount: count,
        totalFields: total,
        isComplete: count === total && total > 0,
        progressPercentage: total ? Math.round((count / total) * 100) : 0,
      };
    }, [collectedFields, requiredFields]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Information: {collectedCount}/{totalFields} fields
        </div>
        <Button onClick={onGenerateScript} disabled={!isComplete} size="sm">
          Generate Script
        </Button>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${
            progressPercentage === 100 ? "bg-green-500" : "bg-primary"
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

export interface OptimizedChatProps {
  eventId?: number;
  title?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  onEventDataCollected?: (data: any) => void;
  onLayoutGenerated?: (layout: any) => void;
  onScriptGenerated?: (script: any) => void;
  onAudioGenerated?: (audioUrl: string, segmentId: string) => void;
}

export function OptimizedChat({
  eventId,
  title = "RhymeAI Assistant",
  initialMessage = "I'm your RhymeAI Assistant. Let's create an emcee script for your event. What type of event are you planning?",
  placeholder = "Type your message...",
  className = "",
  onEventDataCollected,
  onLayoutGenerated,
  onScriptGenerated,
  onAudioGenerated,
}: OptimizedChatProps) {
  // Basic state
  const [createdEventId, setCreatedEventId] = useState<number | undefined>(
    eventId
  );
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >({});
  const [currentStep, setCurrentStep] = useState<
    | "collecting-info"
    | "generating-layout"
    | "generating-script"
    | "generating-audio"
  >("collecting-info");

  // Required fields for event creation
  const requiredFields = useMemo(
    () => [
      "eventName",
      "eventType",
      "eventDate",
      "eventLocation",
      "expectedAttendees",
      "eventDescription",
      "voicePreferences",
      "languagePreferences",
    ],
    []
  );

  // Initialize collected fields only once on mount
  useEffect(() => {
    const fields: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      fields[field] = false;
    });
    setCollectedFields(fields);
  }, [requiredFields]); // Only depends on requiredFields which is memoized

  // Memoize the context type to prevent unnecessary re-renders
  const contextType = useMemo(() => {
    switch (currentStep) {
      case "collecting-info":
        return "event-creation";
      case "generating-layout":
        return "event-layout";
      case "generating-script":
        return "script-generation";
      case "generating-audio":
        return "audio-generation";
      default:
        return "event-creation";
    }
  }, [currentStep]);

  // Process tool calls - memoized to prevent re-creation on every render
  const processToolCall = useCallback(
    (toolCall: any) => {
      if (!toolCall || !toolCall.toolName) return;

      // Helper function to parse tool arguments
      const parseArgs = (args: any) => {
        if (typeof args === "string") {
          try {
            return JSON.parse(args);
          } catch (e) {
            console.error("Failed to parse tool args:", e);
            return args;
          }
        }
        return args;
      };

      // Handle event data collection
      if (toolCall.toolName === "storeEventDataTool" && onEventDataCollected) {
        const eventData = parseArgs(toolCall.args);

        // Call the callback
        onEventDataCollected(eventData);

        // Update collected fields using functional update to avoid stale state
        setCollectedFields((prev) => {
          const newFields = { ...prev };
          if (eventData.eventName) newFields.eventName = true;
          if (eventData.eventType) newFields.eventType = true;
          if (eventData.eventDate) newFields.eventDate = true;
          if (eventData.eventLocation) newFields.eventLocation = true;
          if (eventData.audienceSize) newFields.expectedAttendees = true;
          if (eventData.eventDescription) newFields.eventDescription = true;
          if (eventData.voicePreference) newFields.voicePreferences = true;
          if (eventData.language) newFields.languagePreferences = true;
          return newFields;
        });

        // Store event ID if available
        if (eventData.eventId && !createdEventId) {
          setCreatedEventId(eventData.eventId);
        }
      }

      // Handle layout generation
      else if (
        toolCall.toolName === "generateEventLayoutTool" &&
        onLayoutGenerated
      ) {
        const layoutData = parseArgs(toolCall.args);
        onLayoutGenerated(layoutData);
        setCurrentStep("generating-script");
      }

      // Handle script generation
      else if (
        (toolCall.toolName === "generateScriptTool" ||
          toolCall.toolName === "generateScriptFromLayoutTool") &&
        onScriptGenerated
      ) {
        const scriptData = parseArgs(toolCall.args);

        // Ensure script data is saved to the database
        if (scriptData && scriptData.segments) {
          console.log(
            "Script generated with segments:",
            scriptData.segments.length
          );

          // Save script data to database if we have an event ID
          if (createdEventId) {
            try {
              // The script data is already saved by the tool in the database
              // We just need to notify the parent component
              onScriptGenerated(scriptData);
              setCurrentStep("generating-audio");
            } catch (error) {
              console.error("Error handling script generation:", error);
            }
          } else {
            console.warn("No event ID available to save script data");
            onScriptGenerated(scriptData);
            setCurrentStep("generating-audio");
          }
        } else {
          console.error("Invalid script data received");
          onScriptGenerated(scriptData); // Still notify parent even if data is invalid
          setCurrentStep("generating-audio");
        }
      }

      // Handle audio generation
      else if (toolCall.toolName === "generateAudioTool" && onAudioGenerated) {
        const audioData = parseArgs(toolCall.args);

        if (audioData.audioUrl && audioData.segmentId) {
          console.log(
            `Audio generated for segment ${audioData.segmentId}:`,
            audioData.audioUrl
          );

          // The audio URL is already saved in the database by the tool
          // We just need to notify the parent component
          onAudioGenerated(audioData.audioUrl, audioData.segmentId);
        } else {
          console.error("Invalid audio data received", audioData);
        }
      }
    },
    [
      createdEventId,
      onAudioGenerated,
      onEventDataCollected,
      onLayoutGenerated,
      onScriptGenerated,
    ]
  );

  // Chat hook
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
      eventContext: {
        purpose: "To create a customized AI host script for an event",
        requiredFields,
        contextType,
      },
      eventId: createdEventId,
    },
    initialMessages: initialMessage
      ? [
          {
            id: "initial-message",
            role: "assistant",
            content: initialMessage,
          },
        ]
      : undefined,
    onFinish: useCallback(
      (message) => {
        // Process tool calls
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          message.toolInvocations.forEach(processToolCall);
        }

        // Save message to database if we have an event ID
        if (createdEventId) {
          saveChatMessage({
            eventId: createdEventId,
            messageId: message.id,
            role: "assistant",
            content: message.content,
            toolCalls: message.toolInvocations || undefined,
          }).catch((err) => console.error("Failed to save message:", err));
        }
      },
      [createdEventId, processToolCall]
    ),
  });

  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle script generation
  const handleGenerateScript = useCallback(() => {
    // Change to layout generation step
    setCurrentStep("generating-layout");

    // Send message to generate layout
    const generateLayoutMessage =
      "Please generate an event layout based on the information I've provided.";
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: generateLayoutMessage,
      },
    ]);

    // Submit the message programmatically
    const event = new Event("submit", { cancelable: true, bubbles: true });
    handleSubmit(event as any);
  }, [handleSubmit, setMessages]);

  // Custom form submit handler
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Save user message to database if we have an event ID
      if (createdEventId && input.trim()) {
        try {
          await saveChatMessage({
            eventId: createdEventId,
            messageId: `user-${Date.now()}`,
            role: "user",
            content: input,
          });
        } catch (err) {
          console.error("Failed to save user message:", err);
        }
      }

      await handleSubmit(e);
    },
    [createdEventId, handleSubmit, input]
  );

  return (
    <Card className={`w-full border shadow-md ${className}`}>
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <Mic2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-[400px] overflow-y-auto mb-4 p-2">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <ChatInputBox
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleFormSubmit}
          isLoading={isLoading}
          placeholder={placeholder}
        />
      </CardContent>

      {currentStep === "collecting-info" && (
        <CardFooter className="border-t p-4 bg-primary/5">
          <ProgressIndicator
            collectedFields={collectedFields}
            requiredFields={requiredFields}
            onGenerateScript={handleGenerateScript}
          />
        </CardFooter>
      )}
    </Card>
  );
}
