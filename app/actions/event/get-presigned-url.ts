"use server";

import { getPresignedUrl } from "@/lib/s3-utils";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get a presigned URL for an audio file
 * @param segmentId The segment ID
 * @returns The presigned URL
 */
export async function getPresignedAudioUrl(segmentId: number) {
  try {
    // Get the script segment
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      select: { id: true, audio_url: true, event_id: true },
    });

    if (!segment) {
      return {
        success: false,
        error: "Script segment not found",
      };
    }

    if (!segment.audio_url) {
      return {
        success: false,
        error: "No audio URL found for this segment",
      };
    }

    try {
      // Generate a presigned URL that expires in 1 hour
      const presignedUrl = await getPresignedUrl(segment.audio_url, 3600);

      // Revalidate paths
      revalidatePath(`/events/${segment.event_id}`);
      revalidatePath(`/event/${segment.event_id}`);
      revalidatePath(`/event/${segment.event_id}/script`);

      return {
        success: true,
        presignedUrl,
        segmentId: segment.id,
      };
    } catch (presignedUrlError) {
      return {
        success: false,
        error: `Failed to generate presigned URL: ${
          presignedUrlError instanceof Error
            ? presignedUrlError.message
            : String(presignedUrlError)
        }`,
      };
    }
  } catch (error) {
    console.error(
      `Error generating presigned URL for segment ${segmentId}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate presigned URL",
    };
  }
}

export async function getPresignedAudioUrlsForEvent(eventId: string | number) {
  try {
    // Get all script segments with audio URLs
    const segments = await db.script_segments.findMany({
      where: {
        event_id: Number(eventId),
        audio_url: { not: null },
      },
      select: {
        id: true,
        audio_url: true,
      },
    });

    if (segments.length === 0) {
      return {
        success: true,
        presignedUrls: {},
        message: "No audio segments found",
      };
    }

    // Generate presigned URLs for each segment
    const presignedUrls: Record<number, string> = {};

    for (const segment of segments) {
      if (segment.audio_url) {
        try {
          // Check if the audio_url is already just an S3 key (not a full URL)

          // Generate a presigned URL that expires in 1 hour
          try {
            console.log(
              `Generating presigned URL for segment ${segment.id}, key: ${segment.audio_url}`
            );
            const presignedUrl = await getPresignedUrl(segment.audio_url, 3600);
            presignedUrls[segment.id] = presignedUrl;
            console.log(`Generated presigned URL for segment ${segment.id}`);
          } catch (error) {
            console.error(
              `Error generating presigned URL for segment ${segment.id}:`,
              error
            );
            // Use the original URL/key as fallback
            presignedUrls[segment.id] = segment.audio_url;
          }
        } catch (error) {
          console.error(
            `Error generating presigned URL for segment ${segment.id}:`,
            error
          );
        }
      }
    }

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: true,
      presignedUrls,
    };
  } catch (error) {
    console.error(
      `Error generating presigned URLs for event ${eventId}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate presigned URLs",
    };
  }
}
