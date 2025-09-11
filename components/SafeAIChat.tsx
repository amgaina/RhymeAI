import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "./ErrorBoundary";

// Dynamically import RhymeAIChat to prevent it from being evaluated during SSR
const DynamicRhymeAIChat = dynamic(
  () =>
    import("@/components/RhymeAIChat").then((mod) => ({
      default: mod.RhymeAIChat,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 bg-gray-100 animate-pulse rounded-md">
        Loading chat interface...
      </div>
    ),
  }
);

interface SafeAIChatProps {
  className?: string;
  title: string;
  description: string;
  initialMessage: string;
  placeholder: string;
  eventContext: any;
  eventId?: number; // Add eventId prop to associate chat with an event
  chatSessionId?: string; // Add chatSessionId prop to maintain chat continuity
  preserveChat?: boolean; // Whether to preserve chat messages between sessions
  onEventDataCollected: (data: Record<string, string>) => void;
  onContinue?: () => void; // Add onContinue prop to handle navigation to next step
}

export default function SafeAIChat({
  className,
  title,
  description,
  initialMessage,
  placeholder,
  eventContext,
  eventId,
  chatSessionId,
  preserveChat = false,
  onEventDataCollected,
  onContinue,
}: SafeAIChatProps) {
  const [chatData, setChatData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    // Forward collected data to parent when available
    if (chatData) {
      // If we have an eventId from the component props, make sure it's included in the data
      if (eventId && !chatData.eventId) {
        const updatedData = { ...chatData, eventId: String(eventId) };
        onEventDataCollected(updatedData);
      } else {
        onEventDataCollected(chatData);
      }

      // Clear the chat data after forwarding it to prevent multiple calls
      setChatData(null);
    }
  }, [chatData, onEventDataCollected, eventId]);

  // Safe handler that ensures we're returning proper data
  const handleDataCollection = useCallback(
    (data: any) => {
      if (!data || typeof data !== "object") {
        console.error("Invalid data received:", data);
        return;
      }

      // If we have an eventId from the component props, make sure it's included in the data
      const dataWithEventId =
        eventId && !data.eventId ? { ...data, eventId } : data;

      // Convert all values to strings to ensure safety
      const safeData: Record<string, string> = {};
      Object.entries(dataWithEventId).forEach(([key, value]) => {
        safeData[key] = String(value);
      });

      // Set local state
      setChatData(safeData);
    },
    [eventId]
  );

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 border rounded-lg bg-orange-50 border-orange-200">
          <h3 className="text-lg font-medium text-orange-800">
            Chat interface unavailable
          </h3>
          <p className="text-orange-600 mt-2">
            We encountered an issue with the AI chat interface. Please try using
            the form method instead.
          </p>
        </div>
      }
    >
      <DynamicRhymeAIChat
        className={className}
        title={title}
        description={description}
        initialMessage={initialMessage}
        placeholder={placeholder}
        eventContext={eventContext}
        eventId={eventId}
        chatSessionId={chatSessionId}
        preserveChat={preserveChat}
        onEventDataCollected={handleDataCollection}
        onContinue={onContinue}
      />
    </ErrorBoundary>
  );
}
