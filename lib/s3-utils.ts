/**
 * S3 utilities for RhymeAI
 * Handles uploading and retrieving files from S3
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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

    // Return the URL
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a presigned URL for an S3 object
 * @param key The S3 key (file path)
 * @param expiresIn The expiration time in seconds (default: 3600 = 1 hour)
 * @returns The presigned URL
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    // Create the GetObjectCommand
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generate the presigned URL
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a unique S3 key for an audio file
 * @param eventId The event ID
 * @param segmentId The segment ID
 * @param timestamp Optional timestamp to ensure uniqueness
 * @returns The S3 key
 */
export function generateAudioKey(eventId: string | number, segmentId: string | number, timestamp: number = Date.now()): string {
  return `audio/event-${eventId}/segment-${segmentId}-${timestamp}.mp3`;
}

/**
 * Generate a unique S3 key for a presentation file
 * @param eventId The event ID
 * @param timestamp Optional timestamp to ensure uniqueness
 * @returns The S3 key
 */
export function generatePresentationKey(eventId: string | number, timestamp: number = Date.now()): string {
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
