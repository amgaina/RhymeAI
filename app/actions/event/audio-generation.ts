"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  generateAndUploadTTS,
  estimateTTSDuration,
  isTTSConfigured,
} from "@/lib/google-tts";
import { getPresignedUrl } from "@/lib/s3-utils";

/**
 * Generate audio for a specific script segment
 * This is a direct server action that can be called from the chat interface
 */
export async function generateAudioForSegment(
  eventId: string,
  segmentId: string
) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
    }

    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string IDs to numbers
    const eventIdNum = parseInt(eventId);
    const segmentIdNum = parseInt(segmentId);

    if (isNaN(eventIdNum) || isNaN(segmentIdNum)) {
      return {
        success: false,
        error: "Invalid ID format",
      };
    }

    // Get the event to verify ownership
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      select: {
        voice_settings: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found or access denied",
      };
    }

    // Get the script segment
    const segment = await db.script_segments.findUnique({
      where: {
        id: segmentIdNum,
        event_id: eventIdNum,
      },
    });

    if (!segment) {
      return {
        success: false,
        error: "Script segment not found",
      };
    }

    // Mark segment as generating
    await db.script_segments.update({
      where: { id: segmentIdNum },
      data: { status: "generating" },
    });

    try {
      // Generate TTS and upload to S3
      const s3Key = await generateAndUploadTTS(
        segmentIdNum,
        eventIdNum,
        segment.content,
        event.voice_settings
      );

      // Extract voice settings parameters and validate them
      let speakingRate = 1.0;
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
          // Extract and validate speaking rate (0.25 to 2.0)
          speakingRate = settings.speakingRate || 1.0;
          speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));
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
        where: { id: segmentIdNum },
        data: {
          audio_url: s3Key, // S3 key is stored directly in audio_url
          status: "generated",
          timing: estimatedDuration,
        },
      });

      // Check if all segments are generated
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
      revalidatePath(`/events/${eventIdNum}`);
      revalidatePath(`/event/${eventIdNum}`);
      revalidatePath(`/event/${eventIdNum}/script`);

      // Generate a presigned URL with a longer expiration (24 hours)
      const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);

      return {
        success: true,
        segmentId: segmentIdNum,
        s3Key,
        audioUrl: presignedUrl,
        message: "Audio generated successfully",
      };
    } catch (error) {
      console.error(
        `Error generating audio for segment ${segmentIdNum}:`,
        error
      );

      // Mark segment as failed
      await db.script_segments.update({
        where: { id: segmentIdNum },
        data: { status: "failed" },
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      };
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate audio",
    };
  }
}

/**
 * Generate audio for all script segments of an event
 */
export async function generateAudioForAllSegments(eventId: string) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
    }

    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get the event to verify ownership
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      select: {
        voice_settings: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found or access denied",
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
        message: "No segments need audio generation",
        processedCount: 0,
      };
    }

    // Process each segment
    const results = [];
    for (const segment of segments) {
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

        // Extract voice settings parameters and validate them
        let speakingRate = 1.0;
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
            // Extract and validate speaking rate (0.25 to 2.0)
            speakingRate = settings.speakingRate || 1.0;
            speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));
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
            audio_url: s3Key, // S3 key is stored directly in audio_url
            status: "generated",
            timing: estimatedDuration,
          },
        });

        // Generate a presigned URL with a longer expiration (24 hours)
        const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);

        results.push({
          segmentId: segment.id,
          success: true,
          s3Key,
          audioUrl: presignedUrl,
        });
      } catch (error) {
        console.error(
          `Error generating audio for segment ${segment.id}:`,
          error
        );

        // Mark segment as failed
        await db.script_segments.update({
          where: { id: segment.id },
          data: { status: "failed" },
        });

        results.push({
          segmentId: segment.id,
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to generate audio",
        });
      }
    }

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
    revalidatePath(`/events/${eventIdNum}`);
    revalidatePath(`/event/${eventIdNum}`);
    revalidatePath(`/event/${eventIdNum}/script`);

    return {
      success: true,
      message: `Generated audio for ${successCount}/${segments.length} segments`,
      processedCount: segments.length,
      successCount,
      results,
    };
  } catch (error) {
    console.error("Error generating audio for all segments:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate audio",
    };
  }
}

