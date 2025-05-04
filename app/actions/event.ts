"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { ScriptSegment } from "@/types/event";
import { auth } from "@clerk/nextjs/server";
import { getPresignedUrl } from "@/lib/s3-utils";

// Define EventData type for client-side use
export interface EventData {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string | null;
  description: string | null;
  voiceSettings: {
    type: string;
    language: string;
    [key: string]: any;
  };
  scriptSegments: ScriptSegment[];
  layout?: EventLayout | null;
  createdAt: string;
  status: string;
  hasPresentation?: boolean;
  playCount?: number;
}

// Get all events for the current user
export async function getEvents(): Promise<{
  success: boolean;
  events?: any[];
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
        segments: true, // Include script segments
        layout: {
          include: {
            segments: true,
          },
        },
      },
    });

    // Map the database model to the response format
    const events = eventsData.map((event) => {
      // Parse the voice settings from JSON if needed
      const voiceSettings =
        typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings as string)
          : event.voice_settings;

      return {
        event_id: event.event_id,
        title: event.title,
        event_type: event.event_type,
        event_date: event.event_date,
        location: event.location,
        description: event.description,
        voice_settings: voiceSettings || {
          type: "Professional",
          language: event.language || "English",
        },
        segments: event.segments || [],
        created_at: event.created_at,
        status: event.status,
        has_presentation: !!event.has_presentation,
        play_count: event.play_count || 0,
      };
    });

    // Convert the database events to the EventData format
    const formattedEvents: EventData[] = events.map((event) => ({
      id: event.event_id.toString(),
      name: event.title,
      type: event.event_type,
      date: event.event_date
        ? event.event_date.toISOString().split("T")[0]
        : "Not specified",
      location: event.location,
      description: event.description,
      voiceSettings:
        typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings)
          : event.voice_settings || {
              type: "Professional",
              language: "English",
            },
      scriptSegments: (event.segments || []).map((segment) => ({
        id: segment.id,
        type: segment.segment_type,
        content: segment.content,
        status: (segment.status || "draft") as
          | "draft"
          | "editing"
          | "generating"
          | "generated",
        timing: segment.timing || 0,
        order: segment.order,
        audio: segment.audio_url,
        presentationSlide: null,
      })),
      createdAt: event.created_at
        ? event.created_at.toISOString()
        : new Date().toISOString(),
      status: event.status,
      hasPresentation: !!event.has_presentation,
      playCount: event.play_count || 0,
    }));

    return {
      success: true,
      events: formattedEvents,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
}

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

// Schema for event creation
const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventLocation: z.string().optional().nullable(),
  expectedAttendees: z.string().optional().nullable(),
  eventDescription: z.string().optional().nullable(),
  language: z.string().optional().nullable().default("English"),
  voiceGender: z.string().optional().nullable().default("neutral"),
  voiceType: z.string().optional().nullable().default("professional"),
  accent: z.string().optional().nullable().default("american"),
  speakingRate: z.string().optional().nullable().default("50"),
  pitch: z.string().optional().nullable().default("50"),
});

