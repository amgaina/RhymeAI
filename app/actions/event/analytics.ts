"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { EventSettings } from "./types";

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
 * Tracks event playback and updates analytics
 */
export async function trackEventPlayback(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the event
    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    // Update play count and last played timestamp
    const updatedEvent = await db.events.update({
      where: { event_id: eventId },
      data: {
        play_count: { increment: 1 },
        last_played: new Date(),
      },
    });

    // Log the playback activity
    await logUserActivity(userId, eventId, "play", {
      timestamp: new Date().toISOString(),
      device: "web",
    });

    return { success: true, event: updatedEvent };
  } catch (error) {
    console.error("Failed to track event playback:", error);
    return { success: false, error: "Failed to track event playback" };
  }
}

/**
 * Records audience engagement metrics for an event
 */
export async function recordEngagementMetrics(
  eventId: number,
  metrics: {
    viewCount?: number;
    averageAttentionTime?: number;
    interactionRate?: number;
    feedbackScore?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get current event to access existing analytics data
    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    // Prepare analytics data
    const currentSettings =
      (event.event_settings as EventSettings | null) || {};
    const updatedSettings: EventSettings = {
      ...currentSettings,
      analytics: {
        ...(currentSettings.analytics || {}),
        ...metrics,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Update event with new analytics data
    await db.events.update({
      where: { event_id: eventId },
      data: {
        event_settings: updatedSettings as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to record engagement metrics:", error);
    return { success: false, error: "Failed to record engagement metrics" };
  }
}
