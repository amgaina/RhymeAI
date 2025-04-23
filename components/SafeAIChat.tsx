import { useState, useEffect } from "react";
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
  onEventDataCollected: (data: Record<string, string>) => void;
}

export default function SafeAIChat({
  className,
  title,
  description,
  initialMessage,
  placeholder,
  eventContext,
  onEventDataCollected,
}: SafeAIChatProps) {
  const [chatData, setChatData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    // Forward collected data to parent when available
    if (chatData) {
      onEventDataCollected(chatData);
    }
  }, [chatData, onEventDataCollected]);

  // Safe handler that ensures we're returning proper data
  const handleDataCollection = (data: any) => {
    if (!data || typeof data !== "object") {
      console.error("Invalid data received:", data);
      return;
    }

    // Convert all values to strings to ensure safety
    const safeData: Record<string, string> = {};
    Object.entries(data).forEach(([key, value]) => {
      safeData[key] = String(value);
    });

    // Set local state
    setChatData(safeData);
  };

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
        onEventDataCollected={handleDataCollection}
      />
    </ErrorBoundary>
  );
}