// Create a new event
export async function createEvent(formData: FormData) {
  try {
    // Get user authentication
    const { auth } = await import("@clerk/nextjs/server");
    const userid = await auth();

    if (!userid || !userid.userId) {
      return { success: false, error: "Unauthorized" };
    }

    console.log("User ID:", userid.userId);

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

    // Validate form data
    const validatedFields = eventSchema.parse({
      eventName: formData.get("eventName"),
      eventType: formData.get("eventType"),
      eventDate: formData.get("eventDate"),
      eventLocation: formData.get("eventLocation"),
      expectedAttendees: formData.get("expectedAttendees"),
      eventDescription: formData.get("eventDescription"),
      language: formData.get("language"),
      voiceGender: formData.get("voiceGender"),
      voiceType: formData.get("voiceType"),
      accent: formData.get("accent"),
      speakingRate: formData.get("speakingRate"),
      pitch: formData.get("pitch"),
    });

    // Create event in database
    const event = await db.events.create({
      data: {
        title: validatedFields.eventName,
        event_type: validatedFields.eventType,
        event_date: new Date(validatedFields.eventDate),
        location: validatedFields.eventLocation || null,
        expected_attendees: validatedFields.expectedAttendees
          ? parseInt(validatedFields.expectedAttendees)
          : null,
        description: validatedFields.eventDescription || null,
        language: validatedFields.language || "English",
        voice_settings: {
          gender: validatedFields.voiceGender || "neutral",
          voiceType: validatedFields.voiceType || "professional",
          accent: validatedFields.accent || "american",
          speakingRate:
            validatedFields.speakingRate &&
            validatedFields.speakingRate !== "null"
              ? parseInt(validatedFields.speakingRate)
              : 50,
          pitch:
            validatedFields.pitch && validatedFields.pitch !== "null"
              ? parseInt(validatedFields.pitch)
              : 50,
        },
        status: "draft",
        user_id: userid.userId,
        has_presentation: false,
        play_count: 0,
      },
    });

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

// Update an existing event
export async function updateEvent(formData: FormData) {
  try {
    // Get user authentication
    const { auth } = await import("@clerk/nextjs/server");
    const userid = await auth();

    if (!userid || !userid.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the event ID from the form data
    const eventId = formData.get("eventId");
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    console.log("Updating event with ID:", eventId);

    // Validate form data
    const validatedFields = eventSchema.parse({
      eventName: formData.get("eventName"),
      eventType: formData.get("eventType"),
      eventDate: formData.get("eventDate"),
      eventLocation: formData.get("eventLocation"),
      expectedAttendees: formData.get("expectedAttendees"),
      eventDescription: formData.get("eventDescription"),
      language: formData.get("language"),
      voiceGender: formData.get("voiceGender"),
      voiceType: formData.get("voiceType"),
      accent: formData.get("accent"),
      speakingRate: formData.get("speakingRate"),
      pitch: formData.get("pitch"),
    });

    // Update event in database
    const event = await db.events.update({
      where: {
        event_id: parseInt(eventId.toString()),
        user_id: userid.userId, // Ensure the user can only update their own events
      },
      data: {
        title: validatedFields.eventName,
        event_type: validatedFields.eventType,
        event_date: new Date(validatedFields.eventDate),
        location: validatedFields.eventLocation || null,
        expected_attendees: validatedFields.expectedAttendees
          ? parseInt(validatedFields.expectedAttendees)
          : null,
        description: validatedFields.eventDescription || null,
        language: validatedFields.language || "English",
        voice_settings: {
          gender: validatedFields.voiceGender || "neutral",
          voiceType: validatedFields.voiceType || "professional",
          accent: validatedFields.accent || "american",
          speakingRate:
            validatedFields.speakingRate &&
            validatedFields.speakingRate !== "null"
              ? parseInt(validatedFields.speakingRate)
              : 50,
          pitch:
            validatedFields.pitch && validatedFields.pitch !== "null"
              ? parseInt(validatedFields.pitch)
              : 50,
        },
        updated_at: new Date(),
      },
    });

    revalidatePath("/dashboard");
    console.log("Event updated successfully with ID:", event.event_id);
    return {
      success: true,
      eventId: event.event_id,
      message: "Event updated successfully",
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update event",
    };
  }
}

// Generate event layout based on event details
export async function generateEventLayout(eventId: string) {
  console.log("generateEventLayout called with ID:", eventId);

  try {
    // Get event details
    const eventIdNum = parseInt(eventId);
    console.log("Parsed event ID:", eventIdNum);

    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
    });

    console.log("Found event:", event ? "Yes" : "No");

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Generate layout based on event type
    let segments: Omit<LayoutSegment, "id">[] = [];

    switch (event.event_type.toLowerCase()) {
      case "conference":
        segments = [
          {
            name: "Welcome",
            type: "introduction",
            description: "Welcome attendees and introduce the event",
            duration: 5,
            order: 1,
          },
          {
            name: "Agenda Overview",
            type: "agenda",
            description: "Outline the schedule for the day",
            duration: 3,
            order: 2,
          },
          {
            name: "Keynote Introduction",
            type: "keynote",
            description: "Introduce the keynote speaker",
            duration: 2,
            order: 3,
          },
          {
            name: "Q&A Session",
            type: "q_and_a",
            description: "Moderate questions from the audience",
            duration: 15,
            order: 4,
          },
          {
            name: "Closing Remarks",
            type: "conclusion",
            description: "Thank attendees and conclude the event",
            duration: 5,
            order: 5,
          },
        ];
        break;

      case "webinar":
        segments = [
          {
            name: "Introduction",
            type: "introduction",
            description: "Welcome attendees and introduce the webinar topic",
            duration: 3,
            order: 1,
          },
          {
            name: "Speaker Introduction",
            type: "keynote",
            description: "Introduce the main presenter",
            duration: 2,
            order: 2,
          },
          {
            name: "Main Presentation",
            type: "presentation",
            description: "Main content of the webinar",
            duration: 30,
            order: 3,
          },
          {
            name: "Q&A Session",
            type: "q_and_a",
            description: "Answer questions from attendees",
            duration: 15,
            order: 4,
          },
          {
            name: "Conclusion",
            type: "conclusion",
            description: "Summarize key points and thank attendees",
            duration: 5,
            order: 5,
          },
        ];
        break;

      case "workshop":
        segments = [
          {
            name: "Welcome",
            type: "introduction",
            description: "Welcome participants and set expectations",
            duration: 5,
            order: 1,
          },
          {
            name: "Workshop Overview",
            type: "agenda",
            description: "Explain the workshop structure and goals",
            duration: 5,
            order: 2,
          },
          {
            name: "Activity Introduction",
            type: "presentation",
            description: "Explain the main activity",
            duration: 10,
            order: 3,
          },
          {
            name: "Break",
            type: "break",
            description: "Short break for participants",
            duration: 10,
            order: 4,
          },
          {
            name: "Discussion",
            type: "discussion",
            description: "Group discussion of results",
            duration: 15,
            order: 5,
          },
          {
            name: "Conclusion",
            type: "conclusion",
            description: "Summarize learnings and next steps",
            duration: 5,
            order: 6,
          },
        ];
        break;

      default:
        segments = [
          {
            name: "Welcome",
            type: "introduction",
            description: "Welcome attendees and introduce the event",
            duration: 5,
            order: 1,
          },
          {
            name: "Main Content",
            type: "presentation",
            description: "Main content of the event",
            duration: 20,
            order: 2,
          },
          {
            name: "Closing",
            type: "conclusion",
            description: "Thank attendees and conclude the event",
            duration: 5,
            order: 3,
          },
        ];
    }

    // Create layout in database
    console.log("Creating layout in database...");
    console.log("Event ID:", event.event_id);

    // Switch from db to prisma for consistency
    const layout = await db.event_layout.upsert({
      where: {
        event_id: event.event_id,
      },
      create: {
        event_id: event.event_id,
        total_duration: segments.reduce(
          (total, segment) => total + segment.duration,
          0
        ),
        last_generated_by: "system",
      },
      update: {
        total_duration: segments.reduce(
          (total, segment) => total + segment.duration,
          0
        ),
        layout_version: { increment: 1 },
        updated_at: new Date(),
        last_generated_by: "system",
      },
    });

    // Delete any existing segments
    await db.layout_segments.deleteMany({
      where: {
        layout_id: layout.id,
      },
    });

    // Calculate start and end times for segments
    let currentTime = new Date();
    if (event.event_date) {
      // Use event date as the base
      currentTime = new Date(event.event_date);
      // Default to 9:00 AM if no specific time
      currentTime.setHours(9, 0, 0);
    }

    // Format time function
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    // Sort segments by order
    const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

    // Calculate times for each segment
    const segmentsWithTimes = sortedSegments.map((segment) => {
      const startTime = formatTime(currentTime);

      // Calculate end time
      const endTimeDate = new Date(currentTime);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + segment.duration);
      const endTime = formatTime(endTimeDate);

      // Update current time for next segment
      currentTime = new Date(endTimeDate);

      return {
        ...segment,
        startTime,
        endTime,
      };
    });

    // Create new segments
    const createdSegments = await Promise.all(
      segmentsWithTimes.map((segment) =>
        db.layout_segments.create({
          data: {
            layout_id: layout.id,
            name: segment.name,
            type: segment.type,
            description: segment.description,
            duration: segment.duration,
            order: segment.order,
            custom_properties: {
              start_time: segment.startTime,
              end_time: segment.endTime,
            },
          },
        })
      )
    );

    // Format the response
    const formattedLayout: EventLayout = {
      id: layout.id,
      eventId: layout.event_id,
      totalDuration: layout.total_duration,
      lastUpdated: layout.updated_at.toISOString(),
      segments: createdSegments.map((segment, index) => {
        // Extract start and end times from custom_properties
        const customProps =
          (segment.custom_properties as Record<string, any>) || {};

        // Use the times we calculated earlier
        const segmentWithTime = segmentsWithTimes[index];

        return {
          id: segment.id.toString(),
          name: segment.name,
          type: segment.type as any,
          description: segment.description,
          duration: segment.duration,
          order: segment.order,
          startTime: customProps.start_time || segmentWithTime?.startTime || "",
          endTime: customProps.end_time || segmentWithTime?.endTime || "",
        };
      }),
    };

    console.log("Layout generated successfully:", formattedLayout.id);
    return { success: true, layout: formattedLayout };
  } catch (error) {
    console.error("Error generating layout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate layout",
    };
  }
}

