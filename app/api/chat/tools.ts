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
      })
      .optional(),
    language: z.string().optional(),
  }),
  execute: async (params) => {
    // Here you would add code to store this data in your database
    console.log("Storing event data:", params);
    return {
      success: true,
      storedData: params,
    };
  },
});

/**
 * Tool for generating TTS-ready scripts
 */
export const generateScriptTool = tool({
  description: "Generate a TTS-ready script for the event",
  parameters: z.object({
    title: z.string(),
    sections: z.array(
      z.object({
        name: z.string(),
        content: z.string(),
      })
    ),
  }),
  execute: async (params) => {
    // Here you would add code to process the script, possibly save it, etc.
    console.log("Generating script:", params);
    return {
      success: true,
      script: params,
    };
  },
});
