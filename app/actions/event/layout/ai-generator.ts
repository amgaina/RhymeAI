"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { EventLayout, LayoutSegment, SegmentType } from "@/types/layout";
import { revalidatePath } from "next/cache";

/**
 * Generate an event layout using AI based on event details
 */
export async function generateAIEventLayout(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get event details for context
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: {
        event_id: true,
        title: true,
        description: true,
        event_type: true,
        expected_attendees: true,
        location: true,
        event_date: true,
        start_time: true,
        end_time: true,
        total_duration: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    console.log(`Generating AI event layout for: ${eventId}`);

    // Get duration from event start/end times if available, otherwise let AI determine it
    let totalDuration: number | null = null;

    // If event has start_time and end_time, calculate duration
    if (event.start_time && event.end_time) {
      const startTime = new Date(
        `1970-01-01T${event.start_time.toISOString().split("T")[1]}`
      );
      const endTime = new Date(
        `1970-01-01T${event.end_time.toISOString().split("T")[1]}`
      );

      // Calculate duration in minutes
      totalDuration = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      // If end time is before start time, assume it's the next day
      if (totalDuration < 0) {
        totalDuration += 24 * 60; // Add 24 hours in minutes
      }

      console.log(
        `Calculated duration from event times: ${totalDuration} minutes`
      );
    } else if (event.total_duration) {
      // If event has a total_duration field, use that (convert from seconds to minutes if needed)
      totalDuration =
        typeof event.total_duration === "number"
          ? event.total_duration > 1000
            ? Math.round(event.total_duration / 60)
            : event.total_duration
          : null;
      console.log(`Using event's total_duration: ${totalDuration} minutes`);
    }

    // Generate prompt for AI
    const prompt = generateLayoutPrompt(event, totalDuration);

    // Call AI to generate layout
    const { text: layoutResponse } = await generateText({
      model: google("gemini-pro", {}),
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    // Parse the AI response to extract layout segments
    const layoutData = parseAIResponse(layoutResponse);

    if (!layoutData.segments || layoutData.segments.length === 0) {
      console.error("Failed to parse AI response into layout segments");
      return {
        success: false,
        error: "Failed to generate layout segments from AI response",
      };
    }

    // Calculate total duration from segments if not provided
    if (!totalDuration && layoutData.segments.length > 0) {
      // Sum up durations from all segments
      const segmentDurations = layoutData.segments
        .map((segment) => segment.duration || 0)
        .filter((duration) => duration > 0);

      if (segmentDurations.length > 0) {
        totalDuration = segmentDurations.reduce(
          (sum, duration) => sum + duration,
          0
        );
        console.log(
          `Calculated total duration from segments: ${totalDuration} minutes`
        );
      } else {
        // Default to 60 minutes if no durations available
        totalDuration = 60;
        console.log(
          `No duration information available, defaulting to ${totalDuration} minutes`
        );
      }
    } else if (!totalDuration) {
      // Default to 60 minutes if no segments or duration
      totalDuration = 60;
      console.log(
        `No duration information available, defaulting to ${totalDuration} minutes`
      );
    }

    // Create layout segments with proper IDs and structure
    const layoutSegments: LayoutSegment[] = layoutData.segments.map(
      (segment, index) => {
        // Calculate segment duration if not provided
        let segmentDuration = segment.duration;
        if (!segmentDuration || segmentDuration <= 0) {
          // If we have a total duration, divide it evenly among segments without durations
          segmentDuration = Math.round(
            totalDuration! / layoutData.segments.length
          );
        }

        return {
          id: uuidv4(),
          name: segment.name,
          type: validateSegmentType(segment.type),
          description: segment.description || `${segment.name} segment`,
          duration: segmentDuration,
          order: segment.order || index + 1,
          customProperties: segment.custom_properties || {},
        };
      }
    );

    // First create or update the relational layout in the database
    const layout = await db.event_layout.upsert({
      where: {
        event_id: eventIdNum,
      },
      update: {
        total_duration: totalDuration!, // We've ensured totalDuration is not null by this point
        layout_version: { increment: 1 },
        updated_at: new Date(),
        last_generated_by: "ai-gemini-pro",
        chat_context: layoutData.reasoning || null,
      },
      create: {
        event_id: eventIdNum,
        total_duration: totalDuration!, // We've ensured totalDuration is not null by this point
        last_generated_by: "ai-gemini-pro",
        chat_context: layoutData.reasoning || null,
      },
    });

    // Now create the full event layout structure using the layout.id from database
    const eventLayout: EventLayout = {
      id: layout.id,
      eventId: eventIdNum,
      segments: layoutSegments,
      totalDuration: totalDuration!, // We've ensured totalDuration is not null by this point
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    // Delete any existing segments for this layout
    await db.layout_segments.deleteMany({
      where: {
        layout_id: layout.id,
      },
    });

    // Create new segments
    const createdSegments = await Promise.all(
      layoutSegments.map((segment) =>
        db.layout_segments.create({
          data: {
            layout_id: layout.id,
            name: segment.name,
            type: segment.type,
            description: segment.description,
            duration: segment.duration,
            order: segment.order,
            custom_properties: segment.customProperties || {},
          },
        })
      )
    );

    // Also store the layout as JSON for backward compatibility
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        event_layout: JSON.parse(JSON.stringify(eventLayout)) as any,
        updated_at: new Date(),
      },
    });

    // Update event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "layout_ready",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);

    // Map the database segments to the expected format
    const formattedSegments = createdSegments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      type: segment.type as SegmentType,
      description: segment.description,
      duration: segment.duration,
      order: segment.order,
    }));

    // Create the response layout with the actual segments from the database
    const responseLayout: EventLayout = {
      id: layout.id,
      eventId: eventIdNum,
      segments: formattedSegments,
      totalDuration: layout.total_duration,
      lastUpdated: layout.updated_at.toISOString(),
      version: layout.layout_version,
    };

    return {
      success: true,
      layout: responseLayout,
      message: "AI-generated event layout created successfully",
      aiContext:
        layoutData.reasoning || "Layout generated based on event details",
    };
  } catch (error) {
    console.error("Error generating AI event layout:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate AI event layout",
    };
  }
}

