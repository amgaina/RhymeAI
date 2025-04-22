import { NextResponse } from "next/server";
import { convertToSSML, applyVoiceParams } from "@/lib/tts-utils";
import { db } from "@/lib/db";

/**
 * API route for generating TTS audio from text or script segments
 * This is a more comprehensive implementation than the basic /api/tts route
 */
export async function POST(req: Request) {
  try {
    const { content, scriptData, voiceSettings, segmentId } = await req.json();

    // If segmentId is provided, fetch the segment content from the database
    if (segmentId && !content && !scriptData) {
      try {
        // Convert string segmentId to number
        const segmentIdNum = parseInt(segmentId, 10);

        if (isNaN(segmentIdNum)) {
          return NextResponse.json(
            { error: "Invalid segment ID format" },
            { status: 400 }
          );
        }

        // Fetch the segment from the database
        const segment = await db.script_segments.findUnique({
          where: { id: segmentIdNum },
        });

        if (!segment) {
          return NextResponse.json(
            { error: "Segment not found" },
            { status: 404 }
          );
        }

        // Get the event to fetch voice settings
        const event = await db.events.findUnique({
          where: { event_id: segment.event_id },
          select: { voice_settings: true },
        });

        // Use the segment content and event voice settings
        const segmentScriptData = {
          title: segment.segment_type,
          sections: [{ name: segment.segment_type, content: segment.content }],
        };

        // Generate SSML from the segment content
        const ssml = convertToSSML(segmentScriptData);

        // Apply voice settings from the event or the request
        const mergedVoiceSettings = {
          ...event?.voice_settings,
          ...voiceSettings,
        };

        // Apply voice settings to the SSML
        const processedSsml = applyVoiceParams(ssml, mergedVoiceSettings || {});

        // In a real implementation, you would call your TTS API here
        // For example:
        // const audioBuffer = await callExternalTtsApi(processedSsml, mergedVoiceSettings);
        // const audioUrl = await uploadToS3(audioBuffer, `segment-${segmentId}.mp3`);

        // For now, we'll simulate a successful audio generation
        const mockAudioUrl = `https://api.example.com/audio/segment-${segmentId}-${Date.now()}.mp3`;

        // Return the audio URL
        return NextResponse.json({
          success: true,
          audioUrl: mockAudioUrl,
          segmentId,
          message: "Audio generated successfully for segment",
        });
      } catch (dbError) {
        console.error("Database error fetching segment:", dbError);
        return NextResponse.json(
          {
            success: false,
            error:
              dbError instanceof Error ? dbError.message : "Database error",
          },
          { status: 500 }
        );
      }
    }

    // Handle direct content or scriptData
    // Validate input
    if (!content && !scriptData) {
      return NextResponse.json(
        { error: "Either content, scriptData, or segmentId must be provided" },
        { status: 400 }
      );
    }

    // Prepare data for TTS generation
    let ssml: string;

    if (scriptData) {
      // If scriptData is provided, convert it to SSML
      ssml = convertToSSML(scriptData);
    } else if (content) {
      // If only content is provided, wrap it in a simple script structure
      const simpleScriptData = {
        title: "Content",
        sections: [{ name: "Content", content }],
      };
      ssml = convertToSSML(simpleScriptData);
    } else {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    // Apply voice settings to the SSML
    const processedSsml = applyVoiceParams(ssml, voiceSettings || {});

    // In a real implementation, you would call your TTS API here
    // For example:
    // const audioBuffer = await callExternalTtsApi(processedSsml, voiceSettings);
    // const audioUrl = await uploadToS3(audioBuffer, `content-${Date.now()}.mp3`);

    // For now, we'll simulate a successful audio generation
    const mockAudioUrl = `https://api.example.com/audio/content-${
      segmentId || Date.now()
    }.mp3`;

    // Return the audio URL
    return NextResponse.json({
      success: true,
      audioUrl: mockAudioUrl,
      segmentId: segmentId || null,
      message: "Audio generated successfully",
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
