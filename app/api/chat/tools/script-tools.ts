import {
  createScriptSegment,
  updateScriptSegment,
} from "@/app/actions/event/script";
import { generateScriptFromLayout as generateScriptFromLayoutAction } from "@/app/actions/event/script-generation";
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for generating script from event layout
 */
export const generateScriptFromLayoutTool = tool({
  description: "Generate script segments from the event layout",
  parameters: z.object({
    eventId: z.string(),
  }),
  execute: async (params) => {
    console.log("Generating script from layout:", params);

    try {
      // Call the server action to generate script from layout
      const result = await generateScriptFromLayoutAction(params.eventId);

      if (result.success) {
        return {
          success: true,
          segments: result.segments,
          message:
            result.message || "Script generated from layout successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to generate script from layout",
        };
      }
    } catch (error) {
      console.error("Error generating script from layout:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate script from layout",
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
    console.log("Generating script:", params);

    // Create script segments from the sections
    const scriptSegments = params.sections.map((section, index) => ({
      type: section.type || section.name.toLowerCase().replace(/\\s+/g, "_"),
      content: section.content,
      status: "draft" as const,
      order: index + 1,
    }));

    try {
      // Save each script segment using the server action
      const savedSegments = await Promise.all(
        scriptSegments.map(async (segment) => {
          const result = await createScriptSegment(params.eventId, {
            type: segment.type,
            content: segment.content,
            status: segment.status,
            order: segment.order,
          });

          return result.success ? result.segment : null;
        })
      );

      // Filter out any segments that failed to save
      const successfulSegments = savedSegments.filter(Boolean);

      return {
        success: successfulSegments.length > 0,
        script: {
          title: params.title,
          segments: successfulSegments,
          eventId: params.eventId,
        },
        message:
          successfulSegments.length > 0
            ? "Script generated and saved successfully"
            : "Failed to save script segments",
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

/**
 * Tool for updating script segments
 */
export const updateScriptTool = tool({
  description: "Update an existing script segment",
  parameters: z.object({
    eventId: z.string(),
    segmentId: z.string(),
    content: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(["draft", "edited", "generated", "approved"]).optional(),
    order: z.number().optional(),
  }),
  execute: async (params) => {
    console.log("Updating script segment:", params);

    try {
      // Prepare update data
      const updateData: any = {};

      if (params.content !== undefined) updateData.content = params.content;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.order !== undefined) updateData.order = params.order;

      // Add required ID field
      updateData.id = params.segmentId;

      // Call the server action to update the segment
      const result = await updateScriptSegment(params.segmentId, updateData);

      if (result.success) {
        return {
          success: true,
          segment: result.segment,
          message: "Script segment updated successfully",
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to update script segment",
        };
      }
    } catch (error) {
      console.error("Error updating script segment:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update script segment",
      };
    }
  },
});

// Export all script tools
export const scriptTools = {
  generateScriptFromLayoutTool,
  generateScriptTool,
  updateScriptTool,
};
