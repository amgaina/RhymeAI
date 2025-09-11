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
import { LayoutSegment, EventLayout } from "@/types/layout";
import { ScriptSegment, VoiceSettings } from "@/types/event";
import { getEvents, getEvent } from "@/app/actions/event/utilities";
import { getScriptSegments } from "@/app/actions/event/script";

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

    // Convert speed to a value between 0.25 and 2.0 for Google TTS
    // Map "slow", "medium", "fast" to appropriate values within the valid range
    const speedValue =
      voicePreference?.speed === "fast"
        ? "75" // Maps to ~1.5 in TTS (faster but not too fast)
        : voicePreference?.speed === "slow"
        ? "25" // Maps to ~0.6 in TTS (slower but still understandable)
        : "50"; // Maps to ~1.0 in TTS (normal speed)

    // Convert pitch to a value between -20 and 20 for Google TTS
    // Map "low", "medium", "high" to appropriate values within the valid range
    const pitchValue =
      voicePreference?.pitch === "high"
        ? "70" // Maps to ~8 in TTS (higher but not too high)
        : voicePreference?.pitch === "low"
        ? "30" // Maps to ~-8 in TTS (lower but not too low)
        : "50"; // Maps to 0 in TTS (neutral pitch)

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

/**
 * Tool for getting all events for the current user
 */
export const getEventsTool = tool({
  description: "Get all events for the current user",
  parameters: z.object({}),
  execute: async () => {
    try {
      const result = await getEvents();

      if (result.success && result.events) {
        return {
          success: true,
          events: result.events.map((event) => ({
            id: event.event_id,
            name: event.title,
            type: event.event_type,
            date: event.event_date,
            status: event.status,
            location: event.location || null,
            description: event.description || null,
            createdAt: event.created_at,
            updatedAt: event.updated_at,
          })),
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to get events",
        };
      }
    } catch (error) {
      console.error("Error getting events:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get events",
      };
    }
  },
});

/**
 * Tool for getting a specific event by ID
 */
export const getEventDetailsTool = tool({
  description: "Get detailed information about a specific event",
  parameters: z.object({
    eventId: z.string().describe("The ID of the event to retrieve"),
  }),
  execute: async (params) => {
    try {
      const eventIdNum = parseInt(params.eventId, 10);
      if (isNaN(eventIdNum)) {
        return {
          success: false,
          error: "Invalid event ID format",
        };
      }

      const result = await getEvent(eventIdNum);

      if (result.success && result.event) {
        // Parse voice settings
        const voiceSettings =
          typeof result.event.voice_settings === "string"
            ? JSON.parse(result.event.voice_settings as string)
            : result.event.voice_settings || {};

        return {
          success: true,
          event: {
            id: result.event.event_id,
            name: result.event.title,
            type: result.event.event_type,
            date: result.event.event_date,
            status: result.event.status,
            location: result.event.location || null,
            description: result.event.description || null,
            expectedAttendees: result.event.expected_attendees,
            voiceSettings: voiceSettings,
            language: result.event.language,
            createdAt: result.event.created_at,
            updatedAt: result.event.updated_at,
          },
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to get event details",
        };
      }
    } catch (error) {
      console.error("Error getting event details:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get event details",
      };
    }
  },
});

/**
 * Tool for getting the layout of a specific event
 */
export const getEventLayoutTool = tool({
  description: "Get the layout segments for a specific event",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The ID of the event to retrieve the layout for"),
  }),
  execute: async (params) => {
    try {
      const eventIdNum = parseInt(params.eventId, 10);
      if (isNaN(eventIdNum)) {
        return {
          success: false,
          error: "Invalid event ID format",
        };
      }

      // Get the event with layout from the database
      const { db } = await import("@/lib/db");
      const event = await db.events.findUnique({
        where: { event_id: eventIdNum },
        include: {
          layout: {
            include: {
              segments: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      });

      if (!event) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      if (!event.layout) {
        // Check for legacy JSON layout
        if (event.event_layout) {
          const jsonLayout =
            typeof event.event_layout === "string"
              ? JSON.parse(event.event_layout as string)
              : event.event_layout;

          return {
            success: true,
            layout: {
              id: "legacy",
              eventId: event.event_id,
              segments: jsonLayout.segments || [],
              totalDuration: jsonLayout.totalDuration || 0,
              lastUpdated:
                event.updated_at?.toISOString() || new Date().toISOString(),
            },
            isLegacy: true,
          };
        }

        return {
          success: false,
          error: "Event layout not found",
        };
      }

      // Format the layout segments
      const formattedSegments = event.layout.segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        type: segment.type,
        description: segment.description,
        duration: segment.duration,
        order: segment.order,
        startTime: segment.start_time || undefined,
        endTime: segment.end_time || undefined,
      }));

      return {
        success: true,
        layout: {
          id: event.layout.id,
          eventId: event.layout.event_id,
          segments: formattedSegments,
          totalDuration: event.layout.total_duration,
          lastUpdated: event.layout.updated_at.toISOString(),
          version: event.layout.layout_version,
        },
      };
    } catch (error) {
      console.error("Error getting event layout:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get event layout",
      };
    }
  },
});

