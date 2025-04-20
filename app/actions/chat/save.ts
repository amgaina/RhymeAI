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

    // Use the raw query capability of Prisma as a temporary workaround
    // until you regenerate the Prisma client
    await (db as any).$executeRaw`
      INSERT INTO chat_messages (
        event_id, user_id, message_id, role, content, tool_calls, created_at
      ) VALUES (
        ${eventId}, ${userId}, ${messageId}, ${role}, ${content},
        ${toolCalls ? JSON.stringify(toolCalls) : null}, NOW()
      )
    `;

    // Once you regenerate the Prisma client, you can replace the above with:

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

    return { success: true };
  } catch (error) {
    console.error("Failed to save chat message:", error);
    return { success: false, error: "Failed to save chat message" };
  }
}
