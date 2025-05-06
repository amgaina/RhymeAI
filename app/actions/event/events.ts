"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ScriptSegment } from "@/types/event";

// Use the existing type from types.ts
export interface EventResponse {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  description: string;
  voiceSettings: {
    type: string;
    language: string;
    [key: string]: any;
  };
  scriptSegments: ScriptSegment[];
  createdAt: string;
  status: string;
  hasPresentation?: boolean;
  playCount?: number;
}

export async function getEvents(): Promise<{
  success: boolean;
  events?: EventResponse[];
  error?: string;
}> {
  try {
    // Get the authenticated user
    const session = await auth();

    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get events for the user from the database
    const eventsData = await db.events.findMany({
      where: {
        user_id: session.userId,
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        segments: true, // Changed from script_segments to segments to match the schema
      },
    });

    // Map the database model to the response format
    const events: EventResponse[] = eventsData.map((event) => {
      // Parse the voice settings from JSON if needed
      const voiceSettings =
        typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings as string)
          : event.voice_settings;

      // Convert script segments to the expected format
      const scriptSegments: ScriptSegment[] = (event.segments || []).map(
        (segment) => ({
          id: segment.id,
          type: segment.segment_type,
          content: segment.content,
          audio_url: segment.audio_url,
          status:
            (segment.status as
              | "draft"
              | "editing"
              | "generating"
              | "generated") || "draft",
          timing: segment.timing || 30,
          order: segment.order,
          audio: segment.audio_url || null,
          presentationSlide: null,
        })
      );

      return {
        id: event.event_id.toString(),
        name: event.title,
        type: event.event_type,
        date: event.event_date
          ? event.event_date.toISOString().split("T")[0]
          : "Not specified",
        location: event.location || "Not specified",
        description: event.description || "",
        voiceSettings: {
          type: voiceSettings?.tone || "Professional",
          language: event.language || "English",
          ...(voiceSettings || {}),
        },
        scriptSegments: scriptSegments,
        createdAt: event.created_at.toISOString(),
        status: event.status,
        hasPresentation: !!event.has_presentation,
        playCount: event.play_count || 0,
      };
    });

    return {
      success: true,
      events,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
}

export interface EventData
  extends Omit<EventResponse, "location" | "description"> {
  location: string | null;
  description: string | null;
  // Add any additional client-side fields if needed
}