/**
 * Generate a system prompt for the AI
 */
function getSystemPrompt(): string {
  return `You are an expert event planner specializing in creating detailed, realistic event layouts.
Your task is to create a structured event layout with appropriate segments and timing that would be used in a real-world event.

For each event, you should:
1. Deeply analyze the event type, purpose, audience, and any specific requirements
2. Create a logical, professional flow with appropriate segments based on industry best practices
3. Allocate realistic time for each segment (in minutes) based on real-world event planning standards
4. Ensure the layout is balanced, practical, and follows standard event planning conventions
5. Include specific time slots (like "9:00-9:30 AM") for each segment when appropriate
6. Be very specific with segment names and descriptions - avoid generic terms

Your response MUST be in JSON format with the following structure:
{
  "segments": [
    {
      "name": "Specific segment name with time if appropriate (e.g., '9:00-9:30 AM: Registration & Coffee')",
      "type": "segment_type",
      "description": "Detailed description of what happens during this segment",
      "duration": minutes_as_number,
      "order": segment_order_number,
      "custom_properties": {
        "start_time": "HH:MM AM/PM format if applicable",
        "end_time": "HH:MM AM/PM format if applicable",
        "speakers": "Names of speakers if applicable",
        "notes": "Any special notes or requirements for this segment"
      }
    }
  ],
  "reasoning": "Detailed explanation of your layout design choices and how they align with the event's goals"
}

Valid segment types include: introduction, keynote, panel, break, q_and_a, conclusion, presentation, demo, theory, practical, group_work, agenda, discussion, action_items, main_content.

Make sure all durations add up to the total event duration. Be creative but realistic - create a layout that could be used for a real event.`;
}

/**
 * Generate a prompt for the AI based on event details
 */
