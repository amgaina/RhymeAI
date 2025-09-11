import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/s3-utils";

/**
 * Proxy endpoint for serving audio files from S3
 * This avoids CORS issues by proxying the request through the Next.js server
 */

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Max-Age": "86400",
    },
  });
}
export async function GET(request: NextRequest) {
  try {
    // Get the key from the query string
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const usePresigned = searchParams.get("presigned") === "true";

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        { status: 400 }
      );
    }

    console.log(
      `Audio proxy request for key: ${key}, usePresigned: ${usePresigned}`
    );

    // Try to generate a presigned URL for the S3 object
    let presignedUrl: string;
    try {
      presignedUrl = await getPresignedUrl(key, 3600);

      // If the client just wants the presigned URL, return it
      if (usePresigned) {
        return NextResponse.json({ presignedUrl });
      }
    } catch (error) {
      console.error("Error generating presigned URL:", error);

      // If we're just returning the URL and it failed, return the error
      if (usePresigned) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate presigned URL",
          },
          { status: 500 }
        );
      }

      // For direct proxy requests, we'll return a more helpful error
      return NextResponse.json(
        {
          error:
            "Audio file access error. AWS credentials may be missing or invalid.",
        },
        { status: 500 }
      );
    }

    // Fetch the audio file from S3
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

    // Get the audio data as an array buffer
    const audioBuffer = await response.arrayBuffer();

    // Determine the content type based on the file extension
    const fileExtension = key.split(".").pop()?.toLowerCase();
    const contentType =
      fileExtension === "mp3"
        ? "audio/mpeg"
        : fileExtension === "wav"
        ? "audio/wav"
        : fileExtension === "ogg"
        ? "audio/ogg"
        : fileExtension === "m4a"
        ? "audio/mp4"
        : "application/octet-stream";

    console.log(
      `Serving audio file with content type: ${contentType}, size: ${audioBuffer.byteLength} bytes`
    );

    // Return the audio file with appropriate headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Range",
        "Accept-Ranges": "bytes",
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("Error in audio proxy:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
