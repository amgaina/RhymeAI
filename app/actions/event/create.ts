"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { VoiceSettings } from "./types";

/**
 * Creates a new event with basic information
 */
export async function createEvent(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Extract data from form
    const title = formData.get("eventName") as string;
    const eventType = formData.get("eventType") as string;
    const eventDate = formData.get("eventDate") as string;
    const location = formData.get("eventLocation") as string;
    const description = formData.get("eventDescription") as string;
    const expectedAttendees =
      parseInt(formData.get("expectedAttendees") as string) || 0;
    const language = formData.get("language") as string;

    // Voice settings
    const voiceType = formData.get("voiceType") as string;
    const voiceSettings = {
      type: voiceType,
      // You can add more voice settings from the form as needed
    };

    // Validate required fields
    if (!title || !eventType || !eventDate) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    const event = await db.events.create({
      data: {
        title,
        event_type: eventType,
        event_date: new Date(eventDate),
        description,
        location,
        expected_attendees: expectedAttendees,
        language,
        voice_settings: voiceSettings as any,
        user_id: userId,
        status: "draft",
        script_segments: [] as any,
        has_presentation: false,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/event-creation");

    return { success: true, eventId: event.event_id };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Finalizes an event and marks it as ready
 */
export async function finalizeEvent(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Calculate total duration
    const segments = await db.script_segments.findMany({
      where: { event_id: eventId },
    });

    const totalDuration = segments.reduce(
      (sum, segment) => sum + (segment.timing || 0),
      0
    );

    // Update event status and total duration
    await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        status: "ready",
        total_duration: totalDuration,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to finalize event:", error);
    return { success: false, error: "Failed to finalize event" };
  }
}
