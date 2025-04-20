"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Gets all events for the logged-in user
 */
export async function getEvents() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const events = await db.events.findMany({
      where: { user_id: userId },
      include: {
        segments: true,
      },
      orderBy: { created_at: "desc" },
    });

    return { success: true, events };
  } catch (error) {
    console.error("Failed to get events:", error);
    return { success: false, error: "Failed to get events" };
  }
}

/**
 * Gets a single event with all related data
 */
export async function getEvent(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    return { success: true, event };
  } catch (error) {
    console.error("Failed to get event:", error);
    return { success: false, error: "Failed to get event" };
  }
}

/**
 * Helper function to simulate TTS generation
 */
export async function simulateTtsGeneration(
  text: string,
  voiceSettings: any
): Promise<string> {
  // In a real implementation, this would call your TTS API
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return mock audio URL
      resolve(`https://api.example.com/audio/${Date.now()}.mp3`);
    }, 2000);
  });
}

/**
 * Logs user activity for analytics purposes
 * This is a temporary implementation until proper analytics table is added to Prisma schema
 */
async function logUserActivity(
  userId: string,
  eventId: number,
  action: string,
  metadata: Record<string, any>
) {
  try {
    // For now, just log to console
    console.log(
      `Analytics: User ${userId} performed ${action} on event ${eventId}`,
      metadata
    );

    // Once the user_analytics table is properly defined in Prisma schema, uncomment:
    /*
    await db.user_analytics.create({
      data: {
        user_id: userId,
        event_id: eventId,
        action: action,
        metadata: metadata,
      },
    });
    */
  } catch (error) {
    console.error("Failed to log analytics:", error);
  }
}

/**
 * Exports event data in various formats
 */
export async function exportEventData(
  eventId: number,
  format: "json" | "csv" | "pdf"
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get event with all related data
    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    // This is a mock implementation - in a real app, you would generate the requested format
    const exportData = {
      event: {
        id: event.event_id,
        title: event.title,
        type: event.event_type,
        date: event.event_date,
        location: event.location,
        description: event.description,
      },
      segments: event.segments.map((segment) => ({
        id: segment.id,
        type: segment.segment_type,
        content: segment.content,
        audio: segment.audio_url,
        duration: segment.timing,
      })),
      exportedAt: new Date().toISOString(),
      format,
    };

    // Log the export activity
    await logUserActivity(userId, eventId, "export", {
      format,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: exportData,
      downloadUrl: `/api/exports/${eventId}?format=${format}&token=${Date.now()}`, // Mock URL
    };
  } catch (error) {
    console.error("Failed to export event data:", error);
    return { success: false, error: "Failed to export event data" };
  }
}
