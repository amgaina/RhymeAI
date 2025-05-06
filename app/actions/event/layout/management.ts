"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  EventLayout,
  LayoutSegment,
  LayoutResponse,
  SegmentResponse,
} from "@/types/layout";

/**
 * Add a new segment to an event layout
 */
export async function addLayoutSegment(
  eventId: string,
  newSegment: Omit<LayoutSegment, "id">
): Promise<LayoutResponse> {
  try {
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Try relational DB first
    try {
      // Get or create layout
      let layoutId: number;
      const existingLayout = await db.event_layout.findUnique({
        where: { event_id: eventIdNum },
      });

      if (existingLayout) {
        layoutId = existingLayout.id;
      } else {
        // Create new layout if it doesn't exist
        const newLayout = await db.event_layout.create({
          data: {
            event_id: eventIdNum,
            total_duration: newSegment.duration,
            layout_version: 1,
          },
        });
        layoutId = newLayout.id;
      }

      // Create the segment
      const segmentId = uuidv4();
      await db.layout_segments.create({
        data: {
          id: segmentId,
          layout_id: layoutId,
          name: newSegment.name,
          type: newSegment.type,
          description: newSegment.description,
          duration: newSegment.duration,
          order: newSegment.order,
          custom_properties: newSegment.customProperties || {},
        },
      });

      // Update layout duration
      await db.event_layout.update({
        where: { id: layoutId },
        data: {
          total_duration: {
            increment: newSegment.duration,
          },
          layout_version: {
            increment: 1,
          },
          updated_at: new Date(),
        },
      });

      // Get updated segments for response
      const updatedSegments = await db.layout_segments.findMany({
        where: { layout_id: layoutId },
        orderBy: { order: "asc" },
      });

      // Revalidate paths
      revalidatePath(`/events/${eventId}`);
      revalidatePath(`/event-creation?eventId=${eventId}`);
      revalidatePath(`/event/${eventId}`);

      return {
        success: true,
        message: "Segment added to layout successfully in relational DB",
      };
    } catch (err) {
      console.warn("Relational DB add failed, falling back to JSON:", err);
    }

    // Fallback to JSON
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    // If event exists but no layout, create empty layout
    let currentLayout: EventLayout;
    if (!event || !event.event_layout) {
      currentLayout = {
        id: uuidv4(),
        eventId: eventIdNum,
        segments: [],
        totalDuration: 0,
        lastUpdated: new Date().toISOString(),
        version: 1,
      };
    } else {
      currentLayout = event.event_layout as unknown as EventLayout;
    }

    // Create a complete segment with ID
    const completeSegment: LayoutSegment = {
      ...newSegment,
      id: uuidv4(),
    };

    // Add segment to layout
    const updatedLayout: EventLayout = {
      ...currentLayout,
      segments: [...currentLayout.segments, completeSegment],
      lastUpdated: new Date().toISOString(),
      version: (currentLayout.version ?? 0) + 1,
      totalDuration: currentLayout.totalDuration + newSegment.duration,
    };

    // Save updated layout
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        event_layout: JSON.parse(JSON.stringify(updatedLayout)) as any,
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      layout: updatedLayout,
      newSegment: completeSegment,
      message: "Segment added to layout successfully in JSON",
    };
  } catch (error) {
    console.error("Error adding layout segment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add segment",
    };
  }
}

/**
 * Update an existing event layout segment
 */