function generateLayoutPrompt(
  event: any,
  totalDuration: number | null
): string {
  // Calculate start and end times based on event date if available
  let timeContext = "";
  let durationText = "";

  if (event.start_time && event.end_time) {
    // Format times for display
    const formatTime = (time: Date) => {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    const startTimeStr = formatTime(event.start_time);
    const endTimeStr = formatTime(event.end_time);

    timeContext = `
The event is scheduled for ${new Date(event.event_date).toLocaleDateString()}.
The event runs from ${startTimeStr} to ${endTimeStr}.
Please include specific time slots for each segment in the format "HH:MM-HH:MM AM/PM".`;
  } else if (event.event_date) {
    const eventDate = new Date(event.event_date);
    timeContext = `
The event is scheduled for ${eventDate.toLocaleDateString()}.
Please include specific time slots for each segment in the format "HH:MM-HH:MM AM/PM".`;
  }

  // Set duration text based on available information
  if (totalDuration) {
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    if (hours > 0) {
      durationText = `The event will last approximately ${totalDuration} minutes (${hours} hour${
        hours !== 1 ? "s" : ""
      } and ${minutes} minute${minutes !== 1 ? "s" : ""}) in total.`;
    } else {
      durationText = `The event will last approximately ${totalDuration} minutes in total.`;
    }
  } else {
    durationText =
      "Please determine an appropriate duration for this type of event based on industry standards and the event details.";
  }

  // Extract event type specifics
  const eventTypeDetails = getEventTypeSpecifics(event.event_type);

  return `
Create a detailed, professional event layout for "${event.title}" which is a ${
    event.event_type
  }.
${durationText}
${timeContext}

EVENT DETAILS:
${event.description ? `Description: ${event.description}` : ""}
${
  event.expected_attendees
    ? `Expected attendees: ${event.expected_attendees}`
    : ""
}
${event.location ? `Location: ${event.location}` : ""}

EVENT TYPE SPECIFICS:
${eventTypeDetails}

REQUIREMENTS:
1. Create a comprehensive, realistic layout that follows industry standards for this type of event
2. Include specific, descriptive names for each segment (not generic placeholders)
3. Provide detailed descriptions explaining what happens during each segment
4. Allocate appropriate time for each segment based on real-world event planning
5. Ensure a logical flow that maximizes engagement and achieves the event's goals
6. Include time slots in the segment names when appropriate (e.g., "9:00-9:30 AM: Registration")
7. Add any special notes or requirements for each segment in the custom_properties

Respond with a JSON object containing the segments array and your detailed reasoning.`;
}

/**
 * Get specific guidance based on event type
 */
function getEventTypeSpecifics(eventType: string): string {
  const type = eventType?.toLowerCase() || "";

  if (type.includes("conference")) {
    return `
For conferences, consider including:
- Registration/check-in period at the beginning
- Opening keynote or welcome address
- Multiple session tracks if appropriate
- Networking breaks between sessions
- Lunch break for full-day conferences
- Panel discussions on relevant topics
- Closing keynote or summary session`;
  } else if (type.includes("workshop")) {
    return `
For workshops, consider including:
- Welcome and introduction to set expectations
- Ice-breaker or participant introductions if appropriate
- Theoretical background/context setting
- Hands-on activities and exercises
- Short breaks to maintain energy
- Group discussions or collaborative work
- Reflection and takeaways session
- Action planning for post-workshop implementation`;
  } else if (type.includes("webinar")) {
    return `
For webinars, consider including:
- Pre-webinar technical check period
- Introduction and housekeeping announcements
- Main presentation segments
- Demonstrations or case studies
- Q&A segments (possibly throughout or at the end)
- Polls or interactive elements to engage participants
- Summary and next steps/call to action`;
  } else if (type.includes("hackathon") || type.includes("ctf")) {
    return `
For hackathons or CTF events, consider including:
- Registration and team formation period
- Opening ceremony with rules explanation
- Multiple coding/hacking sessions
- Mentoring or support periods
- Meals and energy breaks
- Status updates or check-in points
- Final submission deadline
- Judging period
- Awards ceremony and closing`;
  } else if (type.includes("corporate") || type.includes("meeting")) {
    return `
For corporate events or meetings, consider including:
- Welcome and agenda overview
- Status updates or department reports
- Strategic discussion segments
- Decision-making periods
- Action item assignments
- Next steps and follow-up planning`;
  } else {
    return `
For this type of event, consider the typical flow and components that would be expected by attendees.
Include appropriate segments for introductions, main content delivery, interactive elements, breaks if needed, and a clear conclusion.
Ensure the timing aligns with industry standards for similar events.`;
  }
}

/**
 * Parse the AI response to extract layout segments
 */
function parseAIResponse(response: string): {
  segments: Array<{
    name: string;
    type: string;
    description?: string;
    duration?: number;
    order?: number;
    custom_properties?: Record<string, any>;
  }>;
  reasoning?: string;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const parsedData = JSON.parse(jsonStr);

      // Process segments to extract time information from names if present
      const processedSegments = Array.isArray(parsedData.segments)
        ? parsedData.segments.map(processSegmentTimeInfo)
        : [];

      return {
        segments: processedSegments,
        reasoning: parsedData.reasoning || undefined,
      };
    }

    // If no JSON found, try to parse a more free-form response
    const segments = [];
    const lines = response.split("\n");
    let currentSegment: any = null;
    let reasoning = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for segment headers with time information
      // Matches patterns like "9:00-9:30 AM: Registration" or "1. Welcome (9:00-9:15 AM)"
      const timeHeaderRegex =
        /^(?:\d+\.\s+)?([^(]*)(?:\(?((?:\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?\s*(?:AM|PM|am|pm)?))\)?)?:?\s*(.*)/;

      if (
        trimmedLine.match(/^\d+\.\s+.+/) ||
        trimmedLine.match(/^Segment\s+\d+:/i) ||
        trimmedLine.match(/^\d{1,2}:\d{2}/) ||
        trimmedLine.match(timeHeaderRegex)
      ) {
        // Save previous segment if exists
        if (currentSegment && currentSegment.name && currentSegment.type) {
          segments.push(currentSegment);
        }

        // Extract time information if present
        const timeMatch = trimmedLine.match(timeHeaderRegex);
        let segmentName = trimmedLine;
        let timeInfo = null;

        if (timeMatch) {
          // If we matched the time pattern, use the extracted groups
          const [_, namePrefix, time, nameSuffix] = timeMatch;
          segmentName = (namePrefix + " " + (nameSuffix || "")).trim();
          timeInfo = time;
        } else {
          // Otherwise just clean up the segment name
          segmentName = trimmedLine.replace(
            /^\d+\.\s+|^Segment\s+\d+:\s*/i,
            ""
          );
        }

        // Start new segment
        currentSegment = {
          name: segmentName,
          type: "main_content", // Default type
          description: "",
          duration: 0,
          order: segments.length + 1,
          custom_properties: timeInfo ? { time_slot: timeInfo } : {},
        };
      }
      // Check for segment properties
      else if (currentSegment && trimmedLine) {
        if (trimmedLine.match(/type:/i)) {
          currentSegment.type = trimmedLine
            .replace(/.*type:\s*/i, "")
            .trim()
            .toLowerCase();
        } else if (trimmedLine.match(/description:/i)) {
          currentSegment.description = trimmedLine
            .replace(/.*description:\s*/i, "")
            .trim();
        } else if (trimmedLine.match(/duration:/i)) {
          const durationMatch = trimmedLine.match(/(\d+)/);
          if (durationMatch) {
            currentSegment.duration = parseInt(durationMatch[1], 10);
          }
        } else if (trimmedLine.match(/start[_\s]*time:/i)) {
          const startTime = trimmedLine
            .replace(/.*start[_\s]*time:\s*/i, "")
            .trim();
          if (!currentSegment.custom_properties)
            currentSegment.custom_properties = {};
          currentSegment.custom_properties.start_time = startTime;
        } else if (trimmedLine.match(/end[_\s]*time:/i)) {
          const endTime = trimmedLine
            .replace(/.*end[_\s]*time:\s*/i, "")
            .trim();
          if (!currentSegment.custom_properties)
            currentSegment.custom_properties = {};
          currentSegment.custom_properties.end_time = endTime;
        } else if (trimmedLine.match(/speakers?:/i)) {
          const speakers = trimmedLine.replace(/.*speakers?:\s*/i, "").trim();
          if (!currentSegment.custom_properties)
            currentSegment.custom_properties = {};
          currentSegment.custom_properties.speakers = speakers;
        } else if (trimmedLine.match(/notes?:/i)) {
          const notes = trimmedLine.replace(/.*notes?:\s*/i, "").trim();
          if (!currentSegment.custom_properties)
            currentSegment.custom_properties = {};
          currentSegment.custom_properties.notes = notes;
        } else if (trimmedLine.match(/reasoning|rationale|explanation/i)) {
          reasoning = trimmedLine
            .replace(/.*reasoning:|.*rationale:|.*explanation:/i, "")
            .trim();
        } else if (currentSegment.description) {
          // Append to description if it already exists
          currentSegment.description += " " + trimmedLine;
        }
      }
    }

    // Add the last segment if exists
    if (currentSegment && currentSegment.name && currentSegment.type) {
      segments.push(currentSegment);
    }

    return {
      segments: segments.map(processSegmentTimeInfo),
      reasoning,
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return { segments: [] };
  }
}