/**
 * Generate audio for specific script segments
 * @param eventId The event ID
 * @param segmentIds Array of segment IDs to generate audio for
 * @returns Result of the batch generation
 */
export async function generateBatchAudio(
  eventId: string,
  segmentIds: string[]
) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
    }

    // Get the authenticated user
    const session = await auth();
    if (!session || !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get the event to verify ownership
    const event = await db.events.findUnique({
      where: {
        event_id: eventIdNum,
        user_id: session.userId, // Ensure the user can only access their own events
      },
      select: {
        voice_settings: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found or access denied",
      };
    }

    // Convert segment IDs to numbers
    const segmentIdNums = segmentIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (segmentIdNums.length === 0) {
      return {
        success: false,
        error: "No valid segment IDs provided",
      };
    }

    // Get all specified script segments for the event
    const segments = await db.script_segments.findMany({
      where: {
        event_id: eventIdNum,
        id: { in: segmentIdNums },
      },
      orderBy: { order: "asc" },
    });

    if (segments.length === 0) {
      return {
        success: true,
        message: "No segments found for the provided IDs",
        processedCount: 0,
      };
    }

    console.log(
      `Starting batch audio generation for ${segments.length} segments`
    );

    // Process each segment
    const results = [];
    for (const segment of segments) {
      try {
        console.log(`Processing segment ${segment.id}`);

        // Mark segment as generating
        await db.script_segments.update({
          where: { id: segment.id },
          data: { status: "generating" },
        });

        // Generate TTS and upload to S3
        console.log(`Generating TTS for segment ${segment.id}`);
        const s3Key = await generateAndUploadTTS(
          segment.id,
          eventIdNum,
          segment.content,
          event.voice_settings
        );
        console.log(
          `Generated TTS for segment ${segment.id}, S3 key: ${s3Key}`
        );

        // Extract voice settings parameters and validate them
        let speakingRate = 1.0;
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
            // Extract and validate speaking rate (0.25 to 2.0)
            speakingRate = settings.speakingRate || 1.0;
            speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));
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
            audio_url: s3Key, // S3 key is stored directly in audio_url
            status: "generated",
            timing: estimatedDuration,
          },
        });

        // Generate a presigned URL with a longer expiration (24 hours)
        console.log(`Generating presigned URL for segment ${segment.id}`);
        try {
          const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);
          console.log(`Generated presigned URL for segment ${segment.id}`);

          results.push({
            segmentId: segment.id,
            success: true,
            s3Key,
            audioUrl: presignedUrl,
          });
        } catch (urlError) {
          console.error(
            `Error generating presigned URL for segment ${segment.id}:`,
            urlError
          );

          // Still mark as success since the audio was generated
          results.push({
            segmentId: segment.id,
            success: true,
            s3Key,
            audioUrl: null,
            urlError:
              urlError instanceof Error ? urlError.message : String(urlError),
          });
        }
      } catch (error) {
        console.error(
          `Error generating audio for segment ${segment.id}:`,
          error
        );

        // Mark segment as failed
        await db.script_segments.update({
          where: { id: segment.id },
          data: { status: "failed" },
        });

        results.push({
          segmentId: segment.id,
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to generate audio",
        });
      }
    }

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
    revalidatePath(`/events/${eventIdNum}`);
    revalidatePath(`/event/${eventIdNum}`);
    revalidatePath(`/event/${eventIdNum}/script`);

    return {
      success: true,
      message: `Generated audio for ${successCount}/${segments.length} segments`,
      processedCount: segments.length,
      successCount,
      results,
      eventId: eventIdNum,
    };
  } catch (error) {
    console.error("Error generating batch audio:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate batch audio",
    };
  }
}
