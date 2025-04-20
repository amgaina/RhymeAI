"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { saveChatMessage } from "./save";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: any;
}

/**
 * Synchronizes a batch of chat messages with the database
 */
export async function syncChatMessages(
  eventId: number,
  messages: ChatMessage[]
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const results = await Promise.all(
      messages.map(async (message) => {
        try {
          await saveChatMessage({
            eventId,
            messageId: message.id,
            role: message.role,
            content: message.content,
            toolCalls: message.toolCalls,
          });
          return { id: message.id, success: true };
        } catch (error) {
          console.error(`Failed to sync message ${message.id}:`, error);
          return { id: message.id, success: false, error: String(error) };
        }
      })
    );

    const allSucceeded = results.every((result) => result.success);

    return {
      success: allSucceeded,
      results,
      syncedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
    };
  } catch (error) {
    console.error("Failed to sync chat messages:", error);
    return { success: false, error: "Failed to sync chat messages" };
  }
}

/**
 * Loads chat history from the database and returns it in a format
 * compatible with the useChat hook
 */
export async function loadChatHistory(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Use raw query until Prisma client is regenerated
    const messages = await (db as any).$queryRaw`
      SELECT * FROM chat_messages
      WHERE event_id = ${eventId} AND user_id = ${userId}
      ORDER BY created_at ASC
    `;

    // Convert from database format to useChat format
    const chatMessages = messages.map((msg: any) => ({
      id: msg.message_id,
      role: msg.role,
      content: msg.content,
      toolCalls: msg.tool_calls,
      // Add any other fields needed by your chat interface
    }));

    return { success: true, messages: chatMessages };
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return { success: false, error: "Failed to load chat history" };
  }
}
