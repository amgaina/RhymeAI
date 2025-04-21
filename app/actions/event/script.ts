"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ScriptSegment, ScriptSegmentStatus } from "@/types/event";
import { ScriptSegmentInput } from "./types";

/**
 * Generate a complete script for an event
 */
export async function generateScript(eventId: string) {
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

    console.log(`Generating script for event: ${eventId}`);

    // Here you would typically use an AI service to generate the script
    // For now, we'll create sample segments

    // Mock generated script segments
    const scriptSegments = [
      {
        segment_type: "introduction",
        content: `Welcome to ${event.title}! I'm your AI host for today.`,
        status: "generated",
        timing: 15,
        order: 1,
      },
      {
        segment_type: "agenda",
        content: `Let me walk you through our ${event.event_type} agenda. We have some exciting content planned for you.`,
        status: "generated",
        timing: 20,
        order: 2,
      },
      {
        segment_type: "speaker_intro",
        content:
          "Now I'd like to introduce our first speaker, who will be sharing insights on industry trends.",
        status: "generated",
        timing: 15,
        order: 3,
      },
      {
        segment_type: "conclusion",
        content: `Thank you for attending ${event.title}! We hope you enjoyed the event.`,
        status: "generated",
        timing: 15,
        order: 4,
      },
    ];

    // Save the segments to the database
    const createdSegments = await Promise.all(
      scriptSegments.map((segment) =>
        db.script_segments.create({
          data: {
            event_id: eventIdNum,
            segment_type: segment.segment_type,
            content: segment.content,
            status: segment.status,
            timing: segment.timing,
            order: segment.order,
          },
        })
      )
    );

    // Also update the event with the script_segments JSON array for quick access
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        script_segments: scriptSegments.map((segment) => ({
          type: segment.segment_type,
          content: segment.content,
          status: segment.status,
          timing: segment.timing,
          order: segment.order,
        })),
      },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      segments: createdSegments,
    };
  } catch (error) {
    console.error("Error generating script:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate script",
    };
  }
}

/**
 * Create or update a script segment for an event
 */
export async function createScriptSegment(
  eventId: string,
  segment: ScriptSegmentInput
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

    // Create the segment in the database
    const createdSegment = await db.script_segments.create({
      data: {
        event_id: eventIdNum,
        segment_type: segment.type,
        content: segment.content,
        status: segment.status,
        audio_url: segment.audio_url || null,
        timing: segment.timing || null,
        order: segment.order,
      },
    });

    // Get all current segments to update the JSON array
    const allSegments = await db.script_segments.findMany({
      where: { event_id: eventIdNum },
      orderBy: { order: "asc" },
    });

    // Update the event with the updated script_segments JSON array
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        script_segments: allSegments.map((seg) => ({
          type: seg.segment_type,
          content: seg.content,
          status: seg.status,
          timing: seg.timing,
          order: seg.order,
        })),
      },
    });

    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      segment: createdSegment,
    };
  } catch (error) {
    console.error("Error creating script segment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create script segment",
    };
  }
}

/**
 * Update an existing script segment
 */
export async function updateScriptSegment(
  segmentId: string,
  data: {
    content?: string;
    status?: string;
    audio_url?: string | null;
    timing?: number;
  }
) {
  try {
    // Convert string segmentId to number
    const segmentIdNum = parseInt(segmentId, 10);

    if (isNaN(segmentIdNum)) {
      return {
        success: false,
        error: "Invalid segment ID format",
      };
    }

    // Get the current segment to find the event ID
    const currentSegment = await db.script_segments.findUnique({
      where: { id: segmentIdNum },
    });

    if (!currentSegment) {
      return {
        success: false,
        error: "Segment not found",
      };
    }

    // Update the segment
    const updatedSegment = await db.script_segments.update({
      where: { id: segmentIdNum },
      data: {
        content: data.content,
        status: data.status,
        audio_url: data.audio_url,
        timing: data.timing,
        updated_at: new Date(),
      },
    });

    // Get all current segments to update the JSON array
    const allSegments = await db.script_segments.findMany({
      where: { event_id: currentSegment.event_id },
      orderBy: { order: "asc" },
    });

    // Update the event with the updated script_segments JSON array
    await db.events.update({
      where: { event_id: currentSegment.event_id },
      data: {
        script_segments: allSegments.map((seg) => ({
          type: seg.segment_type,
          content: seg.content,
          status: seg.status,
          timing: seg.timing,
          order: seg.order,
        })),
      },
    });

    // Revalidate the appropriate path
    revalidatePath(`/events/${currentSegment.event_id}`);

    return {
      success: true,
      segment: updatedSegment,
    };
  } catch (error) {
    console.error("Error updating script segment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update script segment",
    };
  }
}

/**
 * Get all script segments for an event
 */
export async function getScriptSegments(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get all segments for the event
    const segments = await db.script_segments.findMany({
      where: { event_id: eventIdNum },
      orderBy: { order: "asc" },
    });

    return {
      success: true,
      segments,
    };
  } catch (error) {
    console.error("Error getting script segments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get script segments",
    };
  }
}

