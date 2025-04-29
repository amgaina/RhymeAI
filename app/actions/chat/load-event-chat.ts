"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Loads all chat messages for a specific event
 * This is used to display the chat history when a user returns to an event
 */
export async function loadEventChatHistory(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(`Loading chat history for event ${eventId} and user ${userId}`);

    // Get the event to check if it exists and belongs to the user
    const event = await db.events.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!event) {
      console.error(
        `Event ${eventId} not found or access denied for user ${userId}`
      );
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

    console.log(
      `Found ${messages.length} messages in the database for event ${eventId}`
    );

    // Log the first few messages for debugging
    if (messages.length > 0) {
      messages.slice(0, 3).forEach((msg, i) => {
        console.log(
          `Message ${i}: ${msg.role} - ${msg.content.substring(0, 50)}...`
        );
      });
    }

    // Convert from database format to useChat format
    const chatMessages = messages.map((msg) => {
      // Ensure each message has a unique ID
      // If the message_id is 'initial-message', make it unique by adding a timestamp
      const messageId =
        msg.message_id === "initial-message" ||
        msg.message_id === "initial-message-db"
          ? `initial-message-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`
          : msg.message_id;

      return {
        id: messageId,
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
      },
    };
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load chat history",
      messages: [],
    };
  }
}
