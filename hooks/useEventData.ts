"use client";

import { useState, useEffect, useRef } from "react";
import {
  UseEventDataProps,
  UseEventDataReturn,
  EventData,
  Message,
} from "@/types/chat";

/**
 * Custom hook for tracking and collecting event data from chat messages
 */
export function useEventData({
  messages,
  eventContext,
  onEventDataCollected,
}: UseEventDataProps): UseEventDataReturn {
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >({});
  const [isDataComplete, setIsDataComplete] = useState<boolean>(false);

  // Use ref to track previous message count to prevent unnecessary processing
  const prevMessagesCountRef = useRef<number>(0);
  const prevFieldsCountRef = useRef<number>(0);

  // Combined effect to handle both field collection and completion tracking
  useEffect(() => {
    // Skip processing if messages haven't changed in length
    if (
      prevMessagesCountRef.current === messages.length &&
      prevFieldsCountRef.current === eventContext?.requiredFields?.length
    ) {
      return;
    }

    // Update ref values
    prevMessagesCountRef.current = messages.length;
    prevFieldsCountRef.current = eventContext?.requiredFields?.length || 0;

    // Skip if no messages or no required fields
    if (!messages.length || !eventContext?.requiredFields?.length) {
      return;
    }

    // Process messages to extract fields
    const updatedFields = { ...collectedFields };
    let hasChanges = false;

    // Check each message for fields
    messages.forEach((message) => {
      if (!message.content) return;

      eventContext.requiredFields.forEach((field) => {
        // Only process fields that aren't already collected
        if (
          !updatedFields[field] &&
          message.content.toLowerCase().includes(field.toLowerCase())
        ) {
          updatedFields[field] = true;
          hasChanges = true;
        }
      });
    });

    // Only update state if there were changes
    if (hasChanges) {
      setCollectedFields(updatedFields);

      // Check if all fields are complete
      const allRequiredFields = eventContext.requiredFields || [];
      const requiredFieldsCollected = allRequiredFields.every(
        (field) => updatedFields[field]
      );

      setIsDataComplete(
        requiredFieldsCollected && allRequiredFields.length > 0
      );
    }
  }, [messages, eventContext?.requiredFields, collectedFields]);

  // Calculate progress percentage outside of effects
  const progressPercentage = eventContext?.requiredFields?.length
    ? Math.round(
        (Object.values(collectedFields).filter(Boolean).length /
          eventContext.requiredFields.length) *
          100
      )
    : 0;

  // Generate script when all data is collected
  const handleGenerateScript = (): void => {
    if (isDataComplete && onEventDataCollected) {
      // Extract event data from conversation
      const eventData: EventData = {};
      eventContext?.requiredFields?.forEach((field) => {
        // Find the first message that contains this field
        const messageWithField = messages.find((msg) =>
          msg.content?.toLowerCase().includes(field.toLowerCase())
        );

        if (messageWithField?.content) {
          const match = messageWithField.content.match(
            new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i")
          );
          if (match?.[1]) {
            eventData[field] = match[1].trim();
          }
        }
      });

      if (Object.keys(eventData).length > 0) {
        onEventDataCollected(eventData);
      }
    }
  };

  return {
    collectedFields,
    isDataComplete,
    progressPercentage,
    handleGenerateScript,
  };
}
