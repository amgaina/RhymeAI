"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

interface SaveChatMessageProps {
  eventId: number;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: any;
}

/**
 * Saves a chat message to the database
 */
export async function saveChatMessage({
  eventId,
  messageId,
  role,
  content,
  toolCalls,
}: SaveChatMessageProps) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    console.log(
      `Saving chat message for event ${eventId}, message ID: ${messageId}, role: ${role}`
    );

    // First, check if this message already exists to avoid duplicates
    const existingMessage = await db.chat_messages.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
        message_id: messageId,
      },
    });

    if (existingMessage) {
      console.log(`Message ${messageId} already exists, updating it`);
      // Message already exists, update it instead of creating a new one
      await db.chat_messages.updateMany({
        where: {
          event_id: eventId,
          user_id: userId,
          message_id: messageId,
        },
        data: {
          content,
          tool_calls: toolCalls ? JSON.stringify(toolCalls) : null,
        },
      });
    } else {
      console.log(`Creating new message ${messageId} for event ${eventId}`);
      // Message doesn't exist, create a new one
      await db.chat_messages.create({
        data: {
          event_id: eventId,
          user_id: userId,
          message_id: messageId,
          role,
          content,
          tool_calls: toolCalls ? toolCalls : undefined,
        },
      });
    }

    return { success: true, messageId };
  } catch (error) {
    console.error(`Failed to save chat message for event ${eventId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save chat message",
      messageId,
    };
  }
}