/**
 * Tool for getting script segments for a specific event
 */
export const getEventScriptTool = tool({
  description: "Get the script segments for a specific event",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The ID of the event to retrieve the script for"),
  }),
  execute: async (params) => {
    try {
      // Call the server action to get script segments
      const result = await getScriptSegments(params.eventId);

      if (result.success && result.segments) {
        // Format the script segments
        const formattedSegments = result.segments.map((segment) => ({
          id: segment.id,
          type: segment.segment_type,
          content: segment.content,
          audioUrl: segment.audio_url || null,
          status: segment.status,
          timing: segment.timing,
          order: segment.order,
        }));

        return {
          success: true,
          segments: formattedSegments,
        };
      } else {
        return {
          success: false,
          error: result.error || "Failed to get script segments",
        };
      }
    } catch (error) {
      console.error("Error getting script segments:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get script segments",
      };
    }
  },
});

/**
 * Tool for getting voice settings for a specific event
 */
export const getVoiceSettingsTool = tool({
  description: "Get the voice settings for a specific event",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The ID of the event to retrieve voice settings for"),
  }),
  execute: async (params) => {
    try {
      const eventIdNum = parseInt(params.eventId, 10);
      if (isNaN(eventIdNum)) {
        return {
          success: false,
          error: "Invalid event ID format",
        };
      }

      // Get the event from the database
      const { db } = await import("@/lib/db");
      const event = await db.events.findUnique({
        where: { event_id: eventIdNum },
        select: {
          voice_settings: true,
          language: true,
        },
      });

      if (!event) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      // Parse voice settings
      const voiceSettings =
        typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings as string)
          : event.voice_settings || {};

      return {
        success: true,
        voiceSettings: {
          ...voiceSettings,
          language: event.language,
        },
      };
    } catch (error) {
      console.error("Error getting voice settings:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get voice settings",
      };
    }
  },
});

/**
 * Tool for updating voice settings for a specific event
 */
export const updateVoiceSettingsTool = tool({
  description: "Update the voice settings for a specific event",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The ID of the event to update voice settings for"),
    voiceSettings: z.object({
      gender: z.enum(["male", "female", "neutral"]).optional(),
      tone: z
        .enum(["professional", "casual", "energetic", "calm", "authoritative"])
        .optional(),
      accent: z
        .enum(["american", "british", "australian", "indian", "neutral"])
        .optional(),
      speed: z.enum(["slow", "medium", "fast"]).optional(),
      pitch: z.enum(["low", "medium", "high"]).optional(),
      language: z.string().optional(),
    }),
  }),
  execute: async (params) => {
    try {
      const eventIdNum = parseInt(params.eventId, 10);
      if (isNaN(eventIdNum)) {
        return {
          success: false,
          error: "Invalid event ID format",
        };
      }

      // Get the current event to merge voice settings
      const { db } = await import("@/lib/db");
      const event = await db.events.findUnique({
        where: { event_id: eventIdNum },
        select: {
          voice_settings: true,
        },
      });

      if (!event) {
        return {
          success: false,
          error: "Event not found",
        };
      }

      // Parse current voice settings
      const currentVoiceSettings =
        typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings as string)
          : event.voice_settings || {};

      // Merge with new settings
      const updatedVoiceSettings = {
        ...currentVoiceSettings,
        ...params.voiceSettings,
      };

      // Update language separately if provided
      const languageUpdate = params.voiceSettings.language
        ? { language: params.voiceSettings.language }
        : {};

      // Update the event
      const updatedEvent = await db.events.update({
        where: { event_id: eventIdNum },
        data: {
          voice_settings: updatedVoiceSettings,
          ...languageUpdate,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        voiceSettings: {
          ...updatedVoiceSettings,
          language: updatedEvent.language,
        },
        message: "Voice settings updated successfully",
      };
    } catch (error) {
      console.error("Error updating voice settings:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update voice settings",
      };
    }
  },
});