/**
 * Process segment to extract time information from name if present
 */
function processSegmentTimeInfo(segment: any): any {
  // If segment already has custom_properties with time information, return as is
  if (
    segment.custom_properties &&
    (segment.custom_properties.start_time ||
      segment.custom_properties.end_time ||
      segment.custom_properties.time_slot)
  ) {
    return segment;
  }

  // Try to extract time information from the segment name
  // Matches patterns like "9:00-9:30 AM: Registration" or "Welcome (9:00-9:15 AM)"
  const timeRegex =
    /(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?\s*(?:AM|PM|am|pm)?)/;
  const timeMatch = segment.name.match(timeRegex);

  if (timeMatch) {
    const timeSlot = timeMatch[1];

    // Clean up the segment name by removing the time information
    const cleanName = segment.name
      .replace(timeRegex, "")
      .replace(/^\s*:\s*|\s*\(\s*\)\s*$|\s+$/, "")
      .trim();

    // Extract start and end times if possible
    const timeRangeRegex =
      /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?/;
    const timeRangeMatch = timeSlot.match(timeRangeRegex);

    if (!segment.custom_properties) {
      segment.custom_properties = {};
    }

    // Store the time slot
    segment.custom_properties.time_slot = timeSlot;

    // If we have a time range, extract start and end times
    if (timeRangeMatch) {
      const [_, startTime, endTime, period] = timeRangeMatch;
      segment.custom_properties.start_time =
        startTime + (period ? " " + period : "");
      segment.custom_properties.end_time =
        endTime + (period ? " " + period : "");

      // If we have start and end times, calculate duration in minutes if not already set
      if (!segment.duration || segment.duration === 0) {
        try {
          const duration = calculateDurationFromTimes(
            segment.custom_properties.start_time,
            segment.custom_properties.end_time
          );
          if (duration > 0) {
            segment.duration = duration;
          }
        } catch (e) {
          console.warn("Could not calculate duration from times:", e);
        }
      }
    }

    // Update the segment name to remove the time information
    segment.name = cleanName;
  }

  return segment;
}

