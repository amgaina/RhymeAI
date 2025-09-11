"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Update event details during the event creation flow
 * This allows going back from layout to details without creating a new event
 */
export async function updateEventDetails(
  eventId: string,
  formData: FormData
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

    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract data from FormData
    const eventName = formData.get("eventName") as string;
    const eventType = formData.get("eventType") as string;
    const eventDate = formData.get("eventDate") as string;
    const eventLocation = formData.get("eventLocation") as string;
    const expectedAttendees = formData.get("expectedAttendees") as string;
    const eventDescription = formData.get("eventDescription") as string;
    const language = formData.get("language") as string;
    
    // Voice settings
    const voiceGender = formData.get("voiceGender") as string;
    const voiceType = formData.get("voiceType") as string;
    const accent = formData.get("accent") as string;
    const speakingRate = formData.get("speakingRate") as string;
    const pitch = formData.get("pitch") as string;

    // Validate required fields
    if (!eventName || !eventType || !eventDate) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Prepare voice settings object
    const voiceSettings = {
      gender: voiceGender || "neutral",
      tone: voiceType || "professional",
      accent: accent || "american",
      speed: speakingRate ? 
        (parseInt(speakingRate) > 60 ? "fast" : parseInt(speakingRate) < 40 ? "slow" : "medium") 
        : "medium",
      pitch: pitch ? 
        (parseInt(pitch) > 60 ? "high" : parseInt(pitch) < 40 ? "low" : "medium") 
        : "medium",
    };

    // Update the event in the database
    const updatedEvent = await db.events.update({
      where: {
        event_id: eventIdNum,
        user_id: userId,
      },
      data: {
        title: eventName,
        event_type: eventType,
        event_date: new Date(eventDate),
        location: eventLocation || null,
        expected_attendees: expectedAttendees ? parseInt(expectedAttendees, 10) : null,
        description: eventDescription || null,
        language: language || "English",
        voice_settings: voiceSettings,
        updated_at: new Date(),
      },
    });

    // Revalidate paths to update UI
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      eventId: updatedEvent.event_id,
      message: "Event details updated successfully",
    };
  } catch (error) {
    console.error("Error updating event details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event details",
    };
  }
}
