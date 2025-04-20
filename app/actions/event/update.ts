"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { VoiceSettings, RecordingDevice, StreamDestination } from "./types";

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
