"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// Event validation schema
const eventFormSchema = z.object({
  // Event Details
  eventName: z.string().min(3, { message: "Event name must be at least 3 characters" }),
  eventType: z.string().min(1, { message: "Please select an event type" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().optional(),
  timezone: z.string().optional(),
  eventDescription: z.string().optional(),
  expectedAttendees: z.string().optional(),
  eventFormat: z.string().optional(),

  // Voice Settings
  primaryVoice: z.string().optional(),
  accent: z.string().optional(),
  speakingStyle: z.string().optional(),
  speakingRate: z.coerce.number().default(50),
  pitch: z.coerce.number().default(50),
  multilingual: z.coerce.boolean().default(false),

  // Script Settings
  scriptTemplate: z.string().optional(),
  customScript: z.string().optional(),
  autoGenerate: z.coerce.boolean().default(true),
});

// Ensure user exists in the database
async function ensureUserExists(userId: string): Promise<void> {
  try {
    // Check if user exists
    const existingUser = await db.users.findUnique({
      where: { user_id: userId },
    });

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log(`Creating new user with ID: ${userId}`);

      // Create a basic user record
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

// Create a new event
export async function createEvent(formData: FormData) {
  try {
    // Get user authentication
    const session = await auth();

    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log("User ID:", session.userId);

    // Ensure the user exists in the database before proceeding
    try {
      await ensureUserExists(session.userId);
    } catch (userError) {
      console.error("Error ensuring user exists:", userError);
      return {
        success: false,
        error: "Failed to verify user account",
      };
    }

    // Extract form data into an object
    const formValues = Object.fromEntries(formData.entries());
    
    // Parse boolean values
    const parsedValues = {
      ...formValues,
      multilingual: formValues.multilingual === "true",
      autoGenerate: formValues.autoGenerate === "true",
      speakingRate: Number(formValues.speakingRate || 50),
      pitch: Number(formValues.pitch || 50),
    };

    // Validate form data
    const validationResult = eventFormSchema.safeParse(parsedValues);
    
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.format());
      return { 
        success: false, 
        error: "Invalid form data", 
        validationErrors: validationResult.error.format() 
      };
    }
    
    const validatedData = validationResult.data;

    // Prepare voice settings
    const voiceSettings = {
      gender: validatedData.primaryVoice?.includes("male") 
        ? "male" 
        : validatedData.primaryVoice?.includes("female") 
          ? "female" 
          : "neutral",
      voiceType: validatedData.speakingStyle || "professional",
      accent: validatedData.accent || "american",
      speakingRate: validatedData.speakingRate,
      pitch: validatedData.pitch,
      multilingual: validatedData.multilingual,
    };

    // Create event in database
    const event = await db.events.create({
      data: {
        title: validatedData.eventName,
        event_type: validatedData.eventType,
        event_date: new Date(validatedData.startDate),
        location: validatedData.eventFormat || null,
        expected_attendees: validatedData.expectedAttendees
          ? parseInt(validatedData.expectedAttendees)
          : null,
        description: validatedData.eventDescription || null,
        language: validatedData.multilingual ? "Multilingual" : "English",
        voice_settings: voiceSettings,
        status: "draft",
        user_id: session.userId,
        has_presentation: false,
        play_count: 0,
      },
    });

    // If script content was provided, create a script segment
    if (validatedData.customScript) {
      await db.script_segments.create({
        data: {
          event_id: event.event_id,
          segment_type: "introduction",
          content: validatedData.customScript,
          timing: 0, // Will be calculated later
          order: 1,
          status: "draft",
        },
      });
    }

    revalidatePath("/dashboard");
    console.log("Event created successfully with ID:", event.event_id);
    
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