export async function updateEventLayoutSegment(
  eventId: string,
  segmentId: string,
  updates: Partial<LayoutSegment>
): Promise<LayoutResponse> {
  try {
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // First try to update in relational DB
    try {
      // Find the segment
      const segment = await db.layout_segments.findFirst({
        where: {
          id: segmentId,
          layout: {
            event_id: eventIdNum,
          },
        },
      });

      if (segment) {
        // Calculate duration change for updating the layout total
        const durationDiff =
          (updates.duration !== undefined
            ? updates.duration
            : segment.duration) - segment.duration;

        // Update the segment
        await db.layout_segments.update({
          where: { id: segmentId },
          data: {
            name: updates.name || segment.name,
            type: updates.type || segment.type,
            description: updates.description || segment.description,
            duration:
              updates.duration !== undefined
                ? updates.duration
                : segment.duration,
            order: updates.order || segment.order,
            updated_at: new Date(),
          },
        });

        // Update layout if duration changed
        if (durationDiff !== 0) {
          await db.event_layout.update({
            where: {
              id: segment.layout_id,
            },
            data: {
              total_duration: {
                increment: durationDiff,
              },
              layout_version: {
                increment: 1,
              },
              updated_at: new Date(),
            },
          });
        }

        // Revalidate paths
        revalidatePath(`/events/${eventId}`);
        revalidatePath(`/event-creation?eventId=${eventId}`);
        revalidatePath(`/event/${eventId}`);

        return {
          success: true,
          message: "Layout segment updated successfully in relational DB",
        };
      }
    } catch (err) {
      console.warn("Relational DB update failed, falling back to JSON:", err);
    }

    // Fallback to JSON update
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    if (!event || !event.event_layout) {
      return { success: false, error: "Event or layout not found" };
    }

    // Get the current layout
    const currentLayout = event.event_layout as unknown as EventLayout;

    // Find the segment to update
    const segmentIndex = currentLayout.segments.findIndex(
      (segment) => segment.id === segmentId
    );

    if (segmentIndex === -1) {
      return { success: false, error: "Segment not found in layout" };
    }

    // Update the segment
    const updatedLayout = {
      ...currentLayout,
      segments: [...currentLayout.segments],
      lastUpdated: new Date().toISOString(),
      version: (currentLayout.version ?? 0) + 1,
    };

    updatedLayout.segments[segmentIndex] = {
      ...updatedLayout.segments[segmentIndex],
      ...updates,
    };

    // Recalculate total duration if needed
    if (updates.duration) {
      updatedLayout.totalDuration = updatedLayout.segments.reduce(
        (sum, segment) => sum + segment.duration,
        0
      );
    }

    // Save the updated layout
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        event_layout: JSON.parse(JSON.stringify(updatedLayout)) as any,
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      layout: updatedLayout,
      message: "Layout segment updated successfully in JSON",
    };
  } catch (error) {
    console.error("Error updating event layout segment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update layout segment",
    };
  }
}

/**
 * Delete a segment from an event layout
 */
export async function deleteLayoutSegment(
  eventId: string,
  segmentId: string
): Promise<LayoutResponse> {
  try {
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Try relational DB first
    try {
      // Find the segment
      const segment = await db.layout_segments.findFirst({
        where: {
          id: segmentId,
          layout: {
            event_id: eventIdNum,
          },
        },
      });

      if (segment) {
        // Get layout details before deletion for duration update
        const layoutId = segment.layout_id;
        const duration = segment.duration;

        // Delete the segment
        await db.layout_segments.delete({
          where: { id: segmentId },
        });

        // Update layout duration
        await db.event_layout.update({
          where: { id: layoutId },
          data: {
            total_duration: {
              decrement: duration,
            },
            layout_version: {
              increment: 1,
            },
            updated_at: new Date(),
          },
        });

        // Get remaining segments and reorder them
        const remainingSegments = await db.layout_segments.findMany({
          where: { layout_id: layoutId },
          orderBy: { order: "asc" },
        });

        // Reorder segments
        for (let i = 0; i < remainingSegments.length; i++) {
          await db.layout_segments.update({
            where: { id: remainingSegments[i].id },
            data: { order: i + 1 },
          });
        }

        // Revalidate paths
        revalidatePath(`/events/${eventId}`);
        revalidatePath(`/event-creation?eventId=${eventId}`);
        revalidatePath(`/event/${eventId}`);

        return {
          success: true,
          message: "Segment deleted from layout successfully in relational DB",
        };
      }
    } catch (err) {
      console.warn("Relational DB delete failed, falling back to JSON:", err);
    }

    // Fallback to JSON approach
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    if (!event || !event.event_layout) {
      return { success: false, error: "Event or layout not found" };
    }

    const currentLayout = event.event_layout as unknown as EventLayout;

    // Find segment to delete
    const segmentIndex = currentLayout.segments.findIndex(
      (segment) => segment.id === segmentId
    );

    if (segmentIndex === -1) {
      return { success: false, error: "Segment not found in layout" };
    }

    // Calculate new duration
    const segmentDuration = currentLayout.segments[segmentIndex].duration;

    // Remove segment and update layout
    const updatedSegments = [...currentLayout.segments];
    updatedSegments.splice(segmentIndex, 1);

    // Update order for remaining segments
    const reorderedSegments = updatedSegments.map((segment, index) => ({
      ...segment,
      order: index + 1,
    }));

    const updatedLayout: EventLayout = {
      ...currentLayout,
      segments: reorderedSegments,
      lastUpdated: new Date().toISOString(),
      version: (currentLayout.version ?? 0) + 1,
      totalDuration: currentLayout.totalDuration - segmentDuration,
    };

    // Save updated layout
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        event_layout: JSON.parse(JSON.stringify(updatedLayout)) as any,
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    return {
      success: true,
      layout: updatedLayout,
      message: "Segment deleted from layout successfully in JSON",
    };
  } catch (error) {
    console.error("Error deleting layout segment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete segment",
    };
  }
}
