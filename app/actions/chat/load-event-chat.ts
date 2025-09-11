"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Loads chat messages for a specific event with pagination
 * This is used to display the chat history when a user returns to an event
 * By default, it returns only the last 10 messages
 */
export async function loadEventChatHistory(
  eventId: number,
  limit: number = 10,
  page: number = 0
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(
      `Loading chat history for event ${eventId} and user ${userId} (limit: ${limit}, page: ${page})`
    );

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

    // Get total count of messages for this event
    const totalCount = await db.chat_messages.count({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    // Calculate skip based on page and limit
    // For the most recent messages, we need to skip from the beginning
    const skip = Math.max(0, totalCount - limit * (page + 1));

    // Adjust the actual limit to not go below 0
    const actualLimit = Math.min(limit, totalCount - skip);

    // Get chat messages for this event with pagination
    // We're ordering by created_at ASC and using skip/take to get the most recent messages
    const messages = await db.chat_messages.findMany({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      orderBy: {
        created_at: "asc",
      },
      skip: skip,
      take: actualLimit > 0 ? actualLimit : undefined,
    });

    console.log(
      `Found ${messages.length} messages out of ${totalCount} total for event ${eventId}`
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
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip > 0,
      },
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
