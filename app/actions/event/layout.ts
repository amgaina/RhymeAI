"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  EventLayout,
  LayoutSegment,
  SegmentType,
  EventType,
} from "@/types/layout";
import { v4 as uuidv4 } from "uuid";

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
      id: layout.id,
      eventId: eventIdNum,
      segments: layoutSegments,
      totalDuration,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    // Create or update the relational layout in the database
    const layout = await db.event_layout.upsert({
      where: {
        event_id: eventIdNum,
      },
      update: {
        total_duration: totalDuration,
        layout_version: { increment: 1 },
        updated_at: new Date(),
        last_generated_by: "system",
      },
      create: {
        event_id: eventIdNum,
        total_duration: totalDuration,
        last_generated_by: "system",
      },
    });

    // Delete any existing segments for this layout
    await db.layout_segments.deleteMany({
      where: {
        layout_id: layout.id,
      },
    });

    // Create new segments
    const createdSegments = await Promise.all(
      layoutSegments.map((segment) =>
        db.layout_segments.create({
          data: {
            layout_id: layout.id,
            name: segment.name,
            type: segment.type,
            description: segment.description,
            duration: segment.duration,
            order: segment.order,
            custom_properties: {},
          },
        })
      )
    );

    // Also store the layout as JSON for backward compatibility
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        event_layout: JSON.parse(JSON.stringify(eventLayout)) as any,
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    // Map the database segments to the expected format
    const formattedSegments = createdSegments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      type: segment.type as SegmentType,
      description: segment.description,
      duration: segment.duration,
      order: segment.order,
    }));

    // Create the response layout with the actual segments from the database
    const responseLayout: EventLayout = {
      id: layout.id,
      eventId: eventIdNum,
      segments: formattedSegments,
      totalDuration: layout.total_duration,
      lastUpdated: layout.updated_at.toISOString(),
      version: layout.layout_version,
    };

    return {
      success: true,
      layout: responseLayout,
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

/**
 * Generate layout segments based on event type
 */
function generateLayoutByEventType(
  eventType: EventType = "general",
  eventTitle: string = "Event",
  totalDuration: number = 60
): LayoutSegment[] {
  const type = (eventType?.toLowerCase() as EventType) || "general";

  if (type.includes("conference")) {
    return generateConferenceLayout(eventTitle, totalDuration);
  } else if (type.includes("webinar")) {
    return generateWebinarLayout(eventTitle, totalDuration);
  } else if (type.includes("workshop")) {
    return generateWorkshopLayout(eventTitle, totalDuration);
  } else if (type.includes("corporate")) {
    return generateCorporateLayout(eventTitle, totalDuration);
  } else {
    return generateGeneralLayout(eventTitle, totalDuration);
  }
}

/**
 * Generate a conference event layout
 */
function generateConferenceLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.05));
  const keynoteTime = Math.max(30, Math.round(totalDuration * 0.25));
  const panelTime = Math.max(45, Math.round(totalDuration * 0.3));
  const networkingTime = Math.max(20, Math.round(totalDuration * 0.15));
  const breakTime = Math.max(15, Math.round(totalDuration * 0.1));
  const closingTime = Math.max(10, Math.round(totalDuration * 0.05));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.1));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and welcome to attendees",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Keynote Presentation",
      type: "keynote",
      description: "Main keynote speech by the featured speaker",
      duration: keynoteTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Panel Discussion",
      type: "panel",
      description: "Expert panel discussing industry trends",
      duration: panelTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Networking Break",
      type: "break",
      description: "Refreshments and networking opportunity",
      duration: breakTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Audience questions for speakers",
      duration: qAndATime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and closing thoughts",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a webinar event layout
 */
function generateWebinarLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.08));
  const presentationTime = Math.max(30, Math.round(totalDuration * 0.5));
  const demoTime = Math.max(15, Math.round(totalDuration * 0.2));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.17));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.05));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Introduction to the webinar and speakers",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Main Presentation",
      type: "presentation",
      description: "Core content presentation",
      duration: presentationTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Product Demonstration",
      type: "demo",
      description: "Live demonstration or walkthrough",
      duration: demoTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Answering attendee questions",
      duration: qAndATime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Closing and Next Steps",
      type: "conclusion",
      description: "Summary and call to action",
      duration: closingTime,
      order: 5,
    },
  ];
}

/**
 * Generate a workshop event layout
 */
function generateWorkshopLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(10, Math.round(totalDuration * 0.08));
  const theoryTime = Math.max(20, Math.round(totalDuration * 0.2));
  const practicalTime = Math.max(45, Math.round(totalDuration * 0.4));
  const breakTime = Math.max(10, Math.round(totalDuration * 0.08));
  const groupWorkTime = Math.max(20, Math.round(totalDuration * 0.15));
  const closingTime = Math.max(10, Math.round(totalDuration * 0.09));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Overview",
      type: "introduction",
      description: "Introduction to the workshop and objectives",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Theoretical Background",
      type: "theory",
      description: "Explanation of key concepts",
      duration: theoryTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Practical Exercise",
      type: "practical",
      description: "Hands-on activity for participants",
      duration: practicalTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Break",
      type: "break",
      description: "Short break for refreshments",
      duration: breakTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Group Discussion",
      type: "group_work",
      description: "Collaborative problem-solving",
      duration: groupWorkTime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Conclusion and Takeaways",
      type: "conclusion",
      description: "Summary and next steps",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a corporate event layout
 */
function generateCorporateLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.08));
  const agendaTime = Math.max(5, Math.round(totalDuration * 0.05));
  const presentationTime = Math.max(30, Math.round(totalDuration * 0.4));
  const discussionTime = Math.max(20, Math.round(totalDuration * 0.25));
  const actionItemsTime = Math.max(10, Math.round(totalDuration * 0.12));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.1));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and introductions",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Meeting Agenda",
      type: "agenda",
      description: "Overview of topics to be covered",
      duration: agendaTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Business Update",
      type: "presentation",
      description: "Presentation of key business metrics and updates",
      duration: presentationTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Strategic Discussion",
      type: "discussion",
      description: "Discussion of strategic initiatives",
      duration: discussionTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Action Items",
      type: "action_items",
      description: "Assignment of tasks and responsibilities",
      duration: actionItemsTime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and next steps",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a general event layout
 */
function generateGeneralLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.1));
  const mainContentTime = Math.max(30, Math.round(totalDuration * 0.6));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.2));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.1));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and welcome",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Main Content",
      type: "main_content",
      description: "Primary event content",
      duration: mainContentTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Audience questions and discussion",
      duration: qAndATime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and thank you",
      duration: closingTime,
      order: 4,
    },
  ];
}

/**
 * Update an existing event layout segment
 */
