/**
 * TTS service for RhymeAI
 * Handles text-to-speech conversion using Google Cloud TTS
 */
import {
  generateGoogleTTS,
  getBestGoogleVoiceMatch,
  getGoogleVoices,
} from "./google-tts-service";

/**
 * Generate audio from SSML using Google Cloud TTS
 * @param ssml The SSML to convert to audio
 * @param voiceId The voice ID to use
 * @returns A buffer containing the audio data
 */
export async function generateTTS(
  ssml: string,
  voiceId: string
): Promise<Buffer> {
  try {
    // Use Google Cloud TTS
    return await generateGoogleTTS(ssml, voiceId);
  } catch (error) {
    console.error("TTS generation failed:", error);
    // Fallback to mock audio if Google TTS fails
    return Buffer.from("Mock audio data");
  }
}

/**
 * Get available voices from the TTS service
 * @returns A list of available voices
 */
export async function getAvailableVoices() {
  // Get voices from Google Cloud TTS
  return await getGoogleVoices();
}

/**
 * Get the best voice for the given parameters
 * @param params Voice parameters
 * @returns The best matching voice ID
 */
export async function getBestVoiceMatch(params: {
  gender?: string;
  accent?: string;
  age?: string;
}): Promise<string> {
  // Use Google's voice matching function
  return await getBestGoogleVoiceMatch(params);
}