/**
 * Tool for updating a script segment
 */
export const updateScriptSegmentTool = tool({
  description: "Update a specific script segment",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The ID of the event containing the script segment"),
    segmentId: z.string().describe("The ID of the script segment to update"),
    content: z
      .string()
      .optional()
      .describe("The new content for the script segment"),
    status: z
      .enum([
        "draft",
        "editing",
        "generating",
        "generated",
        "failed",
        "approved",
      ])
      .optional(),
  }),
  execute: async (params) => {
    try {
      const eventIdNum = parseInt(params.eventId, 10);
      const segmentIdNum = parseInt(params.segmentId, 10);

      if (isNaN(eventIdNum) || isNaN(segmentIdNum)) {
        return {
          success: false,
          error: "Invalid ID format",
        };
      }

      // Prepare update data
      const updateData: any = {};
      if (params.content !== undefined) updateData.content = params.content;
      if (params.status !== undefined) updateData.status = params.status;

      // Update the script segment
      const { db } = await import("@/lib/db");
      const updatedSegment = await db.script_segments.update({
        where: {
          id: segmentIdNum,
          event_id: eventIdNum,
        },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        segment: {
          id: updatedSegment.id,
          type: updatedSegment.segment_type,
          content: updatedSegment.content,
          audioUrl: updatedSegment.audio_url || null,
          status: updatedSegment.status,
          timing: updatedSegment.timing,
          order: updatedSegment.order,
        },
        message: "Script segment updated successfully",
      };
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

/**
 * Tool for listing all events
 */
export const listEventsTool = tool({
  description:
    "List all events for the current user with their status and basic information",
  parameters: z.object({
    status: z
      .enum(["all", "draft", "ready", "completed"])
      .optional()
      .describe("Filter events by status"),
    limit: z
      .number()
      .optional()
      .describe("Limit the number of events returned"),
    sortBy: z
      .enum(["date", "name", "status", "created"])
      .optional()
      .describe("Sort events by this field"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order (ascending or descending)"),
  }),
  execute: async (params) => {
    try {
      // Get the events from the database
      const { db } = await import("@/lib/db");
      const { auth } = await import("@clerk/nextjs/server");

      const { userId } = await auth();
      if (!userId) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      // Build the query
      const query: any = {
        where: {
          user_id: userId,
        },
        orderBy: {},
        include: {
          layout: true,
          segments: true,
        },
      };

      // Add status filter if provided
      if (params.status && params.status !== "all") {
        query.where.status = params.status;
      }

      // Add sorting
      const sortField = params.sortBy || "created_at";
      const sortOrder = params.sortOrder || "desc";

      // Map the sort field to the database field
      let dbSortField = "created_at";
      if (sortField === "date") dbSortField = "event_date";
      else if (sortField === "name") dbSortField = "title";
      else if (sortField === "status") dbSortField = "status";
      else if (sortField === "created") dbSortField = "created_at";

      query.orderBy[dbSortField] = sortOrder;

      // Add limit if provided
      if (params.limit) {
        query.take = params.limit;
      }

      // Get the events
      const events = await db.events.findMany(query);

      // Format the events
      const formattedEvents = events.map((event: any) => ({
        id: event.event_id,
        name: event.title,
        type: event.event_type,
        date: event.event_date,
        status: event.status,
        location: event.location || null,
        description: event.description || null,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        // Check if layout exists by checking the layout relation
        hasLayout: !!event.layout,
        // Check if script exists by checking if there are any script segments
        hasScript: event.segments && event.segments.length > 0,
        // Check if any script segments have audio URLs
        hasAudio:
          event.segments &&
          event.segments.some((segment: any) => !!segment.audio_url),
      }));

      return {
        success: true,
        events: formattedEvents,
        total: formattedEvents.length,
        filters: {
          status: params.status || "all",
          sortBy: params.sortBy || "created",
          sortOrder: params.sortOrder || "desc",
        },
      };
    } catch (error) {
      console.error("Error listing events:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list events",
      };
    }
  },
});

// Export all event tools
export const eventTools = {
  // Create and store
  storeEventDataTool,

  // Read
  getEventsTool,
  getEventDetailsTool,
  getEventLayoutTool,
  getEventScriptTool,
  getVoiceSettingsTool,
  listEventsTool,

  // Update
  generateEventLayoutTool,
  generateEventLayoutWithLLMTool,
  updateLayoutSegmentTool,
  updateVoiceSettingsTool,
  updateScriptSegmentTool,

  // Finalize
  finalizeEventTool,

  // Legacy tools
  eventLayoutTools,
};
