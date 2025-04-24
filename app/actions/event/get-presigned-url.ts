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
      select: { audio_url: true, event_id: true },
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

    // Extract the S3 key from the audio URL
    let key: string;

    // Check if the audio_url is already just an S3 key (not a full URL)
    const isFullUrl =
      segment.audio_url.startsWith("http://") ||
      segment.audio_url.startsWith("https://");

    if (!isFullUrl) {
      // If it's already just a key, use it directly
      console.log(`Audio URL is already an S3 key: ${segment.audio_url}`);
      key = segment.audio_url;
    } else {
      // It's a full URL, so we need to extract the key
      try {
        // Try to parse the URL
        const url = new URL(segment.audio_url);

        console.log(`Parsing URL: ${segment.audio_url}`);
        console.log(`URL hostname: ${url.hostname}, pathname: ${url.pathname}`);

        // Check if this is an S3 URL
        if (url.hostname.includes("s3.") || url.hostname.includes(".s3.")) {
          // The audio_url is in the format: https://bucket-name.s3.amazonaws.com/key
          // or https://s3.region.amazonaws.com/bucket-name/key

          // Extract the key based on the URL format
          if (url.hostname.startsWith("s3.")) {
            // Format: s3.region.amazonaws.com/bucket-name/key
            const pathParts = url.pathname.substring(1).split("/");
            // Remove the bucket name from the path
            const bucketName = pathParts.shift();
            key = pathParts.join("/");
            console.log(`S3 URL format 1: Bucket=${bucketName}, Key=${key}`);
          } else if (url.hostname.includes(".s3.")) {
            // Format: bucket-name.s3.region.amazonaws.com/key
            key = url.pathname.substring(1); // Remove the leading slash
            console.log(`S3 URL format 2: Key=${key}`);
          } else {
            // Unknown format, try the default
            key = url.pathname.substring(1);
            console.log(
              `Unknown S3 URL format, using default key extraction: ${key}`
            );
          }

          // If we couldn't extract a key, return an error
          if (!key || key.length === 0) {
            console.error(
              `Failed to extract key from URL: ${segment.audio_url}`
            );
            return {
              success: false,
              error: `Failed to extract key from URL: ${segment.audio_url}`,
            };
          }
        } else {
          // If it's not an S3 URL, just return the original URL
          console.log(
            `URL is not an S3 URL, returning original: ${segment.audio_url}`
          );
          return {
            success: true,
            presignedUrl: segment.audio_url,
          };
        }
      } catch (error) {
        // If there's an error parsing the URL, check if it might be just an S3 key
        if (
          segment.audio_url.startsWith("audio/") ||
          segment.audio_url.includes(".mp3")
        ) {
          console.log(
            `URL parsing failed but appears to be an S3 key: ${segment.audio_url}`
          );
          key = segment.audio_url;
        } else {
          console.error(`Error parsing audio URL: ${segment.audio_url}`, error);
          return {
            success: false,
            error: `Invalid audio URL: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }
    }

    console.log(`Generating presigned URL for key: ${key}`);

    // Generate a presigned URL that expires in 1 hour
    const presignedUrl = await getPresignedUrl(key, 3600);

    // Revalidate paths
    revalidatePath(`/events/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}`);
    revalidatePath(`/event/${segment.event_id}/script`);

    return {
      success: true,
      presignedUrl,
    };
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

/**
 * Get presigned URLs for all audio files in an event
 * @param eventId The event ID
 * @returns The presigned URLs
 */
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
          // Process the audio URL to get a key or use directly
          let key: string;

          // Check if the audio_url is already just an S3 key (not a full URL)
          const isFullUrl =
            segment.audio_url.startsWith("http://") ||
            segment.audio_url.startsWith("https://");

          if (!isFullUrl) {
            // If it's already just a key, use it directly
            console.log(
              `Audio URL for segment ${segment.id} is already an S3 key: ${segment.audio_url}`
            );
            key = segment.audio_url;
          } else {
            // It's a full URL, so we need to extract the key
            try {
              // Try to parse the URL
              const url = new URL(segment.audio_url);

              console.log(
                `Parsing URL for segment ${segment.id}: ${segment.audio_url}`
              );
              console.log(
                `URL hostname: ${url.hostname}, pathname: ${url.pathname}`
              );

              // Check if this is an S3 URL
              if (
                url.hostname.includes("s3.") ||
                url.hostname.includes(".s3.")
              ) {
                // Extract the key based on the URL format
                if (url.hostname.startsWith("s3.")) {
                  // Format: s3.region.amazonaws.com/bucket-name/key
                  const pathParts = url.pathname.substring(1).split("/");
                  // Remove the bucket name from the path
                  const bucketName = pathParts.shift();
                  key = pathParts.join("/");
                  console.log(
                    `S3 URL format 1: Bucket=${bucketName}, Key=${key}`
                  );
                } else if (url.hostname.includes(".s3.")) {
                  // Format: bucket-name.s3.region.amazonaws.com/key
                  key = url.pathname.substring(1); // Remove the leading slash
                  console.log(`S3 URL format 2: Key=${key}`);
                } else {
                  // Unknown format, try the default
                  key = url.pathname.substring(1);
                  console.log(
                    `Unknown S3 URL format, using default key extraction: ${key}`
                  );
                }

                // If we couldn't extract a key, use the original URL
                if (!key || key.length === 0) {
                  console.error(
                    `Failed to extract key from URL: ${segment.audio_url}`
                  );
                  presignedUrls[segment.id] = segment.audio_url;
                  continue; // Skip to next segment
                }
              } else {
                // If it's not an S3 URL, just use the original URL
                console.log(
                  `URL is not an S3 URL, using original: ${segment.audio_url}`
                );
                presignedUrls[segment.id] = segment.audio_url;
                continue; // Skip to next segment
              }
            } catch (error) {
              // If there's an error parsing the URL, check if it might be just an S3 key
              if (
                segment.audio_url.startsWith("audio/") ||
                segment.audio_url.includes(".mp3")
              ) {
                console.log(
                  `URL parsing failed but appears to be an S3 key for segment ${segment.id}: ${segment.audio_url}`
                );
                key = segment.audio_url;
              } else {
                console.error(
                  `Error processing URL for segment ${segment.id}:`,
                  error
                );
                // Use the original URL as fallback
                presignedUrls[segment.id] = segment.audio_url;
                continue; // Skip to next segment
              }
            }
          }

          // Generate a presigned URL that expires in 1 hour
          try {
            console.log(
              `Generating presigned URL for segment ${segment.id}, key: ${key}`
            );
            const presignedUrl = await getPresignedUrl(key, 3600);
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
