/**
 * S3 utilities for RhymeAI
 * Handles uploading and retrieving files from S3
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// S3 bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "rhymeai-audio";

/**
 * Upload a buffer to S3
 * @param buffer The buffer to upload
 * @param key The S3 key (file path)
 * @param contentType The content type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = "audio/mpeg"
): Promise<string> {
  try {
    // Create the PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    // Upload the file
    await s3Client.send(command);

    // Generate a presigned URL that expires in 5 days
    const fiveDaysInSeconds = 5 * 24 * 60 * 60; // 5 days in seconds
    return await getPresignedUrl(key, fiveDaysInSeconds);
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(
      `Failed to upload file to S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generate a presigned URL for an S3 object
 * @param key The S3 key (file path)
 * @param expiresIn The expiration time in seconds (default: 3600 = 1 hour)
 * @returns The presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    console.log(
      `Generating presigned URL for key: ${key} with expiration: ${expiresIn} seconds`
    );

    // Check if the object exists in S3
    const exists = await checkS3ObjectExists(key).catch((error) => {
      console.warn(`Error checking if object exists, assuming it does:`, error);
      return true; // Assume it exists if we can't check
    });

    if (!exists) {
      throw new Error(`Object does not exist in S3: ${key}`);
    }

    // Create the GetObjectCommand with response headers for CORS
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentType: "audio/mpeg", // Ensure proper content type
      ResponseContentDisposition: `inline; filename="${key.split("/").pop()}"`, // Ensure proper filename
      // Add CORS headers
      ResponseCacheControl: "no-cache, no-store, must-revalidate",
    });

    // Generate the presigned URL
    const url = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    console.log(`Generated presigned URL: ${url.substring(0, 100)}...`);

    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(
      `Failed to generate presigned URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generate a unique S3 key for an audio file
 * @param eventId The event ID
 * @param segmentId The segment ID
 * @param timestamp Optional timestamp to ensure uniqueness
 * @returns The S3 key
 */
export function generateAudioKey(
  eventId: string | number,
  segmentId: string | number,
  timestamp: number = Date.now()
): string {
  return `audio/event-${eventId}/segment-${segmentId}-${timestamp}.mp3`;
}

/**
 * Generate a unique S3 key for a presentation file
 * @param eventId The event ID
 * @param timestamp Optional timestamp to ensure uniqueness
 * @returns The S3 key
 */
export function generatePresentationKey(
  eventId: string | number,
  timestamp: number = Date.now()
): string {
  return `presentations/event-${eventId}/presentation-${timestamp}.pptx`;
}

/**
 * Check if S3 is properly configured
 * @returns True if S3 is configured, false otherwise
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}

/**
 * Get the full S3 URL for a key
 * @param key The S3 key
 * @returns The full S3 URL
 */
export function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

/**
 * Check if an object exists in S3
 * @param key The S3 key
 * @returns True if the object exists, false otherwise
 */
export async function checkS3ObjectExists(key: string): Promise<boolean> {
  try {
    console.log(`Checking if object exists in S3: ${key}`);

    // Create the HeadObjectCommand
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Send the command
    await s3Client.send(command);

    // If no error is thrown, the object exists
    console.log(`Object exists in S3: ${key}`);
    return true;
  } catch (error) {
    // If the error is a 404, the object doesn't exist
    if (
      (error as any)?.name === "NotFound" ||
      (error as any)?.code === "NotFound"
    ) {
      console.log(`Object does not exist in S3: ${key}`);
      return false;
    }

    // For other errors, log and rethrow
    console.error(`Error checking if object exists in S3: ${key}`, error);
    throw error;
  }
}
