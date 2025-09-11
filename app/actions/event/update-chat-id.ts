"use server";

import { db } from "@/lib/db";

/**
 * Updates the chat ID for an event by storing it in the event_settings JSON field
 * @param eventId The ID of the event to update
 * @param chatId The chat ID to associate with the event
 * @returns Success status and message
 */
export async function updateEventChatId(
  eventId: number,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!eventId || !chatId) {
      return {
        success: false,
        message: "Event ID and Chat ID are required",
      };
    }

    console.log(`Updating chat ID for event ${eventId} to ${chatId}`);

    // Update the event_settings JSON field to include the chat ID
    const event = await db.events.update({
      where: {
        event_id: eventId,
      },
      data: {
        event_settings: {
          // Use a raw update to preserve existing settings and add/update the linked_chat_id
          linked_chat_id: chatId,
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: "Event not found",
      };
    }

    return {
      success: true,
      message: `Successfully updated chat ID for event ${eventId}`,
    };
  } catch (error) {
    console.error("Error updating event chat ID:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
