"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Retrieves all chat messages for a specific event
 */
export async function getChatMessages(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Use the raw query capability of Prisma as a temporary workaround
    // until you regenerate the Prisma client
    const messages = await (db as any).$queryRaw`
      SELECT * FROM chat_messages
      WHERE event_id = ${eventId} AND user_id = ${userId}
      ORDER BY created_at ASC
    `;

    // Once you regenerate the Prisma client, you can replace the above with:
    /*
    const messages = await db.chat_messages.findMany({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    */

    return { success: true, messages };
  } catch (error) {
    console.error("Failed to get chat messages:", error);
    return { success: false, error: "Failed to get chat messages" };
  }
}

/**
 * Retrieves chat messages for a specific event, after a certain message ID
 * Useful for syncing new messages
 */
export async function getNewChatMessages(
  eventId: number,
  afterMessageId: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the message to get its timestamp
    const referenceMessage = await (db as any).$queryRaw`
      SELECT created_at FROM chat_messages
      WHERE event_id = ${eventId} AND message_id = ${afterMessageId}
      LIMIT 1
    `;

    if (!referenceMessage || referenceMessage.length === 0) {
      throw new Error("Reference message not found");
    }

    const referenceTimestamp = referenceMessage[0].created_at;

    // Get all messages created after the reference message
    const messages = await (db as any).$queryRaw`
      SELECT * FROM chat_messages
      WHERE event_id = ${eventId}
      AND user_id = ${userId}
      AND created_at > ${referenceTimestamp}
      ORDER BY created_at ASC
    `;

    return { success: true, messages };
  } catch (error) {
    console.error("Failed to get new chat messages:", error);
    return { success: false, error: "Failed to get new chat messages" };
  }
}
