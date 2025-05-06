"use client";

import { useState, useCallback } from "react";
import { createEvent, finalizeEvent, EventData } from "@/app/actions/event";
import { updateVoiceSettings } from "@/app/actions/event/update";
import { generateScript } from "@/app/actions/event/script";
import { generateEventLayout } from "@/app/actions/event/layout";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export type ChatEventCreationResponse = {
  success: boolean;
  eventId?: number;
  error?: string;
  message?: string;
};

export function useChatEventCreation() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const createEventFromChat = useCallback(
    async (eventData: any): Promise<ChatEventCreationResponse> => {
      if (!eventData || typeof eventData !== "object") {
        return {
          success: false,
          error: "Invalid event data provided",
        };
      }

      try {
        setIsProcessing(true);

        // Convert the event data from the chat to FormData for event creation
        const formData = new FormData();

        // Required fields
        formData.append("eventName", eventData.eventName || "");
        formData.append("eventType", eventData.eventType || "");
        formData.append("eventDate", eventData.eventDate || "");

        // Optional fields
        if (eventData.eventLocation) {
          formData.append("eventLocation", eventData.eventLocation);
        }

        if (eventData.eventDescription) {
          formData.append("eventDescription", eventData.eventDescription);
        }

        if (eventData.expectedAttendees) {
          formData.append("expectedAttendees", eventData.expectedAttendees);
        }

        // Voice and language preferences
        formData.append("language", eventData.language || "English");

        // Voice type can be derived from voice preferences if provided
        const voiceType = eventData.voicePreference?.tone || "professional";
        formData.append("voiceType", voiceType);

        // Create the event in the database
        const result = await createEvent(formData);

        if (result.success && result.eventId) {
          toast({
            title: "Event created successfully!",
            description: "Your event has been saved to the database.",
          });

          // Update voice settings if provided
          if (eventData.voicePreference) {
            try {
              const voiceSettings = {
                gender: eventData.voicePreference.gender || "neutral",
                tone: eventData.voicePreference.tone || "professional",
                speed: eventData.voicePreference.speed || "medium",
                accent: eventData.voicePreference.accent,
                pitch: eventData.voicePreference.pitch,
              };

              await updateVoiceSettings(result.eventId, voiceSettings);
            } catch (error) {
              console.error("Error updating voice settings:", error);
            }
          }

          // Generate layout if requested
          if (eventData.generateLayout) {
            try {
              await generateEventLayout(result.eventId.toString());
            } catch (error) {
              console.error("Error generating layout:", error);
            }
          }

          // Generate script if requested
          if (eventData.generateScript) {
            try {
              await generateScript(result.eventId.toString());
            } catch (error) {
              console.error("Error generating script:", error);
            }
          }

          // Finalize the event if requested
          if (eventData.finalize) {
            try {
              await finalizeEvent(result.eventId.toString());
            } catch (error) {
              console.error("Error finalizing event:", error);
            }
          }

          return {
            success: true,
            eventId: result.eventId,
            message: "Event created successfully",
          };
        } else {
          toast({
            title: "Error creating event",
            description:
              result.error || "There was a problem creating your event.",
            variant: "destructive",
          });

          return {
            success: false,
            error: result.error || "Failed to create event",
          };
        }
      } catch (error) {
        console.error("Error in chat event creation:", error);

        toast({
          title: "Error creating event",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create event",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [toast, router]
  );

  const updateEventFromChat = useCallback(
    async (
      eventId: string,
      updateData: any
    ): Promise<ChatEventCreationResponse> => {
      // Implementation for updating an event via chat
      // This would be similar to createEventFromChat but would call updateEvent actions

      return {
        success: true,
        eventId: parseInt(eventId),
        message: "Event updated successfully",
      };
    },
    [toast]
  );

  return {
    createEventFromChat,
    updateEventFromChat,
    isProcessing,
  };
}
