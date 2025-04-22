import { createEvent } from "@/app/actions/event";
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
 * Tool for generating TTS-ready scripts
 */
export const generateScriptTool = tool({
  description: "Generate a TTS-ready script for the event",
  parameters: z.object({
    eventId: z.string(),
    title: z.string(),
    sections: z.array(
      z.object({
        name: z.string(),
        content: z.string(),
        type: z.string().optional(),
      })
    ),
  }),
  execute: async (params) => {
    // Here you would integrate with your script creation server action
    console.log("Generating script:", params);

    // Create script segments from the sections
    const scriptSegments = params.sections.map((section, index) => ({
      type: section.type || section.name.toLowerCase().replace(/\s+/g, "_"),
      content: section.content,
      status: "draft",
      order: index + 1,
    }));

    try {
      // Here you would call your server action to save the script segments
      // For example: await saveScriptSegments(params.eventId, scriptSegments);

      return {
        success: true,
        script: {
          title: params.title,
          segments: scriptSegments,
          eventId: params.eventId,
        },
        message: "Script generated successfully",
      };
    } catch (error) {
      console.error("Error generating script:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate script",
      };
    }
  },
});
