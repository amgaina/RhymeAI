import { NextResponse } from "next/server";
import {
  generateTTS,
  getVoiceConfigFromSettings,
  isTTSConfigured,
} from "@/lib/google-tts";

/**
 * API route for generating TTS audio directly from text
 * This is a simplified version for the playground
 */
export async function POST(req: Request) {
  try {
    const { text, voiceSettings } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    return await generateTTSResponse(text, voiceSettings);
  } catch (error) {
    console.error("TTS API route error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for streaming TTS
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const text = url.searchParams.get("text");
    const voiceSettingsParam = url.searchParams.get("voiceSettings");

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    let voiceSettings = {};
    if (voiceSettingsParam) {
      try {
        voiceSettings = JSON.parse(voiceSettingsParam);
      } catch (e) {
        console.warn("Failed to parse voiceSettings:", e);
      }
    }

    return await generateTTSResponse(text, voiceSettings);
  } catch (error) {
    console.error("TTS API route error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to generate TTS response
 */
async function generateTTSResponse(text: string, voiceSettings: any = {}) {
  // Check if TTS is configured
  if (!isTTSConfigured()) {
    return NextResponse.json(
      { error: "Google TTS is not properly configured" },
      { status: 500 }
    );
  }

  // Default voice settings if none provided
  const defaultVoiceSettings = {
    name: "en-US-Neural2-F",
    languageCode: "en-US",
    ssmlGender: "FEMALE",
    speakingRate: 1.0,
    pitch: 0,
    volumeGainDb: 0,
  };

  // Merge with provided settings
  const mergedSettings = { ...defaultVoiceSettings, ...voiceSettings };

  // Get voice configuration
  const voiceConfig = getVoiceConfigFromSettings(mergedSettings);

  try {
    // Generate TTS
    const audioBuffer = await generateTTS(text, voiceConfig);

    // Return the audio data directly
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (ttsError) {
    console.error("TTS generation error:", ttsError);
    return NextResponse.json(
      {
        error: "Failed to generate audio",
        details: ttsError instanceof Error ? ttsError.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
