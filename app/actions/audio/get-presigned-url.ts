"use server";

import { getPresignedUrl } from "@/lib/s3-utils";

interface PresignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server action to get a presigned URL for an S3 key
 * @param s3key The S3 key to get a presigned URL for
 * @returns An object with the presigned URL or an error
 */
export async function getPresignedUrlFromS3Key(
  s3key: string
): Promise<PresignedUrlResult> {
  try {
    if (!s3key) {
      return {
        success: false,
        error: "No S3 key provided",
      };
    }

    console.log(`Getting presigned URL for S3 key: ${s3key}`);

    // Default to 1 hour expiration
    const url = await getPresignedUrl(s3key, 3600);

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error getting presigned URL",
    };
  }
}
