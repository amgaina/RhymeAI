import { createEvent, finalizeEvent } from "@/app/actions/event";
import {
  generateEventLayout,
  updateEventLayoutSegment,
  addLayoutSegment,
  deleteLayoutSegment,
  generateScriptFromLayout,
} from "@/app/actions/event/layout";
import { tool } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { LayoutSegment } from "@/types/layout";

// We now use the LayoutSegment type from @/types/layout

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
    formData.append("voiceGender", voicePreference?.gender || "neutral");
    formData.append("voiceType", voicePreference?.tone || "professional");
    formData.append("accent", voicePreference?.accent || "american");

    const speedValue =
      voicePreference?.speed === "fast"
        ? "80"
        : voicePreference?.speed === "slow"
        ? "20"
        : "50";

    const pitchValue =
      voicePreference?.pitch === "high"
        ? "80"
        : voicePreference?.pitch === "low"
        ? "20"
        : "50";

    formData.append("speakingRate", speedValue);
    formData.append("pitch", pitchValue);

    try {
      // Call the server action with the FormData
      const result = await createEvent(formData);

      if (result.success) {
        // link chat to event
        return {
          success: true,
          message: "Event created successfully",
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
    "Generate an AI-powered event layout with timing suggestions based on event details",
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
          layout: "layout" in result ? result.layout : undefined,
          message:
            "message" in result
              ? result.message
              : "Event layout generated successfully",
          isAIGenerated: "aiContext" in result ? true : false,
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
 * Tool for generating event layout with LLM
 */
export const generateEventLayoutWithLLMTool = tool({
  description:
    "Generate a customized event layout using AI based on event details and conversation context",
  parameters: z.object({
    eventId: z.string(),
    conversationContext: z
      .string()
      .optional()
      .describe(
        "Relevant parts of the conversation to inform layout generation"
      ),
    eventType: z.string().optional(),
    audience: z.string().optional(),
    purpose: z.string().optional(),
    specificRequests: z.string().optional(),
    totalDuration: z.number().optional(),
  }),
  execute: async (params) => {
    console.log("Generating AI-powered event layout:", params);

    try {
      // Get event details first
      const eventIdNum = parseInt(params.eventId, 10);
      if (isNaN(eventIdNum)) {
        return {
          success: false,
          error: "Invalid event ID format",
        };
      }

      // Assuming a function to get event details exists
      const event = await getEventDetails(params.eventId);
      if (!event) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      // Prepare context for the LLM
      const prompt = generateLayoutPrompt(
        event,
        params.conversationContext || "",
        params.specificRequests || "",
        params.audience || "",
        params.purpose || "",
        params.totalDuration || guessEventDuration(event.event_type)
      );

      // Call LLM to generate layout
      // const layoutResponse = await google.chat("gemini-pro", {
      //   content: [
      //     {
      //       role: "system",
      //       content:
      //         "You are an event planning expert assistant. Create a detailed event layout with appropriate segments, timings, and descriptions.",
      //     },
      //     { role: "user", content: prompt },
      //   ],
      //   temperature: 0.7,
      // });

      const { text: layoutResponse } = await generateText({
        model: google("gemini-2.0-flash-exp", {}),
        messages: [
          {
            role: "system",
            content:
              "You are an event planning expert assistant. Create a detailed event layout with appropriate segments, timings, and descriptions.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      // Parse the response
      if (!layoutResponse) {
        throw new Error("Failed to get layout from LLM");
      }
      const layoutContent = layoutResponse;

      // Parse the JSON response
      const layoutData = JSON.parse(layoutContent);

      // Validate the layout data
      if (!layoutData.segments || !Array.isArray(layoutData.segments)) {
        throw new Error("Invalid layout format returned from LLM");
      }

      // We'll let the server action handle the layout segment creation

      // We'll let the server action calculate the total duration based on the event details

      // Import the generateAIEventLayout function from the server action
      const { generateAIEventLayout } = await import(
        "@/app/actions/event/layout/ai-generator"
      );

      // Call the server action to generate and store the layout
      const result = await generateAIEventLayout(params.eventId);

      if (result.success) {
        return {
          success: true,
          layout: "layout" in result ? result.layout : undefined,
          message:
            "message" in result
              ? result.message
              : "AI-generated event layout created successfully",
          llmContext:
            layoutData.reasoning ||
            ("aiContext" in result
              ? result.aiContext
              : "Layout generated based on event type and requirements"),
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to store AI-generated layout",
        };
      }
    } catch (error) {
      console.error("Error generating layout with LLM:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate event layout with AI",
      };
    }
  },
});

/**
 * Generate a prompt for the LLM to create an event layout
 */
function generateLayoutPrompt(
  event: any,
  conversationContext: string,
  specificRequests: string,
  audience: string,
  purpose: string,
  totalDuration: number
): string {
  return `
Create a detailed event layout for "${event.title}" which is a ${
    event.event_type
  }.
The event will last approximately ${totalDuration} minutes in total.

${event.description ? `Event description: ${event.description}` : ""}
${audience ? `Target audience: ${audience}` : ""}
${purpose ? `Event purpose: ${purpose}` : ""}
${specificRequests ? `Specific requirements: ${specificRequests}` : ""}

${
  conversationContext
    ? `Additional context from conversation: ${conversationContext}`
    : ""
}

Please create a JSON object with an array of segments. Each segment should have:
- name: A concise title for the segment
- type: The type of segment (introduction, keynote, panel, break, q_and_a, conclusion, presentation, demo, etc)
- description: A brief description of what happens in this segment
- duration: The length in minutes
- order: The sequence number of this segment
- notes: Any specific notes or guidance for this segment

Also include a "reasoning" field explaining why you structured the layout this way.

The JSON should follow this format:
{
  "segments": [
    {
      "name": "Welcome and Introduction",
      "type": "introduction",
      "description": "Opening remarks and welcome to attendees",
      "duration": 10,
      "order": 1,
      "notes": "Keep energetic and brief"
    },
    ...
  ],
  "reasoning": "This layout was designed to..."
}
`;
}

/**
 * Estimate event duration based on event type
 */
function guessEventDuration(eventType: string): number {
  const type = eventType?.toLowerCase() || "general";

  if (type.includes("conference")) return 180; // 3 hours
  if (type.includes("webinar")) return 90; // 1.5 hours
  if (type.includes("workshop")) return 120; // 2 hours
  if (type.includes("meeting")) return 60; // 1 hour
  if (type.includes("seminar")) return 120; // 2 hours

  return 60; // Default to 1 hour
}

// The storeGeneratedLayout function has been removed as we now use the generateAIEventLayout server action directly

/**
 * Helper function to get event details
 */
async function getEventDetails(eventId: string) {
  try {
    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) return null;

    const { db } = await import("@/lib/db");

    return await db.events.findUnique({
      where: {
        event_id: eventIdNum,
      },
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return null;
  }
}

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
        params.segmentIndex.toString(),
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

      if (result.success && result.event) {
        return {
          success: true,
          event: result.event,
          message: result || "Event finalized successfully",
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

/**
 * Tools for event layout management
 */
export const eventLayoutTools = [
  {
    type: "function",
    function: {
      name: "generateEventLayout",
      description: "Generates a default layout for an event based on its type",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event for which to generate a layout",
          },
        },
        required: ["eventId"],
      },
    },
    execute: async ({ eventId }: { eventId: string }) => {
      try {
        const result = await generateEventLayout(eventId);
        return result;
      } catch (error) {
        console.error("Error executing generateEventLayout:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    type: "function",
    function: {
      name: "updateLayoutSegment",
      description: "Updates a specific segment in an event's layout",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event containing the layout",
          },
          segmentId: {
            type: "string",
            description: "The ID of the segment to update",
          },
          updates: {
            type: "object",
            description: "The properties to update on the segment",
            properties: {
              name: {
                type: "string",
                description: "The display name of the segment",
              },
              type: {
                type: "string",
                description:
                  "The type of segment (introduction, keynote, etc.)",
              },
              description: {
                type: "string",
                description: "A brief description of the segment",
              },
              duration: {
                type: "number",
                description: "The duration of the segment in minutes",
              },
              order: {
                type: "number",
                description: "The order of the segment in the event flow",
              },
            },
          },
        },
        required: ["eventId", "segmentId", "updates"],
      },
    },
    execute: async ({
      eventId,
      segmentId,
      updates,
    }: {
      eventId: string;
      segmentId: string;
      updates: Partial<LayoutSegment>;
    }) => {
      try {
        const result = await updateEventLayoutSegment(
          eventId,
          segmentId,
          updates
        );
        return result;
      } catch (error) {
        console.error("Error executing updateLayoutSegment:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    type: "function",
    function: {
      name: "addLayoutSegment",
      description: "Adds a new segment to an event's layout",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event containing the layout",
          },
          segment: {
            type: "object",
            description: "The new segment to add",
            properties: {
              name: {
                type: "string",
                description: "The display name of the segment",
              },
              type: {
                type: "string",
                description:
                  "The type of segment (introduction, keynote, etc.)",
              },
              description: {
                type: "string",
                description: "A brief description of the segment",
              },
              duration: {
                type: "number",
                description: "The duration of the segment in minutes",
              },
              order: {
                type: "number",
                description: "The order of the segment in the event flow",
              },
            },
            required: ["name", "type", "description", "duration", "order"],
          },
        },
        required: ["eventId", "segment"],
      },
    },
    execute: async ({
      eventId,
      segment,
    }: {
      eventId: string;
      segment: Omit<LayoutSegment, "id">;
    }) => {
      try {
        const result = await addLayoutSegment(eventId, segment);
        return result;
      } catch (error) {
        console.error("Error executing addLayoutSegment:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    type: "function",
    function: {
      name: "deleteLayoutSegment",
      description: "Deletes a segment from an event's layout",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event containing the layout",
          },
          segmentId: {
            type: "string",
            description: "The ID of the segment to delete",
          },
        },
        required: ["eventId", "segmentId"],
      },
    },
    execute: async ({
      eventId,
      segmentId,
    }: {
      eventId: string;
      segmentId: string;
    }) => {
      try {
        const result = await deleteLayoutSegment(eventId, segmentId);
        return result;
      } catch (error) {
        console.error("Error executing deleteLayoutSegment:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    type: "function",
    function: {
      name: "generateScriptFromLayout",
      description: "Generates script segments from an event's layout",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event containing the layout",
          },
        },
        required: ["eventId"],
      },
    },
    execute: async ({ eventId }: { eventId: string }) => {
      try {
        const result = await generateScriptFromLayout(eventId);
        return result;
      } catch (error) {
        console.error("Error executing generateScriptFromLayout:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
];

// Export all event tools
export const eventTools = {
  storeEventDataTool,
  generateEventLayoutTool,
  generateEventLayoutWithLLMTool, // Add new LLM-powered tool
  updateLayoutSegmentTool,
  finalizeEventTool,
  eventLayoutTools,
};
