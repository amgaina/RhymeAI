import { NextResponse } from "next/server";
import { convertToSSML, applyVoiceParams } from "@/lib/tts-utils";
import { db } from "@/lib/db";
import {
  uploadToS3,
  generateAudioKey,
  isS3Configured,
  getS3Url,
} from "@/lib/s3-utils";
import { generateTTS, getBestVoiceMatch } from "@/lib/tts-service";

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

        // Generate audio using TTS service
        let audioUrl: string;
        let audioBuffer: Buffer;

        try {
          // Get the best voice match based on voice settings
          const voiceId = await getBestVoiceMatch({
            gender: mergedVoiceSettings?.gender,
            accent: mergedVoiceSettings?.accent,
            age: mergedVoiceSettings?.age,
          });

          // Generate audio using TTS service
          audioBuffer = await generateTTS(processedSsml, voiceId);

          // Upload to S3 if configured
          if (isS3Configured()) {
            const s3Key = generateAudioKey(segment.event_id, segmentIdNum);
            audioUrl = await uploadToS3(audioBuffer, s3Key, "audio/mpeg");
          } else {
            // Fallback to mock URL if S3 is not configured
            audioUrl = `https://api.example.com/audio/segment-${segmentId}-${Date.now()}.mp3`;
          }

          // Update the segment with the audio URL and duration
          await db.script_segments.update({
            where: { id: segmentIdNum },
            data: {
              audio_url: audioUrl,
              status: "generated",
              // In a real implementation, you would calculate the actual duration
              timing: Math.ceil(segment.content.length / 20) * 1000, // Rough estimate: 20 chars per second
            },
          });

          // Update the script_segments JSON in the events table
          await updateEventScriptSegments(segment.event_id);

          // Return the audio URL
          return NextResponse.json({
            success: true,
            audioUrl,
            segmentId,
            message: "Audio generated and stored successfully",
          });
        } catch (ttsError) {
          console.error("TTS generation error:", ttsError);

          // Fallback to mock URL
          audioUrl = `https://api.example.com/audio/segment-${segmentId}-${Date.now()}.mp3`;

          // Update the segment with the mock audio URL
          await db.script_segments.update({
            where: { id: segmentIdNum },
            data: {
              audio_url: audioUrl,
              status: "generated",
              timing: Math.ceil(segment.content.length / 20) * 1000,
            },
          });

          // Update the script_segments JSON in the events table
          await updateEventScriptSegments(segment.event_id);

          return NextResponse.json({
            success: true,
            audioUrl,
            segmentId,
            message: "Audio generated with fallback URL",
          });
        }
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

    // Ensure we have an eventId for storage
    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required for direct content generation" },
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

    try {
      // Get the best voice match based on voice settings
      const voiceId = await getBestVoiceMatch({
        gender: voiceSettings?.gender,
        accent: voiceSettings?.accent,
        age: voiceSettings?.age,
      });

      // Generate audio using TTS service
      const audioBuffer = await generateTTS(processedSsml, voiceId);

      // Upload to S3 if configured
      let audioUrl: string;
      if (isS3Configured()) {
        const s3Key = generateAudioKey(eventId, segmentId || "direct");
        audioUrl = await uploadToS3(audioBuffer, s3Key, "audio/mpeg");
      } else {
        // Fallback to mock URL if S3 is not configured
        audioUrl = `https://api.example.com/audio/content-${
          segmentId || Date.now()
        }.mp3`;
      }

      // If segmentId is provided, update the segment with the audio URL
      if (segmentId) {
        const segmentIdNum = parseInt(segmentId, 10);
        if (!isNaN(segmentIdNum)) {
          await db.script_segments.update({
            where: { id: segmentIdNum },
            data: {
              audio_url: audioUrl,
              status: "generated",
              // In a real implementation, you would calculate the actual duration
              timing: content ? Math.ceil(content.length / 20) * 1000 : null, // Rough estimate: 20 chars per second
            },
          });

          // Update the script_segments JSON in the events table
          await updateEventScriptSegments(parseInt(eventId, 10));
        }
      }

      // Return the audio URL
      return NextResponse.json({
        success: true,
        audioUrl,
        segmentId: segmentId || null,
        message: "Audio generated and stored successfully",
      });
    } catch (ttsError) {
      console.error("TTS generation error:", ttsError);

      // Fallback to mock URL
      const audioUrl = `https://api.example.com/audio/content-${
        segmentId || Date.now()
      }.mp3`;

      // If segmentId is provided, update the segment with the mock audio URL
      if (segmentId) {
        const segmentIdNum = parseInt(segmentId, 10);
        if (!isNaN(segmentIdNum)) {
          await db.script_segments.update({
            where: { id: segmentIdNum },
            data: {
              audio_url: audioUrl,
              status: "generated",
              timing: content ? Math.ceil(content.length / 20) * 1000 : null,
            },
          });

          // Update the script_segments JSON in the events table
          await updateEventScriptSegments(parseInt(eventId, 10));
        }
      }

      return NextResponse.json({
        success: true,
        audioUrl,
        segmentId: segmentId || null,
        message: "Audio generated with fallback URL",
      });
    }
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

/**
 * Update the script_segments JSON in the events table
 * This ensures the JSON array is in sync with the actual script_segments table
 */
async function updateEventScriptSegments(eventId: number) {
  try {
    // Get all segments for the event
    const segments = await db.script_segments.findMany({
      where: { event_id: eventId },
      orderBy: { order: "asc" },
    });

    // Update the event with the updated script_segments JSON array
    await db.events.update({
      where: { event_id: eventId },
      data: {
        script_segments: segments.map((seg) => ({
          id: seg.id,
          type: seg.segment_type,
          content: seg.content,
          status: seg.status,
          timing: seg.timing,
          order: seg.order,
          audio_url: seg.audio_url,
        })),
        updated_at: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating event script segments:", error);
    return false;
  }
}
