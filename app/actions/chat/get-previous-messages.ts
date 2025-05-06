"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Gets all previous messages for a specific event
 * This is used to display previous messages in the chat interface
 */
export async function getPreviousMessages(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log(`Getting previous messages for event ${eventId} and user ${userId}`);

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

    // Group messages by conversation
    const conversations: Record<string, any[]> = {};
    
    messages.forEach((msg) => {
      // Extract conversation ID from message ID if possible
      const conversationId = msg.message_id.includes('-') 
        ? msg.message_id.split('-')[0] 
        : 'default';
      
      if (!conversations[conversationId]) {
        conversations[conversationId] = [];
      }
      
      conversations[conversationId].push({
        id: msg.message_id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      });
    });

    return {
      success: true,
      conversations,
      messageCount: messages.length,
      eventDetails: {
        id: event.event_id,
        title: event.title,
        description: event.description || "",
        status: event.status,
      },
    };
  } catch (error) {
    console.error("Failed to get previous messages:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get previous messages",
      conversations: {},
      messageCount: 0,
    };
  }
}
