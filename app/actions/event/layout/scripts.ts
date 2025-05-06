"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EventLayout } from "@/types/layout";
import { generateContentForSegmentType } from "./helpers";

/**
 * Generate script segments from an event layout
 * This converts the layout into actual script segments with content
 */
export async function generateScriptFromLayout(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get the event with layout from the database
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: {
        event_id: true,
        title: true,
        event_type: true,
        description: true,
        voice_settings: true,
        layout: {
          include: {
            segments: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Check if layout exists
    if (
      !event.layout ||
      !event.layout.segments ||
      event.layout.segments.length === 0
    ) {
      // Fallback to JSON layout if relational layout doesn't exist
      return generateScriptFromJsonLayout(eventId);
    }

    // Delete any existing script segments
    await db.script_segments.deleteMany({
      where: { event_id: eventIdNum },
    });

    // Generate script content for each layout segment
    const createdSegments = await Promise.all(
      event.layout.segments.map(async (segment) => {
        // Generate appropriate content based on segment type
        const content = generateContentForSegmentType(
          segment.type as any,
          segment.name,
          event.title,
          event.event_type,
          segment.duration
        );

        // Create script segment in database
        return db.script_segments.create({
          data: {
            event_id: eventIdNum,
            layout_segment_id: segment.id,
            segment_type: segment.type,
            content: content,
            status: "draft",
            timing: segment.duration * 60, // Convert minutes to seconds
            order: segment.order,
          },
        });
      })
    );

    // Update the event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "scripting",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      segments: createdSegments,
      message: "Script generated from layout successfully",
    };
  } catch (error) {
    console.error("Error generating script from layout:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate script from layout",
    };
  }
}

/**
 * Fallback function to generate script from JSON layout
 */
async function generateScriptFromJsonLayout(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    // Get the event with JSON layout
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: {
        event_id: true,
        title: true,
        event_type: true,
        description: true,
        event_layout: true,
        voice_settings: true,
      },
    });

    if (!event || !event.event_layout) {
      return {
        success: false,
        error: "Event or layout not found",
      };
    }

    // Parse the layout
    const layout = event.event_layout as unknown as EventLayout;
    const segments = layout.segments || [];

    // Delete any existing script segments
    await db.script_segments.deleteMany({
      where: { event_id: eventIdNum },
    });

    // Generate script content for each layout segment
    const createdSegments = await Promise.all(
      segments.map(async (segment) => {
        // Generate appropriate content based on segment type
        const content = generateContentForSegmentType(
          segment.type,
          segment.name,
          event.title,
          event.event_type,
          segment.duration
        );

        // Create script segment in database
        return db.script_segments.create({
          data: {
            event_id: eventIdNum,
            layout_segment_id: segment.id,
            segment_type: segment.type,
            content: content,
            status: "draft",
            timing: segment.duration * 60, // Convert minutes to seconds
            order: segment.order,
          },
        });
      })
    );

    // Update the event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "scripting",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      segments: createdSegments,
      message: "Script generated from JSON layout successfully",
    };
  } catch (error) {
    console.error("Error generating script from JSON layout:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate script from JSON layout",
    };
  }
}
