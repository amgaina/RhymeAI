"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  VoiceSettings,
  VoiceSettingsAccent,
  VoiceSettingsGender,
} from "./types";
import { VoiceSettingsTone } from "@/types/event";
import { auth } from "@clerk/nextjs/server";

// Event validation schema
const eventSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventLocation: z.string().optional(),
  eventDescription: z.string().optional(),
  expectedAttendees: z.string().optional(),
  language: z.string().default("English"),
  voiceType: z.string().default("Professional"),
  voiceGender: z.string().optional(),
  accent: z.string().optional(),
  speakingRate: z.string().optional(),
  pitch: z.string().optional(),
});

/**
 * Ensures that a user exists in the database
 * Creates the user if they don't already exist
 */
async function ensureUserExists(userId: string): Promise<void> {
  try {
    // Check if user exists
    const existingUser = await db.users.findUnique({
      where: { user_id: userId },
    });

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log(`Creating new user with ID: ${userId}`);

      // Get user data from Clerk if available
      // For now, we'll create a basic user record
      await db.users.create({
        data: {
          user_id: userId,
          name: "New User", // Required field according to your schema
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  } catch (userError) {
    console.error("Error ensuring user exists:", userError);
    throw userError;
  }
}

/**
 * Create a new event with the provided form data
 */
export async function createEvent(formData: FormData): Promise<{
  success: boolean;
  eventId?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Extract and validate data from FormData
    const userid = await auth();

    if (!userid || !userid.userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log("User ID:", userid);

    // Ensure the user exists in the database before proceeding
    try {
      await ensureUserExists(userid.userId);
    } catch (userError) {
      console.error("Error ensuring user exists:", userError);
      return {
        success: false,
        error: "Failed to verify user account",
      };
    }

    // Extract form data
    const data = {
      eventName: formData.get("eventName") as string,
      eventType: formData.get("eventType") as string,
      eventDate: formData.get("eventDate") as string,
      eventLocation: formData.get("eventLocation") as string,
      eventDescription: formData.get("eventDescription") as string,
      expectedAttendees: formData.get("expectedAttendees") as string,
      language: formData.get("language") as string,
      voiceType: formData.get("voiceType") as string,
      voiceGender: formData.get("voiceGender") as string,
      accent: formData.get("accent") as string,
      speakingRate: formData.get("speakingRate") as string,
      pitch: formData.get("pitch") as string,
    };

    // Validate the data
    const result = eventSchema.safeParse(data);

    if (!result.success) {
      console.error("Validation error:", result.error);
      return { success: false, error: "Invalid event data" };
    }

    // Prepare voice settings object based on form data
    const voiceSettings = {
      gender: data.voiceGender || "neutral",
      accent: data.accent || "american",
      tone: data.voiceType?.toLowerCase() || "professional",
      speed: data.speakingRate
        ? parseInt(data.speakingRate) > 70
          ? "fast"
          : parseInt(data.speakingRate) < 30
          ? "slow"
          : "medium"
        : "medium",
      pitch: data.pitch
        ? parseInt(data.pitch) > 70
          ? "high"
          : parseInt(data.pitch) < 30
          ? "low"
          : "medium"
        : "medium",
    };

    // Get the date object from the date string
    const eventDate = new Date(data.eventDate);

    // Parse expected attendees to integer
    const expectedAttendees = data.expectedAttendees
      ? parseInt(data.expectedAttendees)
      : null;

    // Create the event in the database
    const event = await db.events.create({
      data: {
        title: data.eventName,
        description: data.eventDescription,
        event_type: data.eventType,
        location: data.eventLocation,
        event_date: eventDate,
        expected_attendees: expectedAttendees,
        language: data.language,
        voice_settings: voiceSettings, // Don't stringify JSON objects - Prisma handles this
        status: "draft",
        user_id: userid.userId,
        has_presentation: false,
        play_count: 0,
      },
    });

    // Revalidate paths
    revalidatePath("/events");
    revalidatePath("/dashboard");

    return {
      success: true,
      eventId: event.event_id,
      message: "Event created successfully",
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

/**
 * Marks an event as finalized, indicating all setup is complete
 * and the event is ready for presentation
 */
export async function finalizeEvent(eventId: string) {
  try {
    // Convert string eventId to number as required by the schema
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Update the event status to 'ready' in the database
    const updatedEvent = await db.events.update({
      where: {
        event_id: eventIdNum,
      },
      data: {
        status: "ready",
        updated_at: new Date(),
      },
    });

    // Revalidate relevant paths to update the UI
    revalidatePath(`/dashboard`);
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      message: "Event successfully finalized",
      event: updatedEvent,
    };
  } catch (error) {
    console.error("Error finalizing event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
