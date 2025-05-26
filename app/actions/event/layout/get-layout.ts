"use server";

import { db } from "@/lib/db";
import { EventLayout } from "@/types/layout";
import { auth } from "@clerk/nextjs/server";

/**
 * Get the layout for a specific event
 * @param eventId The ID of the event
 * @returns The event layout and success status
 */
export async function getEventLayout(
  eventId: string
): Promise<{ success: boolean; layout?: EventLayout; error?: string }> {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Parse the event ID to a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Get the event layout
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      include: {
        layout: {
          include: {
            segments: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (!event.layout) {
      return { success: false, error: "Event layout not found" };
    }

    return {
      success: true,
      layout: event.layout,
    };
  } catch (error) {
    console.error("Error fetching event layout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get event layout",
    };
  }
}
