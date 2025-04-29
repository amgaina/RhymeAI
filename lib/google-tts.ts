/**
 * Google Text-to-Speech utilities for RhymeAI
 * Handles TTS generation using Google Cloud TTS API
 */
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { uploadToS3, generateAudioKey } from "./s3-utils";
import { db } from "./db";

// Initialize Google TTS client
let ttsClient: TextToSpeechClient | null = null;
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./rhymeai.json";

try {
  // Simple initialization using environment credentials
  ttsClient = new TextToSpeechClient();
  console.log("Google TTS client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Google TTS client:", error);
}

/**
 * Check if Google TTS is properly configured
 */
export function isTTSConfigured(): boolean {
  return (
    !!ttsClient &&
    (!!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
      !!process.env.GOOGLE_API_KEY ||
      !!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

/**
 * Voice configuration interface
 */
export interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: "NEUTRAL" | "MALE" | "FEMALE";
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

/**
 * Default voice configurations
 *
 * Valid ranges for parameters:
 * - speakingRate: 0.25 to 2.0 (Google TTS API limit)
 * - pitch: -20.0 to 20.0
 * - volumeGainDb: -96.0 to 16.0
 */
export const DEFAULT_VOICES: Record<string, VoiceConfig> = {
  professional: {
    languageCode: "en-US",
    name: "en-US-Neural2-F",
    ssmlGender: "FEMALE",
    speakingRate: 0.95, // Within valid range
    pitch: 0, // Within valid range
    volumeGainDb: 0, // Within valid range
  },
  casual: {
    languageCode: "en-US",
    name: "en-US-Neural2-D",
    ssmlGender: "MALE",
    speakingRate: 1.0, // Within valid range
    pitch: 0, // Neutral pitch to avoid distortion
    volumeGainDb: 0, // Within valid range
  },
  energetic: {
    languageCode: "en-US",
    name: "en-US-Neural2-H",
    ssmlGender: "FEMALE",
    speakingRate: 1.05, // Within valid range
    pitch: 1.0, // Within valid range
    volumeGainDb: 2.0, // Within valid range
  },
  formal: {
    languageCode: "en-US",
    name: "en-US-Neural2-J",
    ssmlGender: "MALE",
    speakingRate: 0.9, // Within valid range
    pitch: -1.0, // Within valid range
    volumeGainDb: 0, // Within valid range
  },
  mc: {
    languageCode: "en-US",
    name: "en-US-Neural2-D", // Male voice with good projection
    ssmlGender: "MALE",
    speakingRate: 1.15, // Slightly faster, but not rushed (good for MC)
    pitch: 1.5, // Slightly higher for enthusiasm
    volumeGainDb: 4.0, // More projection and presence
  },
};

/**
 * Parse SSML markers from text
 * Converts custom markers like [PAUSE=300] to proper SSML
 */
function parseSSMLMarkers(text: string): string {
  // Replace custom markers with SSML tags
  let ssml = text
    // Replace [PAUSE=X] with <break time="Xms"/>
    .replace(/\[PAUSE=(\d+)\]/g, (_, ms) => `<break time="${ms}ms"/>`)
    // Replace [BREATHE] with a natural pause and breathing sound
    .replace(/\[BREATHE\]/g, '<break time="500ms"/>')
    // Replace [EMPHASIS] with emphasis tag
    .replace(
      /\[EMPHASIS\](.*?)\[\/EMPHASIS\]/g,
      '<emphasis level="strong">$1</emphasis>'
    )
    .replace(/\[EMPHASIS\]/g, '<emphasis level="strong">')
    .replace(/\[\/EMPHASIS\]/g, "</emphasis>")
    // Replace other markers as needed
    .replace(/\[SLOW\](.*?)\[\/SLOW\]/g, '<prosody rate="slow">$1</prosody>')
    .replace(/\[FAST\](.*?)\[\/FAST\]/g, '<prosody rate="fast">$1</prosody>')
    .replace(/\[SOFT\](.*?)\[\/SOFT\]/g, '<prosody volume="soft">$1</prosody>')
    .replace(/\[LOUD\](.*?)\[\/LOUD\]/g, '<prosody volume="loud">$1</prosody>');

  // Wrap in speak tags if not already present
  if (!ssml.includes("<speak>")) {
    ssml = `<speak>${ssml}</speak>`;
  }

  return ssml;
}

/**
 * Generate TTS audio using Google Cloud TTS
 * @param text The text to convert to speech
 * @param voiceConfig Voice configuration
 * @returns Buffer containing the audio data
 */
export async function generateTTS(
  text: string,
  voiceConfig: VoiceConfig
): Promise<Buffer> {
  if (!ttsClient) {
    throw new Error("Google TTS client not initialized");
  }

  try {
    // Parse SSML markers
    const ssml = parseSSMLMarkers(text);

    // Validate all parameters to ensure they're within valid ranges

    // 1. Speaking rate: valid range is 0.25 to 2.0 (Google TTS API limit)
    const speakingRate = voiceConfig.speakingRate || 1.0;
    const validSpeakingRate = Math.max(0.25, Math.min(2.0, speakingRate));
    if (speakingRate !== validSpeakingRate) {
      console.warn(
        `Speaking rate adjusted from ${speakingRate} to ${validSpeakingRate} to be within valid range (0.25 to 2.0)`
      );
    }

    // 2. Pitch: valid range is -20.0 to 20.0
    const pitch = voiceConfig.pitch || 0;
    const validPitch = Math.max(-20.0, Math.min(20.0, pitch));
    if (pitch !== validPitch) {
      console.warn(
        `Pitch adjusted from ${pitch} to ${validPitch} to be within valid range (-20.0 to 20.0)`
      );
    }

    // 3. Volume gain: valid range is -96.0 to 16.0
    const volumeGainDb = voiceConfig.volumeGainDb || 0;
    const validVolumeGainDb = Math.max(-96.0, Math.min(16.0, volumeGainDb));
    if (volumeGainDb !== validVolumeGainDb) {
      console.warn(
        `Volume gain adjusted from ${volumeGainDb} to ${validVolumeGainDb} to be within valid range (-96.0 to 16.0)`
      );
    }

    // Configure the request with validated parameters
    const request = {
      input: { ssml },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: validSpeakingRate,
        pitch: validPitch,
        volumeGainDb: validVolumeGainDb,
        // Higher quality audio settings for MC-style voice
        sampleRateHertz: 24000, // Increased from default for better clarity
        // Use effects profiles suited for presentation and announcement scenarios
        effectsProfileId: [
          "large-home-entertainment-class-device", // For better projection
          "headphone-class-device", // For clarity and detail
        ],
      },
    };

    // Log the request for debugging
    console.log("Google TTS request:", {
      languageCode: request.voice.languageCode,
      name: request.voice.name,
      ssmlGender: request.voice.ssmlGender,
      speakingRate: request.audioConfig.speakingRate,
      pitch: request.audioConfig.pitch,
      volumeGainDb: request.audioConfig.volumeGainDb,
      sampleRateHertz: request.audioConfig.sampleRateHertz,
      effectsProfileId: request.audioConfig.effectsProfileId,
      textLength: ssml.length,
    });

    // Generate the audio
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content returned from Google TTS");
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    console.log(`Generated audio buffer size: ${audioBuffer.length} bytes`);
    return audioBuffer;
  } catch (error) {
    console.error("Error generating TTS:", error);
    throw new Error(
      `Failed to generate TTS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get voice configuration from event settings
 * @param voiceSettings Voice settings from the event
 * @returns Voice configuration
 */
export function getVoiceConfigFromSettings(voiceSettings: any): VoiceConfig {
  // Default to professional voice if no settings provided
  if (!voiceSettings) {
    return DEFAULT_VOICES.professional;
  }

  // If voiceSettings is a string, try to parse it
  let settings;
  if (typeof voiceSettings === "string") {
    try {
      settings = JSON.parse(voiceSettings);
    } catch (error) {
      console.error("Error parsing voice settings JSON:", error);
      console.warn("Using default voice settings due to parsing error");
      return DEFAULT_VOICES.professional;
    }
  } else {
    settings = voiceSettings;
  }

  // Get the voice type or default to professional
  const voiceType = settings.type?.toLowerCase() || "professional";

  // Get the base voice configuration
  const baseConfig = DEFAULT_VOICES[voiceType] || DEFAULT_VOICES.professional;

  // Validate all parameters to ensure they're within valid ranges

  // 1. Speaking rate: valid range is 0.25 to 2.0 (Google TTS API limit)
  // Convert from percentage (0-100) to actual rate (0.25-2.0) if needed
  let speakingRate;
  if (settings.speakingRate !== undefined) {
    // If it's a percentage (0-100), convert to actual rate
    if (settings.speakingRate >= 0 && settings.speakingRate <= 100) {
      // Map 0-100 to 0.25-2.0
      speakingRate = 0.25 + (settings.speakingRate / 100) * (2.0 - 0.25);
    } else {
      // Assume it's already in the correct range
      speakingRate = settings.speakingRate;
    }
  } else {
    speakingRate = baseConfig.speakingRate || 1.0;
  }
  // Ensure it's within valid range
  speakingRate = Math.max(0.25, Math.min(2.0, speakingRate));

  // 2. Pitch: valid range is -20.0 to 20.0
  // Convert from percentage (-100 to 100) to actual pitch (-20 to 20) if needed
  let pitch;
  if (settings.pitch !== undefined) {
    // If it's a percentage (-100 to 100), convert to actual pitch
    if (settings.pitch >= -100 && settings.pitch <= 100) {
      // Map -100-100 to -20-20
      pitch = (settings.pitch / 100) * 20;
    } else {
      // Assume it's already in the correct range
      pitch = settings.pitch;
    }
  } else {
    pitch = baseConfig.pitch || 0;
  }
  // Ensure it's within valid range
  pitch = Math.max(-20.0, Math.min(20.0, pitch));

  // 3. Volume gain: valid range is -96.0 to 16.0
  // For volume, we'll keep it at 0 (neutral) to avoid distortion
  let volumeGainDb = settings.volumeGainDb || baseConfig.volumeGainDb || 0;
  volumeGainDb = Math.max(-6.0, Math.min(6.0, volumeGainDb)); // More conservative range

  // If MC type is specified, apply special handling
  if (voiceType === "mc") {
    // For MC type, we want to ensure energetic, clear delivery
    speakingRate = settings.speakingRate ?? 1.15;
    pitch = settings.pitch ?? 1.5;
    volumeGainDb = settings.volumeGainDb ?? 4.0;

    // Ensure parameters are within valid ranges but favor MC characteristics
    speakingRate = Math.max(0.9, Math.min(1.35, speakingRate)); // Narrower range for clarity
    pitch = Math.max(0, Math.min(3.0, pitch)); // Keep positive for energy
    volumeGainDb = Math.max(2.0, Math.min(6.0, volumeGainDb)); // Ensure good projection

    // Override voice if not specifically requested
    if (!settings.name) {
      baseConfig.name = "en-US-Neural2-D"; // Default to a good MC voice
      baseConfig.ssmlGender = "MALE";
    }
  }

  // Override with custom settings if provided, using validated values
  return {
    ...baseConfig,
    languageCode:
      settings.languageCode || settings.language || baseConfig.languageCode,
    speakingRate: speakingRate,
    pitch: pitch,
    volumeGainDb: volumeGainDb,
  };
}

/**
 * Generate TTS for a script segment and upload to S3
 * @param segmentId The segment ID
 * @param eventId The event ID
 * @param text The text to convert to speech
 * @param voiceSettings Voice settings from the event
 * @returns The S3 URL of the uploaded audio
 */
export async function generateAndUploadTTS(
  segmentId: number,
  eventId: number,
  text: string,
  voiceSettings: any
): Promise<string> {
  try {
    console.log(
      `Starting TTS generation for segment ${segmentId} of event ${eventId}`
    );

    // Log voice settings for debugging
    console.log(
      `Voice settings for segment ${segmentId}:`,
      typeof voiceSettings === "string"
        ? voiceSettings.substring(0, 100) + "..."
        : JSON.stringify(voiceSettings).substring(0, 100) + "..."
    );

    // Get voice configuration
    const voiceConfig = getVoiceConfigFromSettings(voiceSettings);
    console.log(
      `Validated voice config for segment ${segmentId}:`,
      JSON.stringify(voiceConfig)
    );

    // Generate TTS
    console.log(
      `Generating TTS audio for segment ${segmentId} with text length: ${text.length} characters`
    );
    const audioBuffer = await generateTTS(text, voiceConfig);
    console.log(
      `Successfully generated TTS audio for segment ${segmentId}, buffer size: ${audioBuffer.length} bytes`
    );

    // Generate S3 key
    const s3Key = generateAudioKey(eventId, segmentId);
    console.log(`Generated S3 key for segment ${segmentId}: ${s3Key}`);

    // Upload to S3
    console.log(`Uploading audio for segment ${segmentId} to S3...`);
    try {
      await uploadToS3(audioBuffer, s3Key);
      console.log(
        `Successfully uploaded audio for segment ${segmentId} to S3 with key: ${s3Key}`
      );

      // Return just the S3 key, not the full URL
      // This will be used to generate presigned URLs on demand
      return s3Key;
    } catch (error) {
      console.error(
        `Error uploading audio for segment ${segmentId} to S3:`,
        error
      );
      throw new Error(
        `Failed to upload audio to S3: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } catch (error) {
    console.error(
      `Error generating and uploading TTS for segment ${segmentId}:`,
      error
    );
    throw new Error(
      `Failed to generate and upload TTS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Delete audio files for an event from S3
 * @param eventId The event ID
 * @returns True if successful
 */
export async function deleteEventAudio(eventId: number): Promise<boolean> {
  try {
    // In a real implementation, you would use the S3 DeleteObjects command
    // to delete all audio files for the event
    // For now, we'll just log the deletion
    console.log(`Deleting audio files for event ${eventId}`);

    // Return success
    return true;
  } catch (error) {
    console.error(`Error deleting audio files for event ${eventId}:`, error);
    return false;
  }
}

/**
 * Delete audio file for a segment from S3
 * @param eventId The event ID
 * @param segmentId The segment ID
 * @returns True if successful
 */
export async function deleteSegmentAudio(
  eventId: number,
  segmentId: number
): Promise<boolean> {
  try {
    // Get the segment to find the audio URL
    const segment = await db.script_segments.findUnique({
      where: { id: segmentId },
      select: { audio_url: true },
    });

    if (!segment?.audio_url) {
      // No audio to delete
      return true;
    }

    // In a real implementation, you would extract the key from the URL
    // and use the S3 DeleteObject command to delete the file
    // For now, we'll just log the deletion
    console.log(
      `Deleting audio file for segment ${segmentId} in event ${eventId}`
    );

    // Return success
    return true;
  } catch (error) {
    console.error(`Error deleting audio file for segment ${segmentId}:`, error);
    return false;
  }
}

/**
 * Calculate the estimated duration of TTS audio in seconds
 * @param text The text to estimate duration for
 * @param speakingRate The speaking rate (default: 1.0)
 * @returns Estimated duration in seconds
 */
export function estimateTTSDuration(
  text: string,
  speakingRate: number = 1.0
): number {
  // Ensure speaking rate is within valid range (0.25 to 2.0)
  const validSpeakingRate = Math.max(0.25, Math.min(2.0, speakingRate));

  // Remove SSML tags for calculation
  const cleanText = text.replace(/<[^>]+>/g, "");

  // Count words (approximately 150 words per minute at normal speed)
  const wordCount = cleanText.split(/\s+/).length;

  // Calculate duration based on word count and speaking rate
  // Adjust the 150 WPM baseline based on speaking rate
  const durationInMinutes = wordCount / (150 * validSpeakingRate);

  // Convert to seconds and add a small buffer
  return Math.ceil(durationInMinutes * 60) + 2;
}
