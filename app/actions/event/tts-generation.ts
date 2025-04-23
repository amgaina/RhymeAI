"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Generate TTS for all script segments of an event
 */
export async function generateTTSForAllSegments(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get all script segments for the event
    const segments = await db.script_segments.findMany({
      where: { 
        event_id: eventIdNum,
        // Only process segments that don't have audio yet or failed
        OR: [
          { audio_url: null },
          { status: "draft" },
          { status: "editing" },
          { status: "failed" }
        ]
      },
      orderBy: { order: "asc" },
    });

    if (segments.length === 0) {
      return {
        success: true,
        message: "No segments need TTS generation",
        processedCount: 0,
      };
    }

    // Get the event to fetch voice settings
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { voice_settings: true },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Process each segment
    const results = await Promise.all(
      segments.map(async (segment) => {
        try {
          // Mark segment as generating
          await db.script_segments.update({
            where: { id: segment.id },
            data: { status: "generating" },
          });

          // In a real implementation, you would call your TTS API here
          // For now, we'll simulate TTS generation with a mock URL
          const audioUrl = `https://api.example.com/audio/segment-${segment.id}-${Date.now()}.mp3`;
          
          // Calculate approximate duration based on content length
          // In a real implementation, you would get the actual duration from the TTS service
          const approximateDuration = Math.ceil(segment.content.length / 20); // ~20 chars per second
          
          // Update the segment with the audio URL and status
          await db.script_segments.update({
            where: { id: segment.id },
            data: {
              audio_url: audioUrl,
              status: "generated",
              timing: approximateDuration,
            },
          });

          return {
            segmentId: segment.id,
            success: true,
            audioUrl,
          };
        } catch (error) {
          console.error(`Error generating TTS for segment ${segment.id}:`, error);
          
          // Mark segment as failed
          await db.script_segments.update({
            where: { id: segment.id },
            data: { status: "failed" },
          });

          return {
            segmentId: segment.id,
            success: false,
            error: error instanceof Error ? error.message : "TTS generation failed",
          };
        }
      })
    );

    // Count successful generations
    const successCount = results.filter((r) => r.success).length;

    // Update the event status if all segments are generated
    const allSegmentsCount = await db.script_segments.count({
      where: { event_id: eventIdNum },
    });
    
    const generatedSegmentsCount = await db.script_segments.count({
      where: { 
        event_id: eventIdNum,
        status: "generated"
      },
    });

    if (generatedSegmentsCount === allSegmentsCount) {
      await db.events.update({
        where: { event_id: eventIdNum },
        data: {
          status: "ready",
          updated_at: new Date(),
        },
      });
    }

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: true,
      message: `Generated TTS for ${successCount}/${segments.length} segments`,
      processedCount: segments.length,
      successCount,
      results,
    };
  } catch (error) {
    console.error("Error generating TTS for all segments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate TTS for segments",
    };
  }
}

/**
 * Generate TTS for a single script segment
 */
export async function generateTTSForSegment(segmentId: number) {
  try {
    // Get the script segment
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      return {
        success: false,
        error: "Script segment not found",
      };
    }

    // Get the event to fetch voice settings
    const event = await db.events.findUnique({
      where: { event_id: segment.event_id },
      select: { voice_settings: true },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Mark segment as generating
    await db.script_segments.update({
      where: { id: segmentId },
      data: { status: "generating" },
    });

    try {
      // In a real implementation, you would call your TTS API here
      // For now, we'll simulate TTS generation with a mock URL
      const audioUrl = `https://api.example.com/audio/segment-${segmentId}-${Date.now()}.mp3`;
      
      // Calculate approximate duration based on content length
      // In a real implementation, you would get the actual duration from the TTS service
      const approximateDuration = Math.ceil(segment.content.length / 20); // ~20 chars per second
      
      // Update the segment with the audio URL and status
      await db.script_segments.update({
        where: { id: segmentId },
        data: {
          audio_url: audioUrl,
          status: "generated",
          timing: approximateDuration,
        },
      });

      // Check if all segments are generated
      const allSegmentsCount = await db.script_segments.count({
        where: { event_id: segment.event_id },
      });
      
      const generatedSegmentsCount = await db.script_segments.count({
        where: { 
          event_id: segment.event_id,
          status: "generated"
        },
      });

      if (generatedSegmentsCount === allSegmentsCount) {
        await db.events.update({
          where: { event_id: segment.event_id },
          data: {
            status: "ready",
            updated_at: new Date(),
          },
        });
      }

      // Revalidate paths
      revalidatePath(`/events/${segment.event_id}`);
      revalidatePath(`/event/${segment.event_id}`);
      revalidatePath(`/event/${segment.event_id}/script`);

      return {
        success: true,
        segmentId,
        audioUrl,
        message: "TTS generated successfully",
      };
    } catch (error) {
      console.error(`Error generating TTS for segment ${segmentId}:`, error);
      
      // Mark segment as failed
      await db.script_segments.update({
        where: { id: segmentId },
        data: { status: "failed" },
      });

      return {
        success: false,
        segmentId,
        error: error instanceof Error ? error.message : "TTS generation failed",
      };
    }
  } catch (error) {
    console.error(`Error generating TTS for segment ${segmentId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate TTS for segment",
    };
  }
}