// Update an event layout segment
export async function updateEventLayoutSegment(
  eventId: string,
  segment: LayoutSegment
) {
  try {
    // First, get the existing segment to access its custom_properties
    const existingSegment = await db.layout_segments.findUnique({
      where: { id: segment.id },
    });

    if (!existingSegment) {
      return { success: false, error: "Segment not found" };
    }

    // Parse existing custom properties
    let customProps = {};
    try {
      customProps =
        (existingSegment.custom_properties as Record<string, any>) || {};
    } catch (e) {
      console.warn("Error parsing custom properties:", e);
    }

    // Update custom properties with start and end times
    const updatedCustomProps = {
      ...customProps,
      start_time: segment.startTime || null,
      end_time: segment.endTime || null,
    };

    // Update the segment
    const updatedSegment = await db.layout_segments.update({
      where: { id: segment.id },
      data: {
        name: segment.name,
        type: segment.type,
        description: segment.description,
        duration: segment.duration,
        order: segment.order,
        custom_properties: updatedCustomProps,
      },
    });

    // Update the total duration in the layout
    const allSegments = await db.layout_segments.findMany({
      where: {
        layout: {
          event_id: parseInt(eventId),
        },
      },
    });

    const totalDuration = allSegments.reduce(
      (total, segment) => total + segment.duration,
      0
    );

    await db.event_layout.updateMany({
      where: { event_id: parseInt(eventId) },
      data: { total_duration: totalDuration },
    });

    // Format the response to include start and end times
    const formattedSegment = {
      ...updatedSegment,
      startTime: updatedCustomProps.start_time || "",
      endTime: updatedCustomProps.end_time || "",
    };

    return { success: true, segment: formattedSegment };
  } catch (error) {
    console.error("Error updating segment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update segment",
    };
  }
}