/**
 * Calculate duration in minutes between two time strings
 */
function calculateDurationFromTimes(
  startTimeStr: string,
  endTimeStr: string
): number {
  try {
    // Normalize time strings
    const normalizeTime = (timeStr: string) => {
      // Add period if missing
      if (
        !timeStr.toLowerCase().includes("am") &&
        !timeStr.toLowerCase().includes("pm")
      ) {
        // Assume AM for times before 12, PM for times after
        const hour = parseInt(timeStr.split(":")[0], 10);
        timeStr += hour < 12 ? " AM" : " PM";
      }
      return timeStr;
    };

    const startTime = normalizeTime(startTimeStr);
    const endTime = normalizeTime(endTimeStr);

    // Parse times
    const [startHour, startMinutePart] = startTime.split(":");
    const [startMinute, startPeriod] = startMinutePart.split(/\s+/);

    const [endHour, endMinutePart] = endTime.split(":");
    const [endMinute, endPeriod] = endMinutePart.split(/\s+/);

    // Convert to 24-hour format
    let start24Hour = parseInt(startHour, 10);
    if (startPeriod && startPeriod.toLowerCase() === "pm" && start24Hour < 12) {
      start24Hour += 12;
    } else if (
      startPeriod &&
      startPeriod.toLowerCase() === "am" &&
      start24Hour === 12
    ) {
      start24Hour = 0;
    }

    let end24Hour = parseInt(endHour, 10);
    if (endPeriod && endPeriod.toLowerCase() === "pm" && end24Hour < 12) {
      end24Hour += 12;
    } else if (
      endPeriod &&
      endPeriod.toLowerCase() === "am" &&
      end24Hour === 12
    ) {
      end24Hour = 0;
    }

    // Calculate total minutes
    const startTotalMinutes = start24Hour * 60 + parseInt(startMinute, 10);
    const endTotalMinutes = end24Hour * 60 + parseInt(endMinute, 10);

    // Calculate duration
    let durationMinutes = endTotalMinutes - startTotalMinutes;

    // Handle crossing midnight
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    return durationMinutes;
  } catch (error) {
    console.error("Error calculating duration from times:", error);
    return 0;
  }
}

/**
 * Validate and normalize segment type
 */
function validateSegmentType(type: string): SegmentType {
  const normalizedType = type.toLowerCase().replace(/\s+/g, "_");

  const validTypes: SegmentType[] = [
    "introduction",
    "keynote",
    "panel",
    "break",
    "q_and_a",
    "conclusion",
    "presentation",
    "demo",
    "theory",
    "practical",
    "group_work",
    "agenda",
    "discussion",
    "action_items",
    "main_content",
  ];

  if (validTypes.includes(normalizedType as SegmentType)) {
    return normalizedType as SegmentType;
  }

  // Map common variations to valid types
  const typeMap: Record<string, SegmentType> = {
    welcome: "introduction",
    intro: "introduction",
    opening: "introduction",
    qa: "q_and_a",
    questions: "q_and_a",
    closing: "conclusion",
    summary: "conclusion",
    workshop: "practical",
    exercise: "practical",
    networking: "break",
    lecture: "presentation",
    talk: "presentation",
    demonstration: "demo",
    practice: "practical",
    discussion_panel: "panel",
    breakout: "group_work",
    planning: "action_items",
    content: "main_content",
  };

  return typeMap[normalizedType] || "main_content";
}
