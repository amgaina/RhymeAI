"use client";

import { useState, useEffect } from "react";
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

  // Track collected information
  useEffect(() => {
    const allRequiredFields = eventContext?.requiredFields || [];
    const requiredFieldsCollected = allRequiredFields.every(
      (field) => collectedFields[field]
    );
    setIsDataComplete(requiredFieldsCollected && allRequiredFields.length > 0);
  }, [collectedFields, eventContext?.requiredFields]);

  // Extract field information from messages
  useEffect(() => {
    const newCollectedFields = { ...collectedFields };
    const fieldPatterns =
      eventContext?.requiredFields?.map((field) => ({
        field,
        regex: new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i"),
      })) || [];

    // Check each message for fields
    messages.forEach((message) => {
      if (!message.content) return;

      fieldPatterns.forEach(({ field, regex }) => {
        if (message.content.toLowerCase().includes(field.toLowerCase())) {
          newCollectedFields[field] = true;
        }
      });
    });

    setCollectedFields(newCollectedFields);
  }, [messages, eventContext?.requiredFields]);

  // Calculate progress percentage
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
        messages.forEach((msg) => {
          if (msg.content?.toLowerCase().includes(field.toLowerCase())) {
            const match = msg.content.match(
              new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i")
            );
            if (match?.[1]) {
              eventData[field] = match[1].trim();
            }
          }
        });
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
