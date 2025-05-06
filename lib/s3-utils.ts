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
// Log AWS configuration for debugging
console.log(`AWS Region: ${process.env.AWS_REGION || "us-east-1"}`);
console.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME || "rhymeai-audio"}`);
console.log(
  `AWS Credentials Available: ${!!(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  )}`
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  // Only provide credentials if both values are present
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}), // Otherwise, let the SDK use the default credential provider chain
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
    // Validate the buffer to ensure it's a valid audio file
    if (buffer.length < 100) {
      throw new Error("Invalid audio buffer: too small");
    }

    // Create the PutObjectCommand with improved metadata
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Add additional metadata for better audio handling
      ContentDisposition: `inline; filename="${key.split("/").pop()}"`,
      CacheControl: "public, max-age=31536000", // Cache for 1 year
      Metadata: {
        "x-amz-meta-content-type": contentType,
        "x-amz-meta-original-filename": key.split("/").pop() || "",
        "x-amz-meta-creation-time": new Date().toISOString(),
      },
    });

    // Upload the file
    await s3Client.send(command);
    console.log(
      `Successfully uploaded ${buffer.length} bytes to S3 key: ${key}`
    );

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

    // Log AWS configuration for debugging
    console.log(`AWS Region: ${process.env.AWS_REGION || "us-east-1"}`);
    console.log(`S3 Bucket: ${BUCKET_NAME}`);
    console.log(
      `AWS Credentials Available: ${!!(
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      )}`
    );

    // Verify AWS credentials are available - but don't throw an error
    // as the SDK might use other credential sources
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        "AWS credentials are missing in environment variables. Using default credential provider chain."
      );
    }

    // Verify bucket name is set
    if (!BUCKET_NAME) {
      console.error("S3_BUCKET_NAME is missing");
      throw new Error(
        "S3 bucket name is missing. Please check your environment configuration."
      );
    }

    // Check if the object exists in S3, but don't block if we can't check
    try {
      const exists = await checkS3ObjectExists(key);
      if (!exists) {
        console.warn(
          `Object does not exist in S3: ${key}, but proceeding anyway`
        );
        // Don't throw an error, just log a warning and proceed
      }
    } catch (error) {
      console.warn(`Error checking if object exists, assuming it does:`, error);
      // Continue with the presigned URL generation even if we can't check
    }

    // Determine the content type based on the file extension
    const fileExtension = key.split(".").pop()?.toLowerCase();
    const contentType =
      fileExtension === "mp3"
        ? "audio/mp3"
        : fileExtension === "wav"
        ? "audio/wav"
        : fileExtension === "ogg"
        ? "audio/ogg"
        : fileExtension === "m4a"
        ? "audio/mp4"
        : "application/octet-stream";

    console.log(
      `Using content type ${contentType} for file with extension ${fileExtension}`
    );

    // Create the GetObjectCommand with improved response headers for audio playback
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentType: contentType, // Set the correct content type
      ResponseContentDisposition: `inline; filename="${key.split("/").pop()}"`, // Ensure proper filename
      ResponseCacheControl: "public, max-age=86400", // Cache for 24 hours
      ResponseContentEncoding: "identity", // No additional encoding
    };

    const command = new GetObjectCommand(params);

    try {
      // Generate the presigned URL
      console.log(`Generating signed URL with expiresIn: ${expiresIn} seconds`);
      console.log(
        `Using S3 client with region: ${process.env.AWS_REGION || "us-east-1"}`
      );

      const url = await getSignedUrl(s3Client, command, {
        expiresIn,
      });

      console.log(`Generated presigned URL: ${url}`);
      return url;
    } catch (signedUrlError) {
      console.error("Error in getSignedUrl:", signedUrlError);

      // More detailed error for credential issues
      const errorString = String(signedUrlError);
      if (errorString.includes("Credential")) {
        console.error(
          "AWS credential error detected. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
        );
        throw new Error(
          "AWS credential error. Please check your AWS configuration."
        );
      }

      throw new Error(
        `Failed to generate signed URL: ${
          signedUrlError instanceof Error
            ? signedUrlError.message
            : String(signedUrlError)
        }`
      );
    }
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
  // Check if bucket name is configured
  const hasBucket = !!process.env.S3_BUCKET_NAME;

  // Check if credentials are configured directly
  const hasDirectCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );

  // Check for AWS_PROFILE or other credential indicators
  const hasProfileOrOtherCredentials = !!(
    process.env.AWS_PROFILE ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
  );

  // S3 is configured if we have a bucket and either direct credentials or profile/other credentials
  return hasBucket && (hasDirectCredentials || hasProfileOrOtherCredentials);
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
