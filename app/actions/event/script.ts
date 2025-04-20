"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ScriptSegment } from "./types";

/**
 * Creates a new script segment (either from scratch or from AI generation)
 */
export async function createScriptSegment(
  eventId: number,
  segment: Omit<ScriptSegment, "id">
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get the current event to check ownership
    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    // Create the script segment
    const newSegment = await db.script_segments.create({
      data: {
        event_id: eventId,
        segment_type: segment.type,
        content: segment.content,
        status: segment.status,
        audio_url: segment.audio_url || null,
        timing: segment.timing || null,
        order: segment.order,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, segment: newSegment };
  } catch (error) {
    console.error("Failed to create script segment:", error);
    return { success: false, error: "Failed to create script segment" };
  }
}

/**
 * Updates an existing script segment
 */
export async function updateScriptSegment(
  segmentId: number,
  data: {
    content?: string;
    audio_url?: string | null;
    status?: string;
    timing?: number | null;
    order?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the segment and verify ownership through the event
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      include: { event: true },
    });

    if (!segment || segment.event.user_id !== userId) {
      throw new Error("Segment not found or access denied");
    }

    // Update the segment
    const updatedSegment = await db.script_segments.update({
      where: { id: segmentId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${segment.event_id}`);

    return { success: true, segment: updatedSegment };
  } catch (error) {
    console.error("Failed to update script segment:", error);
    return { success: false, error: "Failed to update script segment" };
  }
}

/**
 * Deletes a script segment
 */
export async function deleteScriptSegment(segmentId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the segment and verify ownership through the event
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      include: { event: true },
    });

    if (!segment || segment.event.user_id !== userId) {
      throw new Error("Segment not found or access denied");
    }

    // Delete the segment
    await db.script_segments.delete({
      where: { id: segmentId },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${segment.event_id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete script segment:", error);
    return { success: false, error: "Failed to delete script segment" };
  }
}

/**
 * Generates audio for a script segment
 */
export async function generateAudio(segmentId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the segment and verify ownership
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      include: { event: true },
    });

    if (!segment || segment.event.user_id !== userId) {
      throw new Error("Segment not found or access denied");
    }

    // Update status to generating
    await db.script_segments.update({
      where: { id: segmentId },
      data: { status: "generating" },
    });

    // Simulate TTS generation - in a real implementation, call your Text-to-Speech API
    // This would be an async process that might take some time
    const audioUrl = await simulateTtsGeneration(
      segment.content,
      segment.event.voice_settings as any
    );

    // Update the segment with the generated audio
    const updatedSegment = await db.script_segments.update({
      where: { id: segmentId },
      data: {
        audio_url: audioUrl,
        status: "generated",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${segment.event_id}`);

    return { success: true, segment: updatedSegment };
  } catch (error) {
    console.error("Failed to generate audio:", error);
    return { success: false, error: "Failed to generate audio" };
  }
}

/**
 * Helper function to simulate TTS generation
 */
async function simulateTtsGeneration(
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
 * Generates script segments from event data using AI
 */
export async function generateScript(eventId: number) {
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

    // In a real implementation, call the AI to generate script segments
    // For this example, we'll create mock segments
    const segments = [
      {
        segment_type: "introduction",
        content: `Welcome to ${
          event.title
        }! I'm your AI host, and I'm delighted to guide you through today's ${event.event_type?.toLowerCase()}.`,
        status: "draft",
        order: 1,
      },
      {
        segment_type: "agenda",
        content: `Let me walk you through today's agenda. We have carefully designed this ${event.event_type?.toLowerCase()} to provide maximum value and engagement for all attendees.`,
        status: "draft",
        order: 2,
      },
      {
        segment_type: "speaker introduction",
        content:
          "I'm pleased to introduce our speakers for today. They bring extensive expertise and insights to our discussions.",
        status: "draft",
        order: 3,
      },
      {
        segment_type: "transitions",
        content: `As we transition between segments of our ${event.event_type?.toLowerCase()}, please feel free to use this time to reflect on what you've learned or to prepare questions for our upcoming sessions.`,
        status: "draft",
        order: 4,
      },
      {
        segment_type: "closing",
        content: `Thank you all for participating in ${
          event.title
        }. We hope you found this ${event.event_type?.toLowerCase()} valuable and informative. We look forward to seeing you at future events!`,
        status: "draft",
        order: 5,
      },
    ];

    // Insert all segments into the database
    const createdSegments = await Promise.all(
      segments.map((segment) =>
        db.script_segments.create({
          data: {
            event_id: event.event_id,
            ...segment,
          },
        })
      )
    );

    // Update event script generation status
    await db.events.update({
      where: { event_id: eventId },
      data: {
        status: "ready",
        total_duration: 300, // Mock 5 minutes total
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, segments: createdSegments };
  } catch (error) {
    console.error("Failed to generate script:", error);
    return { success: false, error: "Failed to generate script" };
  }
}
