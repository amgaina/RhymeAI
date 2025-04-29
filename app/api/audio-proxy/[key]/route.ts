import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/s3-utils";

/**
 * Audio proxy route to help with CORS and format issues
 * Fetches the audio from S3 and serves it through our API with proper headers
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Get the S3 key from the URL (it's URL encoded)
    const s3key = decodeURIComponent(params.key);

    if (!s3key) {
      return NextResponse.json(
        { error: "No S3 key provided" },
        { status: 400 }
      );
    }

    // Get a presigned URL for the S3 object
    const presignedUrl = await getPresignedUrl(s3key);

    // Fetch the audio directly from S3
    const response = await fetch(presignedUrl);

    if (!response.ok) {
      console.error(
        `Error fetching audio from S3: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio with proper headers to avoid CORS issues
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Content-Disposition": `inline; filename="${s3key.split("/").pop()}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error in audio proxy:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
