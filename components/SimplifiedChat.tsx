"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, ArrowDown, Mic2 } from "lucide-react";
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
  const collectedCount = Object.values(collectedFields).filter(Boolean).length;
  const totalFields = requiredFields.length;
  const isComplete = collectedCount === totalFields && totalFields > 0;
  const progressPercentage = totalFields
    ? Math.round((collectedCount / totalFields) * 100)
    : 0;

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

export interface SimplifiedChatProps {
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

export function SimplifiedChat({
  eventId,
  title = "RhymeAI Assistant",
  initialMessage = "I'm your RhymeAI Assistant. Let's create an emcee script for your event. What type of event are you planning?",
  placeholder = "Type your message...",
  className = "",
  onEventDataCollected,
  onLayoutGenerated,
  onScriptGenerated,
  onAudioGenerated,
}: SimplifiedChatProps) {
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
  const requiredFields = [
    "eventName",
    "eventType",
    "eventDate",
    "eventLocation",
    "expectedAttendees",
    "eventDescription",
    "voicePreferences",
    "languagePreferences",
  ];

  // Initialize collected fields only once on mount
  useEffect(() => {
    const fields: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      fields[field] = false;
    });
    setCollectedFields(fields);
  }, []); // Empty dependency array ensures this runs only once

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
        contextType:
          currentStep === "collecting-info"
            ? "event-creation"
            : currentStep === "generating-layout"
            ? "event-layout"
            : currentStep === "generating-script"
            ? "script-generation"
            : "audio-generation",
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
    onFinish: (message) => {
      // Process tool calls
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        message.toolInvocations.forEach((toolCall) => {
          // Handle event data collection
          if (
            toolCall.toolName === "storeEventDataTool" &&
            onEventDataCollected
          ) {
            const eventData =
              typeof toolCall.args === "string"
                ? JSON.parse(toolCall.args)
                : toolCall.args;

            onEventDataCollected(eventData);

            // Update collected fields
            const newCollectedFields = { ...collectedFields };
            if (eventData.eventName) newCollectedFields.eventName = true;
            if (eventData.eventType) newCollectedFields.eventType = true;
            if (eventData.eventDate) newCollectedFields.eventDate = true;
            if (eventData.eventLocation)
              newCollectedFields.eventLocation = true;
            if (eventData.audienceSize)
              newCollectedFields.expectedAttendees = true;
            if (eventData.eventDescription)
              newCollectedFields.eventDescription = true;
            if (eventData.voicePreference)
              newCollectedFields.voicePreferences = true;
            if (eventData.language)
              newCollectedFields.languagePreferences = true;

            setCollectedFields(newCollectedFields);

            // Store event ID if available
            if (eventData.eventId && !createdEventId) {
              setCreatedEventId(eventData.eventId);
            }
          }

          // Handle layout generation
          if (
            toolCall.toolName === "generateEventLayoutTool" &&
            onLayoutGenerated
          ) {
            const layoutData =
              typeof toolCall.args === "string"
                ? JSON.parse(toolCall.args)
                : toolCall.args;

            onLayoutGenerated(layoutData);
            setCurrentStep("generating-script");
          }

          // Handle script generation
          if (
            (toolCall.toolName === "generateScriptTool" ||
              toolCall.toolName === "generateScriptFromLayoutTool") &&
            onScriptGenerated
          ) {
            const scriptData =
              typeof toolCall.args === "string"
                ? JSON.parse(toolCall.args)
                : toolCall.args;

            onScriptGenerated(scriptData);
            setCurrentStep("generating-audio");
          }

          // Handle audio generation
          if (toolCall.toolName === "generateAudioTool" && onAudioGenerated) {
            const audioData =
              typeof toolCall.args === "string"
                ? JSON.parse(toolCall.args)
                : toolCall.args;

            if (audioData.audioUrl && audioData.segmentId) {
              onAudioGenerated(audioData.audioUrl, audioData.segmentId);
            }
          }
        });
      }

      // Save message to database if we have an event ID
      if (createdEventId) {
        saveChatMessage({
          eventId: createdEventId,
          messageId: message.id,
          role: "assistant",
          content: message.content,
          toolCalls: message.toolInvocations || undefined,
        });
      }
    },
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
  const handleGenerateScript = () => {
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
  };

  // Custom form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save user message to database if we have an event ID
    if (createdEventId && input.trim()) {
      await saveChatMessage({
        eventId: createdEventId,
        messageId: `user-${Date.now()}`,
        role: "user",
        content: input,
      });
    }

    await handleSubmit(e);
  };

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
