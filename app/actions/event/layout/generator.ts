"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EventLayout, LayoutSegment, EventType } from "@/types/layout";
import { generateLayoutByEventType } from "./helpers";

/**
 * Generate a rough event layout with timing suggestions
 * This is the first step in the script creation process
 */
export async function generateEventLayout(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get event details for context
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    console.log(`Generating event layout for: ${eventId}`);

    // Determine event duration based on type (in minutes)
    let totalDuration = 60; // Default 1 hour
    if (event.event_type?.toLowerCase().includes("conference")) {
      totalDuration = 180; // 3 hours for conferences
    } else if (event.event_type?.toLowerCase().includes("webinar")) {
      totalDuration = 90; // 1.5 hours for webinars
    } else if (event.event_type?.toLowerCase().includes("workshop")) {
      totalDuration = 120; // 2 hours for workshops
    }

    // Generate layout segments based on event type
    const layoutSegments = generateLayoutByEventType(
      event.event_type as EventType,
      event.title,
      totalDuration
    );

    // Create the full event layout structure
    const eventLayout: EventLayout = {
      segments: layoutSegments,
      totalDuration,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    try {
      // First try to use the relational DB approach
      // Create or update layout in relational structure
      const layout = await db.event_layout.upsert({
        where: {
          event_id: eventIdNum,
        },
        create: {
          event_id: eventIdNum,
          total_duration: totalDuration,
          layout_version: 1,
          last_generated_by: "system-template",
        },
        update: {
          total_duration: totalDuration,
          layout_version: {
            increment: 1,
          },
          updated_at: new Date(),
          last_generated_by: "system-template",
        },
      });

      // Delete any existing segments
      await db.layout_segments.deleteMany({
        where: {
          layout_id: layout.id,
        },
      });

      // Create new segments
      await Promise.all(
        layoutSegments.map((segment) =>
          db.layout_segments.create({
            data: {
              id: segment.id,
              layout_id: layout.id,
              name: segment.name,
              type: segment.type,
              description: segment.description,
              duration: segment.duration,
              order: segment.order,
              custom_properties: segment.customProperties
                ? JSON.parse(JSON.stringify(segment.customProperties))
                : {},
            },
          })
        )
      );
    } catch (error) {
      console.error(
        "Error using relational DB, falling back to JSON storage:",
        error
      );

      // Fallback: store layout as JSON - Fix the type issue by serializing the object
      await db.events.update({
        where: { event_id: eventIdNum },
        data: {
          // Convert to JSON-safe format for Prisma
          event_layout: JSON.parse(JSON.stringify(eventLayout)) as any,
          updated_at: new Date(),
        },
      });
    }

    // Update event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "layout_ready",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      layout: eventLayout,
      message: "Event layout generated successfully",
    };
  } catch (error) {
    console.error("Error generating event layout:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate event layout",
    };
  }
}