export async function updateEventLayoutSegment(
  eventId: string,
  segmentId: string,
  updates: Partial<LayoutSegment>
) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get the current event with layout
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    if (!event || !event.event_layout) {
      return {
        success: false,
        error: "Event or layout not found",
      };
    }

    // Get the current layout
    const currentLayout = event.event_layout as unknown as EventLayout;

    // Find the segment to update
    const segmentIndex = currentLayout.segments.findIndex(
      (segment) => segment.id === segmentId
    );

    if (segmentIndex === -1) {
      return {
        success: false,
        error: "Segment not found in layout",
      };
    }

    // Update the segment
    const updatedLayout = {
      ...currentLayout,
      segments: [...currentLayout.segments],
      lastUpdated: new Date().toISOString(),
      version: (currentLayout.version || 1) + 1,
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
        event_layout: JSON.parse(JSON.stringify(updatedLayout)),
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
      message: "Layout segment updated successfully",
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
 * Add a new segment to an event layout
 */
export async function addLayoutSegment(
  eventId: string,
  newSegment: Omit<LayoutSegment, "id">
) {
  try {
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    if (!event || !event.event_layout) {
      return {
        success: false,
        error: "Event or layout not found",
      };
    }

    // Properly convert JSON to EventLayout with type safety
    const currentLayout: EventLayout = JSON.parse(
      JSON.stringify(event.event_layout)
    ) as unknown as EventLayout;

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
      version: (currentLayout.version || 1) + 1,
      totalDuration: currentLayout.totalDuration + newSegment.duration,
    };

    // Save updated layout - convert to JSON for Prisma
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
      message: "Segment added to layout successfully",
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
 * Delete a segment from an event layout
 */
export async function deleteLayoutSegment(eventId: string, segmentId: string) {
  try {
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { event_layout: true },
    });

    if (!event || !event.event_layout) {
      return {
        success: false,
        error: "Event or layout not found",
      };
    }

    // Properly convert JSON to EventLayout with type safety
    const currentLayout: EventLayout = JSON.parse(
      JSON.stringify(event.event_layout)
    ) as unknown as EventLayout;

    // Find segment to delete
    const segmentIndex = currentLayout.segments.findIndex(
      (segment) => segment.id === segmentId
    );

    if (segmentIndex === -1) {
      return {
        success: false,
        error: "Segment not found in layout",
      };
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
      version: (currentLayout.version || 1) + 1,
      totalDuration: currentLayout.totalDuration - segmentDuration,
    };

    // Save updated layout with proper JSON serialization
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
      message: "Segment deleted from layout successfully",
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
          segment.type as SegmentType, // Cast to SegmentType
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
 * This is for backward compatibility
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

    // Get the layout
    const layout = event.event_layout as any;
    const segments = layout.segments || [];

    // Define a type for script segments
    type ScriptSegmentInput = {
      layout_segment_id: string;
      segment_type: string;
      content: string;
      status: string;
      timing: number;
      order: number;
    };

    // Generate script content for each layout segment
    const scriptSegments = segments.map((segment: any): ScriptSegmentInput => {
      // Generate appropriate content based on segment type
      const content = generateContentForSegmentType(
        segment.type as SegmentType,
        segment.name,
        event.title,
        event.event_type,
        segment.duration
      );

      return {
        layout_segment_id: segment.id,
        segment_type: segment.type,
        content,
        status: "draft",
        timing: segment.duration * 60, // Convert minutes to seconds
        order: segment.order,
      };
    });

    // Delete any existing script segments
    await db.script_segments.deleteMany({
      where: { event_id: eventIdNum },
    });

    // Save the script segments to the database
    const createdSegments = await Promise.all(
      scriptSegments.map((segment: ScriptSegmentInput) =>
        db.script_segments.create({
          data: {
            event_id: eventIdNum,
            layout_segment_id: segment.layout_segment_id,
            segment_type: segment.segment_type,
            content: segment.content,
            status: segment.status,
            timing: segment.timing,
            order: segment.order,
          },
        })
      )
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

/**
 * Generate appropriate content for a segment based on its type
 */
function generateContentForSegmentType(
  type: SegmentType,
  name: string,
  eventTitle: string,
  eventType: string,
  duration: number
): string {
  switch (type.toLowerCase()) {
    case "introduction":
      return `Ladies and gentlemen, welcome to ${eventTitle}! [PAUSE=500] I'm your AI host for today, and I'm delighted to guide you through this ${eventType} where we'll explore exciting ideas and foster meaningful connections. [PAUSE=300] We have a packed agenda with valuable content planned for the next ${duration} minutes.`;

    case "keynote":
      return `It's now my pleasure to introduce our keynote presentation. [PAUSE=400] Our distinguished speaker will share insights on industry trends and innovations that are shaping our future. [PAUSE=300] Please join me in welcoming our keynote speaker to the stage. [PAUSE=800]`;

    case "panel":
      return `We now move to our panel discussion featuring industry experts who will share their perspectives on current trends and challenges. [PAUSE=400] I'll be moderating this conversation and will open the floor for questions in the latter part of this ${duration}-minute session.`;

    case "presentation":
      return `Let's now turn our attention to the main presentation of today's ${eventType}. [PAUSE=300] This ${duration}-minute session will cover key insights and practical takeaways that you can implement immediately. [PAUSE=400] Please hold your questions until the Q&A session that follows.`;

    case "q_and_a":
      return `We now have ${duration} minutes for questions and answers. [PAUSE=300] If you have a question, please raise your hand or use the chat function, and I'll do my best to address as many questions as possible. [PAUSE=400] Let's begin with our first question.`;

    case "break":
      return `We'll now take a ${duration}-minute break for refreshments and networking. [PAUSE=300] Please be back in your seats by ${getTimeAfterMinutes(
        duration
      )} so we can continue with our program. [PAUSE=400] Enjoy your break!`;

    case "agenda":
      return `Let me walk you through today's agenda. [PAUSE=300] We have a comprehensive program planned for the next few hours, including presentations, discussions, and interactive sessions. [PAUSE=400] Our event will conclude by ${getTimeAfterMinutes(
        duration * 4
      )}.`;

    case "conclusion":
      return `As we come to the end of ${eventTitle}, I want to thank you all for your active participation and engagement. [PAUSE=400] We hope you found value in today's proceedings and will apply the insights gained. [PAUSE=300] Thank you once again, and we look forward to seeing you at future events!`;

    case "demo":
      return `Now I'll demonstrate how our solution works in practice. [PAUSE=300] This ${duration}-minute demonstration will showcase the key features and benefits that make our offering unique. [PAUSE=400] Feel free to take notes, and there will be time for questions afterward.`;

    case "action_items":
      return `Let's review the action items from today's discussion. [PAUSE=300] I'll assign responsibilities and deadlines to ensure we make progress on these initiatives. [PAUSE=400] Please make note of any tasks assigned to you or your team.`;

    case "main_content":
      return `Let's dive into the main content of our ${eventType}. [PAUSE=300] Over the next ${duration} minutes, we'll explore key concepts and practical applications that are relevant to your work and interests. [PAUSE=400] I encourage you to engage actively with the material presented.`;

    default:
      return `Welcome to the ${name} segment of our ${eventType}. [PAUSE=300] We have allocated ${duration} minutes for this portion of the event. [PAUSE=400] Let's make the most of this time together.`;
  }
}

/**
 * Helper function to calculate time after specified minutes
 */
function getTimeAfterMinutes(minutes: number): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
