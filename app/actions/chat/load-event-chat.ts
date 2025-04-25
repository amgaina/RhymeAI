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

    // Convert from database format to useChat format
    const chatMessages = messages.map((msg) => {
      // Ensure each message has a unique ID
      // If the message_id is 'initial-message', make it unique by adding a timestamp
      const messageId =
        msg.message_id === "initial-message"
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
