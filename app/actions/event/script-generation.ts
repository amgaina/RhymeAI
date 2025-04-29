"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { ScriptSegment } from "@/types/event";

/**
 * Generate script from layout for an event
 * This is a direct server action that can be called from the chat interface
 */
export async function generateScriptFromLayout(eventId: string) {
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

    // Get the event and its layout
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

    if (!event || !event.layout) {
      return { success: false, error: "Event or layout not found" };
    }

    // Delete any existing script segments for this event
    await db.script_segments.deleteMany({
      where: { event_id: eventIdNum },
    });

    // Generate script segments based on layout segments
    const scriptSegments = [];

    for (const layoutSegment of event.layout.segments) {
      let scriptContent = "";

      // Generate script content based on segment type
      switch (layoutSegment.type) {
        case "introduction":
          scriptContent = `Ladies and gentlemen, welcome to ${
            event.title
          }! I'm your AI host for today's ${event.event_type.toLowerCase()}. We're excited to have you all here for what promises to be an engaging and informative event. ${
            event.description
              ? `Today, we'll be focusing on ${event.description}.`
              : ""
          } Let's get started!`;
          break;

        case "agenda":
          scriptContent = `Let me walk you through today's agenda. We have a packed schedule with valuable content planned for you. ${event.layout.segments.length} segments are planned, totaling approximately ${event.layout.total_duration} minutes. We'll have breaks in between to allow you to network and refresh.`;
          break;

        case "keynote":
          scriptContent = `It's my pleasure to introduce our keynote speaker for today. They bring a wealth of experience and insights that I'm sure you'll find valuable. Please join me in welcoming our distinguished speaker to the stage!`;
          break;

        case "q_and_a":
          scriptContent = `We'll now open the floor for questions. If you have a question, please raise your hand or use the Q&A feature in the app. We'll try to address as many questions as possible in the time we have available.`;
          break;

        case "break":
          scriptContent = `We'll now take a short break for ${layoutSegment.duration} minutes. Please feel free to stretch, grab a refreshment, and network with fellow attendees. We'll resume promptly at [INSERT TIME].`;
          break;

        case "conclusion":
          scriptContent = `As we come to the end of our ${event.event_type.toLowerCase()}, I want to thank you all for your active participation and engagement. It's been a pleasure hosting you today. We hope you found the content valuable and look forward to seeing you at future events!`;
          break;

        case "presentation":
          scriptContent = `Next up, we have a presentation on ${layoutSegment.name}. This segment will cover ${layoutSegment.description} and will last approximately ${layoutSegment.duration} minutes. Please give your full attention to our presenter.`;
          break;

        case "discussion":
          scriptContent = `Now, let's engage in a discussion about ${layoutSegment.name}. We encourage everyone to share their thoughts and perspectives. Remember, there are no wrong answers, and all viewpoints are valuable to our collective learning.`;
          break;

        case "demo":
          scriptContent = `We're now moving to a demonstration of ${layoutSegment.name}. This will give you a practical understanding of ${layoutSegment.description}. Please observe carefully, and we'll have time for questions afterward.`;
          break;

        default:
          scriptContent = `Next up is our ${layoutSegment.name} segment. ${layoutSegment.description} This will last approximately ${layoutSegment.duration} minutes.`;
      }

      // Create script segment in database
      const scriptSegment = await db.script_segments.create({
        data: {
          event_id: event.event_id,
          layout_segment_id: layoutSegment.id,
          segment_type: layoutSegment.type,
          content: scriptContent,
          timing: layoutSegment.duration * 60, // Convert minutes to seconds
          order: layoutSegment.order,
          status: "draft",
        },
      });

      scriptSegments.push(scriptSegment);
    }

    // Update the event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "script_ready",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return { 
      success: true, 
      segments: scriptSegments,
      message: `Generated ${scriptSegments.length} script segments successfully`
    };
  } catch (error) {
    console.error("Error generating script:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate script",
    };
  }
}

/**
 * Update a script segment
 */
export async function updateScriptSegment(segmentId: string, data: any) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Parse the segment ID to a number
    const segmentIdNum = parseInt(segmentId);
    if (isNaN(segmentIdNum)) {
      return { success: false, error: "Invalid segment ID format" };
    }

    // Get the segment to find the event ID
    const segment = await db.script_segments.findUnique({
      where: { id: segmentIdNum },
      select: { event_id: true },
    });

    if (!segment) {
      return { success: false, error: "Segment not found" };
    }

    // Verify that the user owns the event
    const event = await db.events.findUnique({
      where: {
        event_id: segment.event_id,
        user_id: session.userId,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found or access denied" };
    }

    // Update the segment
    const updatedSegment = await db.script_segments.update({
      where: { id: segmentIdNum },
      data,
    });

    // Revalidate paths
    revalidatePath(`/events/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}/script`);

    return { success: true, segment: updatedSegment };
  } catch (error) {
    console.error("Error updating script segment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update script segment",
    };
  }
}
