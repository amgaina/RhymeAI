"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

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

    // Check if event settings contain a chat_id
    let chatContext = "";
    if (event.event_settings && typeof event.event_settings === "object") {
      const settings = event.event_settings as Record<string, any>;
      if (settings.linked_chat_id) {
        // Use the chat ID to fetch chat history and use as context
        try {
          const chatMessages = await db.chat_messages.findMany({
            where: {
              event_id: eventIdNum,
            },
            orderBy: {
              created_at: "asc",
            },
          });

          if (chatMessages.length > 0) {
            chatContext = chatMessages
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join("\n");
          }
        } catch (error) {
          console.warn("Failed to load chat context:", error);
        }
      }
    }

    // Extract voice settings for consistent tone
    const voiceSettings =
      typeof event.voice_settings === "string"
        ? JSON.parse(event.voice_settings as string)
        : event.voice_settings || {};

    // Configure the AI model - using the same model as in route.ts
    const model = google("gemini-2.0-flash-exp", {
      maxOutputTokens: 1500,
      temperature: 0.7,
    });

    for (const layoutSegment of event.layout.segments) {
      // Prepare the context for AI generation
      const systemPrompt = `You are an AI event host writing a script for a segment of an event.
Your goal is to create engaging, professional content appropriate for the context.`;

      const userPrompt = `
Write a script for segment "${layoutSegment.name}" of type "${
        layoutSegment.type
      }"
for a ${event.event_type} titled "${event.title}".

Event details:
- Title: ${event.title}
- Type: ${event.event_type}
- Description: ${event.description || "Not specified"}
- Date: ${
        event.event_date
          ? new Date(event.event_date).toLocaleDateString()
          : "Not specified"
      }
- Location: ${event.location || "Not specified"}
- Expected attendees: ${event.expected_attendees || "Not specified"}

Segment details:
- Name: ${layoutSegment.name}
- Type: ${layoutSegment.type}
- Description: ${layoutSegment.description}
- Duration: ${layoutSegment.duration} minutes
- Order in event: ${layoutSegment.order} of ${event.layout.segments.length}

Voice characteristics:
- Gender: ${voiceSettings.gender || "neutral"}
- Style: ${voiceSettings.voiceType || "professional"}
- Accent: ${voiceSettings.accent || "standard"}

${chatContext ? "Context from event planning chat:\n" + chatContext : ""}

Write a natural, conversational script for this segment that would be spoken by an AI host.
The script should be appropriate for the segment type and fit within the allocated duration (${
        layoutSegment.duration
      } minutes).
Make it sound natural and engaging. Keep it under 300 words.
`;

      try {
        // Call AI to generate the script content using the ai SDK
        const { text: generatedText } = await generateText({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        // Use the properly destructured text content
        const scriptContent =
          generatedText?.trim() ||
          `Next up is our ${layoutSegment.name} segment. ${layoutSegment.description} This will last approximately ${layoutSegment.duration} minutes.`;

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
      } catch (aiError) {
        console.error("Error generating AI script content:", aiError);

        // Use fallback content if AI generation fails
        const fallbackContent = `Next up is our ${layoutSegment.name} segment. ${layoutSegment.description} This will last approximately ${layoutSegment.duration} minutes.`;

        const scriptSegment = await db.script_segments.create({
          data: {
            event_id: event.event_id,
            layout_segment_id: layoutSegment.id,
            segment_type: layoutSegment.type,
            content: fallbackContent,
            timing: layoutSegment.duration * 60,
            order: layoutSegment.order,
            status: "draft",
          },
        });

        scriptSegments.push(scriptSegment);
      }
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
      message: `Generated ${scriptSegments.length} script segments successfully`,
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to update script segment",
    };
  }
}