// Add a new layout segment
export async function addLayoutSegment(
  eventId: string,
  segment: Omit<LayoutSegment, "id">
) {
  try {
    // Get the layout for this event
    const layout = await db.event_layout.findFirst({
      where: { event_id: parseInt(eventId) },
    });

    if (!layout) {
      return { success: false, error: "Layout not found" };
    }

    // Create custom properties with start and end times
    const customProps = {
      start_time: segment.startTime || null,
      end_time: segment.endTime || null,
    };

    // Create the new segment
    const newSegment = await db.layout_segments.create({
      data: {
        layout_id: layout.id,
        name: segment.name,
        type: segment.type,
        description: segment.description,
        duration: segment.duration,
        order: segment.order,
        custom_properties: customProps,
      },
    });

    // Update the total duration
    await db.event_layout.update({
      where: { id: layout.id },
      data: { total_duration: layout.total_duration + segment.duration },
    });

    return {
      success: true,
      newSegment: {
        id: newSegment.id.toString(),
        name: newSegment.name,
        type: newSegment.type as any,
        description: newSegment.description,
        duration: newSegment.duration,
        order: newSegment.order,
        startTime: customProps.start_time || "",
        endTime: customProps.end_time || "",
      },
    };
  } catch (error) {
    console.error("Error adding segment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add segment",
    };
  }
}

