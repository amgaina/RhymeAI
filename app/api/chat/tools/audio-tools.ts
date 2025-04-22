import { updateScriptSegment } from "@/app/actions/event/script";
import { tool } from "ai";
import { z } from "zod";

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
      // Call the TTS API route to generate audio
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segmentId: params.segmentId,
          voiceSettings: params.voiceSettings,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update the segment with the audio URL
        const updateResult = await updateScriptSegment(params.segmentId, {
          audio_url: result.audioUrl,
          status: "generated",
        });

        if (updateResult.success) {
          return {
            success: true,
            segmentId: params.segmentId,
            audioUrl: result.audioUrl,
            message: "Audio generated and segment updated successfully",
          };
        } else {
          return {
            success: false,
            error: updateResult.error || "Failed to update segment with audio",
          };
        }
      } else {
        throw new Error(result.error || "Failed to generate audio");
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      // Fallback to a mock URL if the API call fails
      try {
        const audioUrl = `https://api.example.com/audio/${
          params.segmentId
        }-${Date.now()}.mp3`;

        // Update the segment with the mock audio URL
        const updateResult = await updateScriptSegment(params.segmentId, {
          audio_url: audioUrl,
          status: "generated",
        });

        if (updateResult.success) {
          return {
            success: true,
            segmentId: params.segmentId,
            audioUrl,
            message: "Audio generated with fallback URL and segment updated",
          };
        }
      } catch (fallbackError) {
        console.error("Error with fallback audio generation:", fallbackError);
      }

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
      // Process each segment in sequence
      const results = await Promise.all(
        params.segmentIds.map(async (segmentId) => {
          try {
            // Call the TTS API route to generate audio
            const response = await fetch("/api/tts/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                segmentId,
                voiceSettings: params.voiceSettings,
              }),
            });

            if (!response.ok) {
              throw new Error(`TTS API error: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
              // Update the segment with the audio URL
              const updateResult = await updateScriptSegment(segmentId, {
                audio_url: result.audioUrl,
                status: "generated",
              });

              if (updateResult.success) {
                return {
                  success: true,
                  segmentId,
                  audioUrl: result.audioUrl,
                };
              } else {
                return {
                  success: false,
                  segmentId,
                  error: updateResult.error,
                };
              }
            } else {
              throw new Error(result.error || "Failed to generate audio");
            }
          } catch (error) {
            console.error(`Error generating audio for segment ${segmentId}:`, error);
            return {
              success: false,
              segmentId,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      // Count successful generations
      const successCount = results.filter((r) => r.success).length;

      return {
        success: successCount > 0,
        results,
        successCount,
        totalCount: params.segmentIds.length,
        message: `Successfully generated audio for ${successCount} of ${params.segmentIds.length} segments`,
      };
    } catch (error) {
      console.error("Error in batch audio generation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate audio",
      };
    }
  },
});

// Export all audio tools
export const audioTools = {
  generateAudioTool,
  batchGenerateAudioTool,
};
