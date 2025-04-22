"use client";

import { useState } from "react";
import { ChatInterface } from "./chat";

export interface RhymeAIChatWrapperProps {
  eventId?: number;
  title?: string;
  description?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  contextType?:
    | "event-creation"
    | "event-layout"
    | "script-generation"
    | "audio-generation"
    | "presentation";
  requiredFields?: string[];
  onEventDataCollected?: (data: any) => void;
  onLayoutGenerated?: (layout: any) => void;
  onScriptGenerated?: (script: any) => void;
  onVoiceSelected?: (voiceParams: any) => void;
  onAudioGenerated?: (audioUrl: string, segmentId: string) => void;
}

export function RhymeAIChatWrapper({
  eventId,
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script. Let's start with the basics - what type of event are you planning?",
  placeholder = "Type your message...",
  className = "",
  contextType = "event-creation",
  requiredFields = [
    "eventName",
    "eventType",
    "eventDate",
    "eventLocation",
    "expectedAttendees",
    "eventDescription",
    "voicePreferences",
    "languagePreferences",
  ],
  onEventDataCollected,
  onLayoutGenerated,
  onScriptGenerated,
  onVoiceSelected,
  onAudioGenerated,
}: RhymeAIChatWrapperProps) {
  // State for tracking created event ID
  const [createdEventId, setCreatedEventId] = useState<number | undefined>(
    eventId
  );

  // Event context for the chat
  const eventContext = {
    purpose: "To create a customized AI host script for an event",
    requiredFields,
    contextType,
    additionalInfo: {
      eventId: createdEventId,
    },
  };

  // Handle event data collection
  const handleEventDataCollected = (data: any) => {
    // If the data has an eventId and we don't have one yet, store it
    if (data.eventId && !createdEventId) {
      setCreatedEventId(data.eventId);
    }

    // Call the parent handler if provided
    if (onEventDataCollected) {
      onEventDataCollected(data);
    }
  };

  return (
    <ChatInterface
      title={title}
      description={description}
      initialMessage={initialMessage}
      placeholder={placeholder}
      className={className}
      eventId={createdEventId}
      eventContext={eventContext}
      onEventDataCollected={handleEventDataCollected}
      onLayoutGenerated={onLayoutGenerated}
      onScriptGenerated={onScriptGenerated}
      onVoiceSelected={onVoiceSelected}
      onAudioGenerated={onAudioGenerated}
    />
  );
}