// Delete a layout segment
export async function deleteLayoutSegment(eventId: string, segmentId: string) {
  try {
    // Get the segment to find its duration
    const segment = await db.layout_segments.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      return { success: false, error: "Segment not found" };
    }

    // Delete the segment
    await db.layout_segments.delete({
      where: { id: segmentId },
    });

    // Update the total duration in the layout
    const layout = await db.event_layout.findFirst({
      where: { event_id: parseInt(eventId) },
    });

    if (layout) {
      await db.event_layout.update({
        where: { id: layout.id },
        data: { total_duration: layout.total_duration - segment.duration },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting segment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete segment",
    };
  }
}

// Generate script from layout
export async function generateScriptFromLayout(eventId: string) {
  try {
    // Get the event and its layout
    const event = await db.events.findUnique({
      where: { event_id: parseInt(eventId) },
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

    // Generate script segments based on layout segments
    const scriptSegments = [];

    for (const layoutSegment of event.layout.segments) {
      let scriptContent = "";

      // Generate script content based on segment type
      switch (layoutSegment.type) {
        case "introduction":
          scriptContent = `Ladies and gentlemen, welcome to ${
            event.title
          }! I'm your AI host for today's ${event.event_type.toLowerCase()}. We're excited to have you all here for what promises to be an engaging and informative event. ${
            event.description
              ? `Today, we'll be focusing on ${event.description}.`
              : ""
          } Let's get started!`;
          break;

        case "agenda":
          scriptContent = `Let me walk you through today's agenda. We have a packed schedule with valuable content planned for you. ${event.layout.segments.length} segments are planned, totaling approximately ${event.layout.total_duration} minutes. We'll have breaks in between to allow you to network and refresh.`;
          break;

        case "keynote":
          scriptContent = `It's my pleasure to introduce our keynote speaker for today. They bring a wealth of experience and insights that I'm sure you'll find valuable. Please join me in welcoming our distinguished speaker to the stage!`;
          break;

        case "q_and_a":
          scriptContent = `We'll now open the floor for questions. If you have a question, please raise your hand or use the Q&A feature in the app. We'll try to address as many questions as possible in the time we have available.`;
          break;

        case "break":
          // Extract start and end times from custom_properties
          const breakProps =
            (layoutSegment.custom_properties as Record<string, any>) || {};
          const breakEndTime = breakProps.end_time || "";

          scriptContent = `We'll now take a short break for ${
            layoutSegment.duration
          } minutes. Please feel free to stretch, grab a refreshment, and network with fellow attendees. ${
            breakEndTime ? `We'll resume promptly at ${breakEndTime}.` : ""
          }`;
          break;

        case "conclusion":
          scriptContent = `As we come to the end of our ${event.event_type.toLowerCase()}, I want to thank you all for your active participation and engagement. It's been a pleasure hosting you today. We hope you found the content valuable and look forward to seeing you at future events!`;
          break;

        case "presentation":
          // Extract start and end times from custom_properties
          const presentationProps =
            (layoutSegment.custom_properties as Record<string, any>) || {};
          const presentationStartTime = presentationProps.start_time || "";
          const presentationEndTime = presentationProps.end_time || "";

          scriptContent = `Next up, we have a presentation on ${
            layoutSegment.name
          }. ${
            presentationStartTime
              ? `Starting at ${presentationStartTime}, `
              : ""
          }this segment will cover ${
            layoutSegment.description
          } and will last approximately ${layoutSegment.duration} minutes${
            presentationEndTime ? ` until ${presentationEndTime}` : ""
          }. Please give your full attention to our presenter.`;
          break;

        case "discussion":
          // Extract start and end times from custom_properties
          const discussionProps =
            (layoutSegment.custom_properties as Record<string, any>) || {};
          const discussionStartTime = discussionProps.start_time || "";
          const discussionEndTime = discussionProps.end_time || "";

          scriptContent = `Now, let's engage in a discussion about ${
            layoutSegment.name
          }. ${
            discussionStartTime ? `Starting at ${discussionStartTime}, ` : ""
          }we encourage everyone to share their thoughts and perspectives. ${
            discussionEndTime
              ? `We'll wrap up this discussion at ${discussionEndTime}. `
              : ""
          }Remember, there are no wrong answers, and all viewpoints are valuable to our collective learning.`;
          break;

        case "demo":
          // Extract start and end times from custom_properties
          const demoProps =
            (layoutSegment.custom_properties as Record<string, any>) || {};
          const demoStartTime = demoProps.start_time || "";
          const demoEndTime = demoProps.end_time || "";

          scriptContent = `We're now moving to a demonstration of ${
            layoutSegment.name
          }. ${
            demoStartTime ? `Starting at ${demoStartTime}, ` : ""
          }this will give you a practical understanding of ${
            layoutSegment.description
          }. ${
            demoEndTime
              ? `This demonstration will conclude at ${demoEndTime}. `
              : ""
          }Please observe carefully, and we'll have time for questions afterward.`;
          break;

        default:
          // Extract start and end times from custom_properties
          const defaultProps =
            (layoutSegment.custom_properties as Record<string, any>) || {};
          const defaultStartTime = defaultProps.start_time || "";
          const defaultEndTime = defaultProps.end_time || "";

          scriptContent = `Next up is our ${layoutSegment.name} segment. ${
            defaultStartTime ? `Starting at ${defaultStartTime}, ` : ""
          }${layoutSegment.description} This will last approximately ${
            layoutSegment.duration
          } minutes${defaultEndTime ? ` until ${defaultEndTime}` : ""}.`;
      }

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
    }

    return { success: true, segments: scriptSegments };
  } catch (error) {
    console.error("Error generating script:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate script",
    };
  }
}

