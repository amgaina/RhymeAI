/**
 * Google Text-to-Speech utilities for RhymeAI
 * Handles TTS generation using Google Cloud TTS API
 */
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { uploadToS3, generateAudioKey, getS3Url } from "./s3-utils";
import { db } from "./db";

// Initialize Google TTS client
let ttsClient: TextToSpeechClient | null = null;

try {
  // Check if we have credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Try to parse as JSON first
    try {
      // If it's a valid JSON string, use it as credentials
      const credentials = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      );
      ttsClient = new TextToSpeechClient({ credentials });
    } catch (parseError) {
      // If it's not valid JSON, it might be an API key
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.startsWith("AIza")) {
        // It looks like an API key, use it directly
        console.log("Using Google API key for authentication");
        ttsClient = new TextToSpeechClient({
          credentials: {
            client_email: undefined,
            private_key: undefined,
          },
          projectId: process.env.GOOGLE_PROJECT_ID,
          apiEndpoint: "texttospeech.googleapis.com",
          auth: {
            apiKey: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
          },
        });
      } else {
        // Not JSON and not an API key
        console.error("Invalid Google credentials format:", parseError);
      }
    }
  } else if (process.env.GOOGLE_API_KEY) {
    // Alternative: use GOOGLE_API_KEY if available
    console.log("Using GOOGLE_API_KEY for authentication");
    ttsClient = new TextToSpeechClient({
      credentials: {
        client_email: undefined,
        private_key: undefined,
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
      apiEndpoint: "texttospeech.googleapis.com",
      auth: {
        apiKey: process.env.GOOGLE_API_KEY,
      },
    });
  } else {
    // Try to use Application Default Credentials
    console.log("Attempting to use Application Default Credentials");
    ttsClient = new TextToSpeechClient();
  }
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
 */
export const DEFAULT_VOICES: Record<string, VoiceConfig> = {
  professional: {
    languageCode: "en-US",
    name: "en-US-Neural2-F",
    ssmlGender: "FEMALE",
    speakingRate: 0.95,
    pitch: 0,
  },
  casual: {
    languageCode: "en-US",
    name: "en-US-Neural2-D",
    ssmlGender: "MALE",
    speakingRate: 1.0,
    pitch: -0.5,
  },
  energetic: {
    languageCode: "en-US",
    name: "en-US-Neural2-H",
    ssmlGender: "FEMALE",
    speakingRate: 1.05,
    pitch: 1.0,
  },
  formal: {
    languageCode: "en-US",
    name: "en-US-Neural2-J",
    ssmlGender: "MALE",
    speakingRate: 0.9,
    pitch: -1.0,
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

    // Configure the request
    const request = {
      input: { ssml },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: voiceConfig.speakingRate || 1.0,
        pitch: voiceConfig.pitch || 0,
        volumeGainDb: voiceConfig.volumeGainDb || 0,
      },
    };

    // Generate the audio
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content returned from Google TTS");
    }

    return Buffer.from(response.audioContent as Uint8Array);
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
  const settings =
    typeof voiceSettings === "string"
      ? JSON.parse(voiceSettings)
      : voiceSettings;

  // Get the voice type or default to professional
  const voiceType = settings.type?.toLowerCase() || "professional";

  // Get the base voice configuration
  const baseConfig = DEFAULT_VOICES[voiceType] || DEFAULT_VOICES.professional;

  // Override with custom settings if provided
  return {
    ...baseConfig,
    languageCode:
      settings.languageCode || settings.language || baseConfig.languageCode,
    speakingRate: settings.speakingRate || baseConfig.speakingRate,
    pitch: settings.pitch || baseConfig.pitch,
    volumeGainDb: settings.volumeGainDb || baseConfig.volumeGainDb,
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
    // Get voice configuration
    const voiceConfig = getVoiceConfigFromSettings(voiceSettings);

    // Generate TTS
    const audioBuffer = await generateTTS(text, voiceConfig);

    // Generate S3 key
    const s3Key = generateAudioKey(eventId, segmentId);

    // Upload to S3
    await uploadToS3(audioBuffer, s3Key);

    // Return the S3 URL
    return getS3Url(s3Key);
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
  // Remove SSML tags for calculation
  const cleanText = text.replace(/<[^>]+>/g, "");

  // Count words (approximately 150 words per minute at normal speed)
  const wordCount = cleanText.split(/\s+/).length;

  // Calculate duration based on word count and speaking rate
  // Adjust the 150 WPM baseline based on speaking rate
  const durationInMinutes = wordCount / (150 * speakingRate);

  // Convert to seconds and add a small buffer
  return Math.ceil(durationInMinutes * 60) + 2;
}
