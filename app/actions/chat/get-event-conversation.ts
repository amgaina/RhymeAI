"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Gets the latest conversation for a specific event
 * This is used to continue an existing conversation when a user returns to an event
 */
export async function getEventConversation(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(`Getting conversation for event ${eventId} and user ${userId}`);

    // Get the event to check if it exists and belongs to the user
    const event = await db.events.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found or access denied" };
    }

    // Get all chat messages for this event
    const messages = await db.chat_messages.findMany({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    console.log(`Found ${messages.length} messages in the conversation`);

    // Convert from database format to useChat format
    const chatMessages = messages.map((msg) => {
      return {
        id: msg.message_id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        toolCalls: msg.tool_calls,
        parts: msg.content ? [{ type: "text", text: msg.content }] : undefined,
      };
    });

    return {
      success: true,
      messages: chatMessages,
      eventDetails: {
        id: event.event_id,
        title: event.title,
        description: event.description || "",
        status: event.status,
        eventType: event.event_type,
      },
    };
  } catch (error) {
    console.error("Failed to get event conversation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get event conversation",
      messages: [],
    };
  }
}
