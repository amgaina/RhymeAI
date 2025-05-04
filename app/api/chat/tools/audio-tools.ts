import { updateScriptSegment } from "@/app/actions/event/script";
import {
  generateAudioForSegment,
  generateAudioForAllSegments,
} from "@/app/actions/event/audio-generation";
import { tool } from "ai";
import { z } from "zod";
import { getEventScriptWithPresignedUrls } from "@/app/actions/event";

/**
 * Tool for generating audio from script segments
 */
export const generateAudioTool = tool({
  description: "Generate audio for script segments using TTS",
  parameters: z.object({
    eventId: z.string(),
    segmentId: z.string(),
    voiceSettings: z
      .object({
        gender: z.enum(["male", "female", "neutral"]).optional(),
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
        language: z.string().optional(),
      })
      .optional(),
  }),
  execute: async (params) => {
    console.log("Generating audio for script segment:", params);

    try {
      // Call the server action directly to generate audio
      const result = await generateAudioForSegment(
        params.eventId,
        params.segmentId
      );

      if (result.success) {
        return {
          success: true,
          segmentId: params.segmentId,
          audioUrl: result.audioUrl,
          message: "Audio generated and segment updated successfully",
        };
      } else {
        throw new Error(result.error || "Failed to generate audio");
      }
    } catch (error) {
      console.error("Error generating audio:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      };
    }
  },
});

/**
 * Tool for batch generating audio for multiple script segments
 */
export const batchGenerateAudioTool = tool({
  description: "Generate audio for multiple script segments at once",
  parameters: z.object({
    eventId: z.string(),
    segmentIds: z.array(z.string()),
    voiceSettings: z
      .object({
        gender: z.enum(["male", "female", "neutral"]).optional(),
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
        language: z.string().optional(),
      })
      .optional(),
  }),
  execute: async (params) => {
    console.log("Batch generating audio for segments:", params);

    try {
      // Call the server action directly to generate audio for all segments
      const result = await generateAudioForAllSegments(params.eventId);

      if (result.success) {
        return {
          success: true,
          results: result.results,
          successCount: result.successCount,
          totalCount: result.processedCount,
          message: result.message,
        };
      } else {
        throw new Error(result.error || "Failed to generate audio");
      }
    } catch (error) {
      console.error("Error in batch audio generation:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      };
    }
  },
});

/**
 * Tool for listing all audio files for a specific event
 */

export const listAudioFilesTool = tool({
  description: "List all audio files for a specific event",
  parameters: z.object({
    eventId: z.string(),
  }),
  execute: async (params) => {
    console.log("Listing audio files for event:", params);
    try {
      // Call the server action to list audio files for the event
      const result = await getEventScriptWithPresignedUrls(params.eventId);

      if (result.success) {
        return {
          success: true,
          audioFiles: result,
          message: result.message || "Audio files listed successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to list audio files",
        };
      }
    } catch (error) {
      console.error("Error listing audio files:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list audio files",
      };
    }
  },
});

// Export all audio tools
export const audioTools = {
  generateAudioTool,
  batchGenerateAudioTool,
  listAudioFilesTool,
};
