"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * Updates presentation slide for a segment
 */
export async function updatePresentationSlide(
  segmentId: number,
  slidePath: string
) {
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

    // Get current presentation slides
    const currentSlides = (segment.event.presentation_slides as any[]) || [];

    // Find if this segment already has a slide
    const slideIndex = currentSlides.findIndex(
      (slide: any) => slide.segmentId === segmentId
    );

    if (slideIndex >= 0) {
      // Update existing slide
      currentSlides[slideIndex].slidePath = slidePath;
    } else {
      // Add new slide
      currentSlides.push({
        segmentId,
        slidePath,
        thumbnailUrl: `${slidePath}-thumb.jpg`, // Mock thumbnail generation
      });
    }

    // Update the event with the updated slides
    await db.events.update({
      where: { event_id: segment.event_id },
      data: {
        presentation_slides: currentSlides as any,
        has_presentation: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${segment.event_id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update presentation slide:", error);
    return { success: false, error: "Failed to update presentation slide" };
  }
}

/**
 * Generates presentation slides for all segments
 */
export async function generatePresentationSlides(eventId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Find the event with segments
    const event = await db.events.findUnique({
      where: {
        event_id: eventId,
        user_id: userId,
      },
      include: {
        segments: true,
      },
    });

    if (!event) {
      throw new Error("Event not found or access denied");
    }

    // Generate mock slides for each segment
    const slides = event.segments.map((segment) => ({
      segmentId: segment.id,
      slidePath: `/slides/event-${eventId}/slide-${segment.id}.jpg`,
      thumbnailUrl: `/slides/event-${eventId}/slide-${segment.id}-thumb.jpg`,
    }));

    // Update the event with the slides
    await db.events.update({
      where: { event_id: eventId },
      data: {
        presentation_slides: slides as any,
        has_presentation: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/event/${eventId}`);

    return { success: true, slides };
  } catch (error) {
    console.error("Failed to generate presentation slides:", error);
    return { success: false, error: "Failed to generate presentation slides" };
  }
}
