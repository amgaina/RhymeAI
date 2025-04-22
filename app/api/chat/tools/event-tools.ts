import { createEvent, finalizeEvent } from "@/app/actions/event";
import { generateEventLayout, updateEventLayoutSegment } from "@/app/actions/event/layout";
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for storing event data collected during conversation
 */
export const storeEventDataTool = tool({
  description: "Store collected event information",
  parameters: z.object({
    eventName: z.string(),
    eventType: z.string(),
    eventDate: z.string(),
    eventLocation: z.string().optional(),
    audienceSize: z.string().optional(),
    speakerInfo: z.string().optional(),
    voicePreference: z
      .object({
        gender: z.enum(["male", "female", "neutral"]).optional(),
        age: z.enum(["young", "middle-aged", "mature"]).optional(),
        tone: z
          .enum([
            "professional",
            "casual",
            "energetic",
            "calm",
            "authoritative",
          ])
          .optional(),
        accent: z
          .enum(["american", "british", "australian", "indian", "neutral"])
          .optional(),
        speed: z.enum(["slow", "medium", "fast"]).optional(),
        pitch: z.enum(["low", "medium", "high"]).optional(),
      })
      .optional(),
    language: z.string().optional(),
    eventDescription: z.string().optional(),
  }),
  execute: async (params) => {
    console.log("Storing event data:", params);

    // Create FormData object to match what the server action expects
    const formData = new FormData();

    // Add basic event details
    formData.append("eventName", params.eventName);
    formData.append("eventType", params.eventType);
    formData.append("eventDate", params.eventDate);

    // Add optional fields
    if (params.eventLocation) {
      formData.append("eventLocation", params.eventLocation);
    }

    if (params.audienceSize) {
      formData.append("expectedAttendees", params.audienceSize);
    }

    if (params.eventDescription) {
      formData.append("eventDescription", params.eventDescription);
    }

    // Set language
    formData.append("language", params.language || "English");

    // Add voice settings with default values to avoid validation errors
    const voicePreference = params.voicePreference || {};

    // Set default values for required voice settings
    formData.append("voiceGender", voicePreference.gender || "neutral");
    formData.append("voiceType", voicePreference.tone || "professional");
    formData.append("accent", voicePreference.accent || "american");

    // Always provide default values for speakingRate and pitch
    // Convert logical values to numeric strings expected by the server
    const speedValue =
      voicePreference.speed === "fast"
        ? "80"
        : voicePreference.speed === "slow"
        ? "20"
        : "50"; // Default to medium

    const pitchValue =
      voicePreference.pitch === "high"
        ? "80"
        : voicePreference.pitch === "low"
        ? "20"
        : "50"; // Default to medium

    formData.append("speakingRate", speedValue);
    formData.append("pitch", pitchValue);

    try {
      // Call the server action with the FormData
      const result = await createEvent(formData);

      if (result.success) {
        return {
          success: true,
          message: result.message || "Event created successfully",
          eventId: result.eventId,
          storedData: params,
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to create event",
          storedData: params,
        };
      }
    } catch (error) {
      console.error("Error creating event from AI tool:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        storedData: params,
      };
    }
  },
});

/**
 * Tool for generating event layout with timing suggestions
 */
export const generateEventLayoutTool = tool({
  description:
    "Generate a rough event layout with timing suggestions based on event type",
  parameters: z.object({
    eventId: z.string(),
    eventType: z.string().optional(),
    totalDuration: z.number().optional(),
  }),
  execute: async (params) => {
    console.log("Generating event layout:", params);

    try {
      // Call the server action to generate the event layout
      const result = await generateEventLayout(params.eventId);

      if (result.success) {
        return {
          success: true,
          layout: result.layout,
          message: result.message || "Event layout generated successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to generate event layout",
        };
      }
    } catch (error) {
      console.error("Error generating event layout:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate event layout",
      };
    }
  },
});

/**
 * Tool for updating event layout segments
 */
export const updateLayoutSegmentTool = tool({
  description: "Update a segment in the event layout",
  parameters: z.object({
    eventId: z.string(),
    segmentIndex: z.number(),
    name: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    duration: z.number().optional(),
    order: z.number().optional(),
  }),
  execute: async (params) => {
    console.log("Updating layout segment:", params);

    try {
      // Prepare update data
      const updates: any = {};

      if (params.name !== undefined) updates.name = params.name;
      if (params.type !== undefined) updates.type = params.type;
      if (params.description !== undefined)
        updates.description = params.description;
      if (params.duration !== undefined) updates.duration = params.duration;
      if (params.order !== undefined) updates.order = params.order;

      // Call the server action to update the layout segment
      const result = await updateEventLayoutSegment(
        params.eventId,
        params.segmentIndex,
        updates
      );

      if (result.success) {
        return {
          success: true,
          layout: result.layout,
          message: result.message || "Layout segment updated successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to update layout segment",
        };
      }
    } catch (error) {
      console.error("Error updating layout segment:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update layout segment",
      };
    }
  },
});

/**
 * Tool for finalizing an event
 */
export const finalizeEventTool = tool({
  description: "Finalize an event, marking it as ready for presentation",
  parameters: z.object({
    eventId: z.string(),
  }),
  execute: async (params) => {
    console.log("Finalizing event:", params);

    try {
      // Call the server action to finalize the event
      const result = await finalizeEvent(params.eventId);

      if (result.success) {
        return {
          success: true,
          event: result.event,
          message: result.message || "Event finalized successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to finalize event",
        };
      }
    } catch (error) {
      console.error("Error finalizing event:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to finalize event",
      };
    }
  },
});

// Export all event tools
export const eventTools = {
  storeEventDataTool,
  generateEventLayoutTool,
  updateLayoutSegmentTool,
  finalizeEventTool,
};
