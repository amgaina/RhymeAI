"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Server action to prepare data for showing event layout in chat UI
 */
export async function prepareLayoutForChat(eventId: string) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Get the event with layout data
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      include: {
        layout: {
          include: {
            segments: true,
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (!event.layout) {
      return { success: false, error: "Event layout not found" };
    }

    // Format the layout data for the client
    const formattedLayout = {
      id: event.layout.id,
      eventId: event.layout.event_id,
      totalDuration: event.layout.total_duration,
      lastUpdated: event.layout.updated_at.toISOString(),
      segments: event.layout.segments.map((segment) => {
        // Extract start and end times from custom_properties
        const customProps = (segment.custom_properties as Record<string, any>) || {};

        return {
          id: segment.id,
          name: segment.name,
          type: segment.type,
          description: segment.description,
          duration: segment.duration,
          order: segment.order,
          startTime: segment.start_time || customProps.start_time || "",
          endTime: segment.end_time || customProps.end_time || "",
        };
      }),
    };

    return {
      success: true,
      layout: formattedLayout,
      eventName: event.title,
    };
  } catch (error) {
    console.error("Error preparing layout for chat:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare layout",
    };
  }
}

/**
 * Server action to prepare data for showing event script in chat UI
 */
export async function prepareScriptForChat(eventId: string) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Get the event with script segments
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      include: {
        segments: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (!event.segments || event.segments.length === 0) {
      return { success: false, error: "No script segments found for this event" };
    }

    // Format the script segments for the client
    const formattedSegments = event.segments.map((segment) => ({
      id: segment.id,
      type: segment.segment_type,
      content: segment.content,
      audio: segment.audio_url,
      status: segment.status as "draft" | "editing" | "generating" | "generated",
      order: segment.order,
      timing: segment.timing,
      presentationSlide: null,
    }));

    return {
      success: true,
      segments: formattedSegments,
      eventName: event.title,
    };
  } catch (error) {
    console.error("Error preparing script for chat:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare script",
    };
  }
}

/**
 * Record that the user viewed layout or script from chat
 * This is useful for analytics and improving the chat experience
 */
export async function recordChatUIInteraction(
  eventId: string,
  componentType: string,
  messageId: string
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      return { success: false };
    }

    // Record the interaction in the database
    await db.chat_messages.create({
      data: {
        event_id: eventIdNum,
        user_id: session.userId,
        role: "system",
        content: `User viewed ${componentType} from chat`,
        message_id: `${messageId}_view_${componentType}`,
        tool_calls: {
          type: "view",
          component: componentType,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording chat UI interaction:", error);
    return { success: false };
  }
}
