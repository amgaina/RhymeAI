"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateAndUploadTTS,
  estimateTTSDuration,
  deleteEventAudio,
  deleteSegmentAudio,
  isTTSConfigured,
} from "@/lib/google-tts";
import { getPresignedUrl } from "@/lib/s3-utils";

/**
 * Generate TTS for all script segments of an event
 */
export async function generateTTSForAllSegments(eventId: string) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
    }

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
          { status: "failed" },
        ],
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

          // Generate TTS and upload to S3
          const s3Key = await generateAndUploadTTS(
            segment.id,
            eventIdNum,
            segment.content,
            event.voice_settings
          );

          // Generate a presigned URL with a longer expiration (24 hours)
          const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);

          // Extract voice settings parameters and validate them
          let speakingRate = 1.0;
          let pitch = 0;
          let volumeGainDb = 0;

          try {
            let settings: any = null;

            if (typeof event.voice_settings === "string") {
              settings = JSON.parse(event.voice_settings);
            } else if (
              typeof event.voice_settings === "object" &&
              event.voice_settings
            ) {
              settings = event.voice_settings;
            }

            if (settings) {
              // MC-like voice settings with more energy and presence

              // Extract and validate speaking rate (0.25 to 2.0)
              // Use a slightly faster rate for MC-style delivery (1.15-1.25 is good for MC)
              speakingRate = settings.speakingRate || 1.2;
              speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));

              // Extract and validate pitch (-20.0 to 20.0)
              // Slightly higher pitch for more animated, engaging presentation
              pitch = settings.pitch || 2.0;
              pitch = Math.max(-20.0, Math.min(20.0, pitch));

              // Extract and validate volume gain (-96.0 to 16.0)
              // Increase volume for better projection and presence
              volumeGainDb = settings.volumeGainDb || 3.5;
              volumeGainDb = Math.max(-96.0, Math.min(16.0, volumeGainDb));
            }
          } catch (error) {
            console.warn(
              "Error parsing voice settings, using default values:",
              error
            );
          }

          // Estimate duration based on content
          const estimatedDuration = estimateTTSDuration(
            segment.content,
            speakingRate
          );

          // Update the segment with the audio URL and status
          await db.script_segments.update({
            where: { id: segment.id },
            data: {
              audio_url: s3Key,
              status: "generated",
              timing: estimatedDuration,
            },
          });

          return {
            segmentId: segment.id,
            success: true,
            s3Key,
            audioUrl: presignedUrl,
          };
        } catch (error) {
          console.error(
            `Error generating TTS for segment ${segment.id}:`,
            error
          );

          // Mark segment as failed
          await db.script_segments.update({
            where: { id: segment.id },
            data: { status: "failed" },
          });

          return {
            segmentId: segment.id,
            success: false,
            error:
              error instanceof Error ? error.message : "TTS generation failed",
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
        status: "generated",
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
/**
 * Delete audio for a script segment
 */
export async function deleteScriptSegmentAudio(segmentId: number) {
  try {
    // Get the segment to find the event ID
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      select: { event_id: true, audio_url: true },
    });

    if (!segment) {
      return {
        success: false,
        error: "Script segment not found",
      };
    }

    // Delete the audio file from S3
    if (segment.audio_url) {
      await deleteSegmentAudio(segment.event_id, segmentId);
    }

    // Update the segment to remove the audio URL
    await db.script_segments.update({
      where: { id: segmentId },
      data: {
        audio_url: null,
        status: "draft",
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}/script`);

    return {
      success: true,
      message: "Audio deleted successfully",
    };
  } catch (error) {
    console.error(`Error deleting audio for segment ${segmentId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete audio for segment",
    };
  }
}

/**
 * Delete all audio for an event
 */
export async function deleteAllEventAudio(eventId: string) {
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
        audio_url: { not: null },
      },
      select: { id: true },
    });

    if (segments.length === 0) {
      return {
        success: true,
        message: "No audio files to delete",
      };
    }

    // Delete all audio files from S3
    await deleteEventAudio(eventIdNum);

    // Update all segments to remove audio URLs
    await db.script_segments.updateMany({
      where: { event_id: eventIdNum },
      data: {
        audio_url: null,
        status: "draft",
      },
    });

    // Update the event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "script_ready", // Back to script ready but not fully ready
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: true,
      message: `Deleted audio for ${segments.length} segments`,
    };
  } catch (error) {
    console.error(`Error deleting audio for event ${eventId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete audio for event",
    };
  }
}

/**
 * Generate TTS for a single script segment
 */
export async function generateTTSForSegment(segmentId: number) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
    }

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
      // Generate TTS and upload to S3
      const s3Key = await generateAndUploadTTS(
        segmentId,
        segment.event_id,
        segment.content,
        event.voice_settings
      );

      // Extract voice settings parameters and validate them
      let speakingRate = 1.0;
      let pitch = 0;
      let volumeGainDb = 0;

      try {
        let settings: any = null;

        if (typeof event.voice_settings === "string") {
          settings = JSON.parse(event.voice_settings);
        } else if (
          typeof event.voice_settings === "object" &&
          event.voice_settings
        ) {
          settings = event.voice_settings;
        }

        if (settings) {
          // MC-like voice settings with more energy and presence

          // Extract and validate speaking rate (0.25 to 2.0)
          // Use a slightly faster rate for MC-style delivery (1.15-1.25 is good for MC)
          speakingRate = settings.speakingRate || 1.2;
          speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));

          // Extract and validate pitch (-20.0 to 20.0)
          // Slightly higher pitch for more animated, engaging presentation
          pitch = settings.pitch || 2.0;
          pitch = Math.max(-20.0, Math.min(20.0, pitch));

          // Extract and validate volume gain (-96.0 to 16.0)
          // Increase volume for better projection and presence
          volumeGainDb = settings.volumeGainDb || 3.5;
          volumeGainDb = Math.max(-96.0, Math.min(16.0, volumeGainDb));
        }
      } catch (error) {
        console.warn(
          "Error parsing voice settings, using default values:",
          error
        );
      }

      // Estimate duration based on content
      const estimatedDuration = estimateTTSDuration(
        segment.content,
        speakingRate
      );

      // Update the segment with the audio URL and status
      await db.script_segments.update({
        where: { id: segmentId },
        data: {
          audio_url: s3Key,
          status: "generated",
          timing: estimatedDuration,
        },
      });

      // Check if all segments are generated
      const allSegmentsCount = await db.script_segments.count({
        where: { event_id: segment.event_id },
      });

      const generatedSegmentsCount = await db.script_segments.count({
        where: {
          event_id: segment.event_id,
          status: "generated",
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

      // Generate a presigned URL with a longer expiration (24 hours)
      const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);

      return {
        success: true,
        segmentId,
        s3Key,
        audioUrl: presignedUrl,
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
