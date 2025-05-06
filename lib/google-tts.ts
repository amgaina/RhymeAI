/**
 * Google Text-to-Speech utilities for RhymeAI
 * Handles TTS generation using Google Cloud TTS API
 */
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";
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
 */
export const DEFAULT_VOICES: Record<string, VoiceConfig> = {
  professional: {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No custom parameters to avoid API errors
  },
  casual: {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No custom parameters to avoid API errors
  },
  energetic: {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No custom parameters to avoid API errors
  },
  formal: {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No custom parameters to avoid API errors
  },
  mc: {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No custom parameters to avoid API errors
  },
};

/**
 * Parse SSML markers from text
 * Converts custom markers like [PAUSE=300] to proper SSML
 */
export function parseSSMLMarkers(text: string): string {
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
 * @param voiceSettings Voice settings
 * @returns Buffer containing the audio data
 */
export async function generateTTS(
  text: string,
  voiceSettings: any = {}
): Promise<Buffer> {
  try {
    const client = ttsClient;
    if (!client) {
      throw new Error("Google TTS client not initialized");
    }

    // Check if we're using Chirp voice
    const isChirpVoice = voiceSettings.name?.includes("Chirp");

    let inputText;
    let request;

    if (isChirpVoice) {
      // For Chirp voices: Use plain text input, not SSML
      // Strip any SSML tags and convert pause markers to periods or spaces
      inputText = text
        .replace(/\[PAUSE=\d+\]/g, ". ") // Replace pause markers with period + space
        .replace(/\[BREATHE\]/g, ". ") // Replace breathe with period + space
        .replace(/\[EMPHASIS\](.*?)\[\/EMPHASIS\]/g, "$1") // Remove emphasis tags
        .replace(/\[EMPHASIS\]/g, "")
        .replace(/\[\/EMPHASIS\]/g, "")
        .replace(/\[SLOW\](.*?)\[\/SLOW\]/g, "$1")
        .replace(/\[FAST\](.*?)\[\/FAST\]/g, "$1")
        .replace(/\[SOFT\](.*?)\[\/SOFT\]/g, "$1")
        .replace(/\[LOUD\](.*?)\[\/LOUD\]/g, "$1")
        .replace(/<[^>]*>?/gm, ""); // Remove any remaining HTML-like tags

      request = {
        input: { text: inputText.trim() }, // Use plain text for Chirp
        voice: {
          languageCode: "en-US",
          name: "en-US-Chirp3-HD-Achernar",
        },
        audioConfig: {
          audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
          sampleRateHertz: 24000,
          effectsProfileId: [
            "large-home-entertainment-class-device",
            "headphone-class-device",
          ],
        },
      };

      console.log("Google TTS request (Chirp voice with plain text):", {
        voice: request.voice,
        textLength: inputText.length,
      });
    } else {
      // For other voices: Use SSML
      inputText = parseSSMLMarkers(text.trim());

      request = {
        input: { ssml: inputText }, // Use SSML for non-Chirp voices
        voice: {
          languageCode: voiceSettings.languageCode || "en-US",
          name: voiceSettings.name || "en-US-Studio-O",
        },
        audioConfig: {
          audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
          sampleRateHertz: 24000,
          effectsProfileId: [
            "large-home-entertainment-class-device",
            "headphone-class-device",
          ],
        },
      };

      console.log("Google TTS request (non-Chirp voice with SSML):", {
        voice: request.voice,
        textLength: inputText.length,
      });
    }

    // Generate speech
    try {
      const [response] = await client.synthesizeSpeech(request);

      if (!response.audioContent) {
        throw new Error("No audio content generated");
      }

      return Buffer.from(response.audioContent as string, "base64");
    } catch (error) {
      // If first attempt failed, try fallback to Studio voice
      if (isChirpVoice) {
        console.error(
          "Error with Chirp voice, trying Studio voice as fallback:",
          error
        );

        const fallbackRequest = {
          input: { text: inputText }, // Keep using plain text
          voice: {
            languageCode: "en-US",
            name: "en-US-Studio-O",
          },
          audioConfig: {
            audioEncoding:
              protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
            sampleRateHertz: 24000,
            effectsProfileId: [
              "large-home-entertainment-class-device",
              "headphone-class-device",
            ],
          },
        };

        console.log("Fallback TTS request:", {
          voice: fallbackRequest.voice,
          textLength: inputText.length,
        });

        const [fallbackResponse] = await client.synthesizeSpeech(
          fallbackRequest
        );

        if (!fallbackResponse.audioContent) {
          throw new Error("No audio content generated from fallback voice");
        }

        return Buffer.from(fallbackResponse.audioContent as string, "base64");
      } else {
        throw error; // Re-throw if not using Chirp voice
      }
    }
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
  // Always return the Chirp voice configuration regardless of settings
  return {
    languageCode: "en-US",
    name: "en-US-Chirp3-HD-Achernar",
    ssmlGender: "MALE",
    // No additional parameters to avoid errors
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
  // Remove HTML/XML tags if any
  const cleanText = text.replace(/<[^>]*>?/gm, "");

  // Calculate word count (splitting by spaces)
  const wordCount = cleanText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Average English word takes about 0.3-0.4 seconds to speak
  // Adjust based on speaking rate (if provided)
  const averageWordDuration = 0.35 / speakingRate;

  // Calculate duration in seconds
  let duration = wordCount * averageWordDuration;

  // Add a small buffer (for pauses, etc.)
  duration += 1.0;

  return Math.round(duration);
}
