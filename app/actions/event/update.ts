"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
// Define types based on the schema
type VoiceSettings = {
  tone?: string;
  gender?: string;
  accent?: string;
  speed?: number;
  [key: string]: any;
};

type RecordingDevice = {
  id: string;
  name: string;
  type: string;
  status: string;
  [key: string]: any;
};

type StreamDestination = {
  platform: string;
  url: string;
  key?: string;
  status: string;
  [key: string]: any;
};

/**
 * Updates an event's basic information
 */
export async function updateEventInfo(
  eventId: number,
  data: {
    title?: string;
    event_type?: string;
    event_date?: Date;
    description?: string;
    location?: string;
    expected_attendees?: number;
    language?: string;
    status?: string;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const event = await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, event };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Updates voice settings for an event
 */
export async function updateVoiceSettings(
  eventId: number,
  voiceSettings: VoiceSettings
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const event = await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        voice_settings: voiceSettings as any,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, event };
  } catch (error) {
    console.error("Failed to update voice settings:", error);
    return { success: false, error: "Failed to update voice settings" };
  }
}

/**
 * Updates event recording devices configuration
 */
export async function updateRecordingDevices(
  eventId: number,
  devices: RecordingDevice[]
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        recording_devices: devices as any,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update recording devices:", error);
    return { success: false, error: "Failed to update recording devices" };
  }
}

/**
 * Updates event streaming destinations
 */
export async function updateStreamDestinations(
  eventId: number,
  destinations: StreamDestination[]
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        streaming_destinations: destinations as any,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update streaming destinations:", error);
    return { success: false, error: "Failed to update streaming destinations" };
  }
}

/**
 * Updates event settings
 */
export async function updateEventSettings(eventId: number, settings: any) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data: {
        event_settings: settings as any,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update event settings:", error);
    return { success: false, error: "Failed to update event settings" };
  }
}

/**
 * Updates event timing information
 */
export async function updateEventTiming(
  eventId: number,
  data: {
    start_time?: Date;
    end_time?: Date;
    total_duration?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const event = await db.events.update({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, event };
  } catch (error) {
    console.error("Failed to update event timing:", error);
    return { success: false, error: "Failed to update event timing" };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(
  eventId: string | number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string ID to number if needed
    const numericEventId =
      typeof eventId === "string" ? parseInt(eventId, 10) : eventId;
    if (isNaN(numericEventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    // Check if the event exists and belongs to the user
    const existingEvent = await db.events.findFirst({
      where: {
        event_id: numericEventId,
        user_id: userId,
      },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    // Delete the event from the database
    // This will cascade delete all related records (segments, chat messages, etc.)
    await db.events.delete({
      where: {
        event_id: numericEventId,
      },
    });

    // Revalidate the dashboard page to reflect the changes
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}

/**
 * Duplicate an event
 */
export async function duplicateEvent(
  eventId: string | number
): Promise<{ success: boolean; newEventId?: number; error?: string }> {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string ID to number if needed
    const numericEventId =
      typeof eventId === "string" ? parseInt(eventId, 10) : eventId;
    if (isNaN(numericEventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    // Check if the event exists and belongs to the user
    const existingEvent = await db.events.findFirst({
      where: {
        event_id: numericEventId,
        user_id: userId,
      },
      include: {
        segments: true,
      },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    // Create a new event with the same data
    const newEvent = await db.events.create({
      data: {
        user_id: userId,
        title: `${existingEvent.title} (Copy)`,
        event_type: existingEvent.event_type,
        event_date: existingEvent.event_date,
        location: existingEvent.location,
        description: existingEvent.description,
        voice_settings: existingEvent.voice_settings as any,
        language: existingEvent.language,
        status: "draft", // Always start as draft
        has_presentation: existingEvent.has_presentation,
      },
    });

    // Duplicate all segments
    if (existingEvent.segments && existingEvent.segments.length > 0) {
      for (const segment of existingEvent.segments) {
        await db.script_segments.create({
          data: {
            event_id: newEvent.event_id,
            segment_type: segment.segment_type,
            content: segment.content,
            order: segment.order,
            timing: segment.timing,
            status: "draft", // Reset status to draft
            // Don't copy audio_url - it will need to be regenerated
          },
        });
      }
    }

    // Revalidate the dashboard page to reflect the changes
    revalidatePath("/dashboard");

    return { success: true, newEventId: newEvent.event_id };
  } catch (error) {
    console.error("Error duplicating event:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to duplicate event",
    };
  }
}

/**
 * Export event data
 */
export async function exportEvent(
  eventId: string | number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string ID to number if needed
    const numericEventId =
      typeof eventId === "string" ? parseInt(eventId, 10) : eventId;
    if (isNaN(numericEventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    // Check if the event exists and belongs to the user
    const existingEvent = await db.events.findFirst({
      where: {
        event_id: numericEventId,
        user_id: userId,
      },
      include: {
        segments: true,
      },
    });

    if (!existingEvent) {
      return { success: false, error: "Event not found" };
    }

    // Format the event data for export
    const exportData = {
      event: {
        id: existingEvent.event_id,
        title: existingEvent.title,
        type: existingEvent.event_type,
        date: existingEvent.event_date.toISOString(),
        location: existingEvent.location,
        description: existingEvent.description,
        voiceSettings: existingEvent.voice_settings,
        language: existingEvent.language,
        status: existingEvent.status,
        createdAt: existingEvent.created_at.toISOString(),
      },
      segments: existingEvent.segments.map((segment) => ({
        id: segment.id,
        type: segment.segment_type,
        content: segment.content,
        order: segment.order,
        timing: segment.timing,
        status: segment.status,
        audioUrl: segment.audio_url,
      })),
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error("Error exporting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export event",
    };
  }
}
