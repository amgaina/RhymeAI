"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateAndUploadTTS,
  estimateTTSDuration,
  deleteEventAudio,
  deleteSegmentAudio,
  isTTSConfigured,
  VoiceConfig,
} from "@/lib/google-tts";
import { getPresignedUrl } from "@/lib/s3-utils";
import { S3Client, PutObjectAclCommand } from "@aws-sdk/client-s3";

/**
 * Voice gender mapping function
 */
function getVoiceGender(voiceIdentifier: string): string {
  // Map Studio voice identifiers to appropriate SSML genders
  const genderMap: Record<string, string> = {
    O: "FEMALE",
    M: "MALE",
    D: "MALE",
    J: "FEMALE",
    // Add other mappings as needed
  };

  return genderMap[voiceIdentifier] || "NEUTRAL"; // Default to NEUTRAL if unmapped
}

/**
 * Generate TTS for all script segments of an event
 */
export async function generateTTSForAllSegments(eventId: string) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return { success: false, error: "Google TTS is not properly configured" };
    }

    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) {
      return { success: false, error: "Invalid event ID format" };
    }

    // Get the event to fetch voice settings
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: { voice_settings: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Parse voice settings or use defaults
    let voiceSettings: VoiceConfig;
    try {
      // Try to parse voice settings from JSON
      const parsedSettings = event.voice_settings
        ? typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings)
          : event.voice_settings
        : null;

      // Extract voice type from the parsed settings if available
      const voiceType = parsedSettings?.type || parsedSettings?.voice_type;

      // Map voice type to Studio voice if available
      if (voiceType) {
        // Map voice types to Studio voices
        const voiceMap: Record<string, string> = {
          professional: "O",
          casual: "M",
          enthusiastic: "D",
          formal: "J",
          male: "M",
          female: "O",
        };

        // Get voice identifier from map or use first character if available
        const voiceIdentifier =
          voiceMap[voiceType.toLowerCase()] ||
          (typeof voiceType === "string"
            ? voiceType.charAt(0).toUpperCase()
            : "O");

        // Determine gender based on voice identifier
        const ssmlGender = getVoiceGender(voiceIdentifier);

        voiceSettings = {
          name: `en-US-Studio-${voiceIdentifier}`,
          languageCode: "en-US",
          ssmlGender: ssmlGender, // Add the required ssmlGender property
        };

        console.log(
          `Using mapped voice settings for type ${voiceType}:`,
          voiceSettings
        );
      }
      // Otherwise use a consistent default
      else {
        voiceSettings = {
          name: "en-US-Studio-O", // Consistent Studio voice
          languageCode: "en-US",
          ssmlGender: "FEMALE", // Add the required ssmlGender property
        };
        console.log("Using default voice settings:", voiceSettings);
      }
    } catch (error) {
      console.error("Error parsing voice settings:", error);
      // Fallback to a known working voice
      voiceSettings = {
        name: "en-US-Studio-O",
        languageCode: "en-US",
        ssmlGender: "FEMALE", // Add the required ssmlGender property
      };
      console.log("Using fallback voice settings due to error:", voiceSettings);
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

    // Process each segment
    const results = await Promise.all(
      segments.map(async (segment) => {
        try {
          // Mark segment as generating
          await db.script_segments.update({
            where: { id: segment.id },
            data: { status: "generating" },
          });

          // Generate TTS and upload to S3 with our consistent voice settings
          const s3Key = await generateAndUploadTTS(
            segment.id,
            eventIdNum,
            segment.content,
            voiceSettings
          );

          // Ensure the S3 object is publicly readable
          await makeS3ObjectPublic(s3Key);

          // Generate a presigned URL with a longer expiration (24 hours)
          const presignedUrl = await getPresignedUrl(s3Key, 24 * 3600);

          // Estimate duration
          const estimatedDuration = estimateTTSDuration(segment.content);

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
 * Make an S3 object publicly readable to solve access denied errors
 */
async function makeS3ObjectPublic(s3Key: string): Promise<void> {
  try {
    const BUCKET_NAME = process.env.S3_BUCKET_NAME || "rhymeai-audio";
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    // Set the ACL to public-read
    const command = new PutObjectAclCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ACL: "public-read",
    });

    await s3Client.send(command);
    console.log(`Made S3 object ${s3Key} publicly readable`);
  } catch (error) {
    console.error(`Error making S3 object ${s3Key} public:`, error);
    // Continue even if this fails, since we'll still have the presigned URL
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
      return { success: false, error: "Event not found" };
    }

    // Parse voice settings or use defaults
    let voiceSettings: VoiceConfig;
    try {
      // Try to parse voice settings from JSON
      const parsedSettings = event.voice_settings
        ? typeof event.voice_settings === "string"
          ? JSON.parse(event.voice_settings)
          : event.voice_settings
        : null;

      // Extract voice type from the parsed settings if available
      const voiceType = parsedSettings?.type || parsedSettings?.voice_type;

      // Map voice type to Studio voice if available
      if (voiceType) {
        // Map voice types to Studio voices
        const voiceMap: Record<string, string> = {
          professional: "O",
          casual: "M",
          enthusiastic: "D",
          formal: "J",
          male: "M",
          female: "O",
        };

        // Get voice identifier from map or use first character if available
        const voiceIdentifier =
          voiceMap[voiceType.toLowerCase()] ||
          (typeof voiceType === "string"
            ? voiceType.charAt(0).toUpperCase()
            : "O");

        // Determine gender based on voice identifier
        const ssmlGender = getVoiceGender(voiceIdentifier);

        voiceSettings = {
          name: `en-US-Studio-${voiceIdentifier}`,
          languageCode: "en-US",
          ssmlGender: ssmlGender, // Add the required ssmlGender property
        };

        console.log(
          `Using mapped voice settings for type ${voiceType}:`,
          voiceSettings
        );
      }
      // Otherwise use a consistent default
      else {
        voiceSettings = {
          name: "en-US-Studio-O", // Consistent Studio voice
          languageCode: "en-US",
          ssmlGender: "FEMALE", // Add the required ssmlGender property
        };
        console.log("Using default voice settings:", voiceSettings);
      }
    } catch (error) {
      console.error("Error parsing voice settings:", error);
      // Fallback to a known working voice
      voiceSettings = {
        name: "en-US-Studio-O",
        languageCode: "en-US",
        ssmlGender: "FEMALE", // Add the required ssmlGender property
      };
      console.log("Using fallback voice settings due to error:", voiceSettings);
    }

    // Mark segment as generating
    await db.script_segments.update({
      where: { id: segmentId },
      data: { status: "generating" },
    });

    try {
      // Generate TTS and upload to S3 with our consistent voice settings
      const s3Key = await generateAndUploadTTS(
        segmentId,
        segment.event_id,
        segment.content,
        voiceSettings
      );

      // Ensure the S3 object is publicly readable
      await makeS3ObjectPublic(s3Key);

      // Estimate duration based on content - without speakingRate parameter
      const estimatedDuration = estimateTTSDuration(segment.content);

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