/**
 * Generates a quick script template for an event based on basic event details
 * This is used for preview before the event is actually created
 */
export async function generateEventScript(eventId: string) {
  try {
    // In a real implementation, you would:
    // 1. Fetch the event details if eventId is a real ID
    // 2. Use AI to generate a script based on those details
    // 3. Return the generated script sections

    // For this demonstration, we'll return a mock script
    // Since this is just for preview, we don't need to save anything to DB yet

    // Parse eventId to see if it contains any context
    // Example: temp_conference_2023 could indicate a conference event
    let eventType = "general";

    if (eventId.includes("conference")) {
      eventType = "conference";
    } else if (eventId.includes("webinar")) {
      eventType = "webinar";
    } else if (eventId.includes("corporate")) {
      eventType = "corporate";
    }

    // Return different script templates based on event type
    const scriptSections = {
      introduction: getIntroduction(eventType),
      mainContent: getMainContent(eventType),
      conclusion: getConclusion(eventType),
    };

    return {
      success: true,
      script: scriptSections,
    };
  } catch (error) {
    console.error("Error generating script preview:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate script",
    };
  }
}

// Helper functions to generate script content based on event type
function getIntroduction(eventType: string): string {
  switch (eventType) {
    case "conference":
      return "Ladies and gentlemen, distinguished guests, and esteemed colleagues, welcome to our conference! [PAUSE=500] I'm your AI host for today, and I'm delighted to guide you through this exciting event where we'll explore cutting-edge ideas and foster meaningful connections.";

    case "webinar":
      return "Hello everyone, and welcome to today's webinar! [PAUSE=300] I'm your AI host, and I'm thrilled to have you all joining us virtually from around the world. We have an informative session planned that will provide you with valuable insights and actionable takeaways.";

    case "corporate":
      return "Good morning/afternoon, respected board members, executives, and team members. [PAUSE=400] Welcome to this corporate gathering. I'm your AI host, and I'm honored to facilitate today's proceedings where we'll discuss important business matters and strategic initiatives.";

    default:
      return "Hello and welcome everyone! [PAUSE=300] I'm your AI host for today's event, and I'm excited to guide you through the program we have prepared. [BREATHE] Whether you're joining us for the first time or returning, we're delighted to have you with us.";
  }
}

function getMainContent(eventType: string): string {
  switch (eventType) {
    case "conference":
      return "Our agenda today features keynote presentations from industry leaders, [EMPHASIS] interactive panel discussions, and specialized breakout sessions. [PAUSE=300] We'll begin with our opening keynote, followed by our first panel on industry trends. [BREATHE] After the lunch break at 12:30, we'll reconvene for the afternoon sessions focused on practical applications and case studies.";

    case "webinar":
      return "During today's session, our expert speaker will share insights on key topics in the field, [EMPHASIS] followed by a comprehensive Q&A period where you can have your questions addressed. [PAUSE=300] We encourage you to use the chat function for questions throughout the presentation, [BREATHE] and we'll address as many as possible during the dedicated Q&A time.";

    case "corporate":
      return "Today's meeting will cover quarterly performance results, [EMPHASIS] strategic initiatives for the upcoming fiscal year, and departmental updates. [PAUSE=300] We'll begin with the financial overview, followed by presentations from each department head. [BREATHE] Before we conclude, we'll allocate time for open discussion and address any questions or concerns.";

    default:
      return "Our program today includes several exciting segments designed to inform, engage, and inspire you. [EMPHASIS] We'll begin with introductions, move into our main presentation, and conclude with an interactive session. [PAUSE=300] Throughout the event, feel free to take notes and prepare any questions you might have for our dedicated Q&A period. [BREATHE] We've designed this event to provide maximum value in a concise format.";
  }
}

function getConclusion(eventType: string): string {
  switch (eventType) {
    case "conference":
      return "As we conclude this conference, I want to express our sincere gratitude to all speakers, panelists, and attendees who made this event a success. [PAUSE=400] The insights shared and connections made here will undoubtedly drive innovation in our industry. [BREATHE] We hope to see you at our next conference, and we wish you safe travels home.";

    case "webinar":
      return "Thank you for your active participation in today's webinar. [PAUSE=300] We hope the information presented proves valuable in your professional endeavors. [BREATHE] A recording of this session will be made available to all registered participants, along with the presentation slides and additional resources mentioned. We look forward to welcoming you to our future webinars.";

    case "corporate":
      return "This concludes our meeting. Thank you for your attention and contributions. [PAUSE=300] Let's move forward with implementing the strategies we've discussed today. [BREATHE] The minutes of this meeting will be circulated shortly, and your respective team leads will follow up on action items. I wish you all a productive day ahead.";

    default:
      return "As we come to the end of our event, I want to thank you all for your participation and engagement. [PAUSE=400] We hope you found value in today's proceedings and will apply the insights gained in your respective fields. [BREATHE] We look forward to seeing you at future events. Thank you once again, and have a wonderful day!";
  }
}