// Finalize event
export async function finalizeEvent(
  eventId: string,
  options?: { skipTTS?: boolean }
) {
  try {
    // Check if the skip_tts field exists in the schema
    // If not, we'll just update the status
    const event = await db.events.update({
      where: { event_id: parseInt(eventId) },
      data: {
        status: "ready",
        // Store skipTTS preference in the event_settings JSON field
        event_settings: {
          skip_tts: options?.skipTTS === true,
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);
    return { success: true, event };
  } catch (error) {
    console.error("Error finalizing event:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to finalize event",
    };
  }
}

/**
 * Generate a voice preview based on voice settings
 * This is used in the event creation form to let users hear how their selected voice will sound
 */
export async function getVoicePreview(voiceSettings: {
  voice?: string;
  accent?: string;
  style?: string;
  rate?: number;
  pitch?: number;
}) {
  try {
    // In a production environment, this would call a TTS service like Google Cloud TTS
    // For now, we'll simulate the API call and return a mock audio URL

    console.log("Generating voice preview with settings:", voiceSettings);

    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response - in a real implementation, this would be a URL to an audio file
    // generated by a TTS service
    const previewUrl = `https://storage.googleapis.com/mock-tts-samples/preview_${
      voiceSettings.voice || "default"
    }.mp3`;

    return {
      success: true,
      previewUrl,
      message: "Voice preview generated successfully",
    };
  } catch (error) {
    console.error("Error generating voice preview:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate voice preview",
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

/**
 * Get a specific event by ID
 * This is more efficient than fetching all events when we only need one
 */
export async function getEventById(eventId: string): Promise<{
  success: boolean;
  event?: EventData;
  error?: string;
}> {
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

    // Get the specific event from the database with all necessary relations
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      include: {
        segments: true, // Include script segments
        layout: {
          include: {
            segments: true, // Include layout segments
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Parse the voice settings from JSON if needed
    const voiceSettings =
      typeof event.voice_settings === "string"
        ? JSON.parse(event.voice_settings as string)
        : event.voice_settings;

    // Format the event layout if it exists
    let formattedLayout: EventLayout | null = null;
    if (event.layout) {
      formattedLayout = {
        id: event.layout.id,
        eventId: event.layout.event_id,
        totalDuration: event.layout.total_duration,
        lastUpdated: event.layout.updated_at.toISOString(),
        segments: event.layout.segments.map((segment: any) => {
          // Extract start and end times from custom_properties
          const customProps =
            (segment.custom_properties as Record<string, any>) || {};

          return {
            id: segment.id.toString(),
            name: segment.name,
            type: segment.type,
            description: segment.description,
            duration: segment.duration,
            order: segment.order,
            startTime: customProps.start_time || "",
            endTime: customProps.end_time || "",
          };
        }),
      };
    }

    // Process segments to generate presigned URLs for audio files
    const segmentsWithPresignedUrls = await Promise.all(
      (event.segments || []).map(async (segment: any) => {
        let presignedAudioUrl = null;

        // Only generate presigned URL if audio_url exists
        if (segment.audio_url) {
          try {
            // Generate a presigned URL with 24 hour expiration
            presignedAudioUrl = await getPresignedUrl(
              segment.audio_url,
              24 * 3600
            );
            console.log(`Generated presigned URL for segment ${segment.id}`);
          } catch (error) {
            console.error(
              `Error generating presigned URL for segment ${segment.id}:`,
              error
            );
            // Continue without the presigned URL if there's an error
          }
        }

        return {
          id: segment.id,
          type: segment.segment_type,
          content: segment.content,
          status: (segment.status || "draft") as
            | "draft"
            | "editing"
            | "generating"
            | "generated",
          timing: segment.timing || 0,
          order: segment.order,
          audio_url: segment.audio_url, // Keep the original S3 key
          audio: presignedAudioUrl, // Add the presigned URL
          presentationSlide: null,
        };
      })
    );

    // Format the event data for the client
    const formattedEvent: EventData = {
      id: String(event.event_id),
      name: event.title,
      type: event.event_type,
      date: event.event_date
        ? event.event_date.toISOString().split("T")[0]
        : "Not specified",
      location: event.location,
      description: event.description,
      voiceSettings: voiceSettings || {
        type: "Professional",
        language: event.language || "English",
      },
      scriptSegments: segmentsWithPresignedUrls,
      layout: formattedLayout,
      createdAt: event.created_at
        ? event.created_at.toISOString()
        : new Date().toISOString(),
      status: event.status,
      hasPresentation: !!event.has_presentation,
      playCount: event.play_count || 0,
    };

    return {
      success: true,
      event: formattedEvent,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    };
  }
}

/**
 * Delete an event and all its related resources
 * This includes:
 * 1. Script segments and their audio files in S3
 * 2. Layout segments
 * 3. Event layout
 * 4. The event itself
 * 5. Any chat messages associated with the event
 */
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

export async function deleteEvent(eventId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
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

    console.log(`Deleting event with ID: ${eventIdNum}`);

    // Get the event with all related resources
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only delete their own events
      },
      include: {
        segments: true, // Include script segments
        layout: {
          include: {
            segments: true, // Include layout segments
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Initialize S3 client for deleting audio files
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || "rhymeai-audio";

    // 1. Delete script segments and their audio files
    if (event.segments && event.segments.length > 0) {
      console.log(
        `Deleting ${event.segments.length} script segments and their audio files`
      );

      // Delete audio files from S3
      for (const segment of event.segments) {
        if (segment.audio_url) {
          try {
            // Extract the S3 key from the audio URL
            // The audio URL might be a presigned URL or a direct S3 URL
            // We need to extract just the key part
            let audioKey = "";

            if (segment.audio_url.includes("audio/event-")) {
              // If it's a path pattern we recognize
              const keyMatch = segment.audio_url.match(
                /audio\/event-\d+\/segment-[^?]+/
              );
              if (keyMatch) {
                audioKey = keyMatch[0];
              }
            } else {
              // Use the audio_url directly as the key if it doesn't match our pattern
              // This assumes audio_url contains the S3 key
              audioKey = segment.audio_url;
            }

            if (audioKey) {
              console.log(`Deleting audio file with key: ${audioKey}`);

              const deleteCommand = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: audioKey,
              });

              await s3Client.send(deleteCommand);
              console.log(`Successfully deleted audio file: ${audioKey}`);
            } else {
              console.warn(
                `Could not determine S3 key for audio URL: ${segment.audio_url}`
              );
            }
          } catch (error) {
            console.error(
              `Error deleting audio file for segment ${segment.id}:`,
              error
            );
            // Continue with deletion even if S3 deletion fails
          }
        }
      }

      // Delete script segments from database
      await db.script_segments.deleteMany({
        where: {
          event_id: eventIdNum,
        },
      });

      console.log(
        `Successfully deleted script segments for event ${eventIdNum}`
      );
    }

    // 2. Delete layout segments
    if (
      event.layout &&
      event.layout.segments &&
      event.layout.segments.length > 0
    ) {
      console.log(`Deleting ${event.layout.segments.length} layout segments`);

      await db.layout_segments.deleteMany({
        where: {
          layout_id: event.layout.id,
        },
      });

      console.log(
        `Successfully deleted layout segments for event ${eventIdNum}`
      );
    }

    // 3. Delete event layout
    if (event.layout) {
      console.log(`Deleting layout for event ${eventIdNum}`);

      await db.event_layout.delete({
        where: {
          id: event.layout.id,
        },
      });

      console.log(`Successfully deleted layout for event ${eventIdNum}`);
    }

    // 4. Delete chat messages associated with the event
    console.log(`Deleting chat messages for event ${eventIdNum}`);

    await db.chat_messages.deleteMany({
      where: {
        event_id: eventIdNum,
      },
    });

    console.log(`Successfully deleted chat messages for event ${eventIdNum}`);

    // 5. Finally, delete the event itself
    console.log(`Deleting event ${eventIdNum}`);

    await db.events.delete({
      where: {
        event_id: eventIdNum,
      },
    });

    console.log(`Successfully deleted event ${eventIdNum}`);

    // Revalidate the dashboard page to reflect the changes
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Event and all related resources successfully deleted",
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}

/**
 *  listing all audio files for a specific event
 */

export async function getEventScriptWithPresignedUrls(
  eventId: string
): Promise<{ success: boolean; event?: EventData; error?: string }> {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      include: {
        segments: true, // Include script segments
      },
    });
    if (!event) {
      return { success: false, error: "Event not found" };
    }
    const segmentsWithPresignedUrls = await Promise.all(
      (event.segments || []).map(async (segment: any) => {
        let presignedAudioUrl = null;
        if (segment.audio_url) {
          try {
            presignedAudioUrl = await getPresignedUrl(
              segment.audio_url,
              24 * 3600
            );
          } catch (error) {
            console.error(
              `Error generating presigned URL for segment ${segment.id}:`,
              error
            );
          }
        }
        return {
          id: segment.id,
          type: segment.segment_type,
          content: segment.content,
          status: (segment.status || "draft") as
            | "draft"
            | "editing"
            | "generating"
            | "generated",
          timing: segment.timing || 0,
          order: segment.order,
          audio: presignedAudioUrl,
          presentationSlide: null,
        };
      })
    );
    return {
      success: true,
      event: {
        id: String(event.event_id),
        name: event.title,
        type: event.event_type,
        date: event.event_date
          ? event.event_date.toISOString().split("T")[0]
          : "Not specified",
        location: event.location,
        description: event.description,
        voiceSettings: {
          type: "Professional",
          language: event.language || "English",
        },
        scriptSegments: segmentsWithPresignedUrls,
        createdAt: event.created_at
          ? event.created_at.toISOString()
          : new Date().toISOString(),
        status: event.status,
        hasPresentation: !!event.has_presentation,
        playCount: event.play_count || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    };
  }
}
