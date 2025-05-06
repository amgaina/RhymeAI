"use server";

import {
  generateTTS,
  getVoiceConfigFromSettings,
  isTTSConfigured,
} from "@/lib/google-tts";
import { uploadToS3, generateAudioKey, isS3Configured } from "@/lib/s3-utils";
import {
  saveAudioToFilesystem,
  isFilesystemStorageAvailable,
} from "@/lib/fs-utils";

/**
 * Generate TTS for playground text input
 * This is a simplified version of the TTS generation for testing purposes
 */
export async function generatePlaygroundTTS(
  text: string,
  voiceSettings: any = {}
) {
  try {
    // Check if TTS is configured
    if (!isTTSConfigured()) {
      return {
        success: false,
        error: "Google TTS is not properly configured",
      };
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

    // Generate TTS
    const audioBuffer = await generateTTS(text, voiceConfig);

    // Generate a unique key for the audio file
    const timestamp = Date.now();
    const filename = `tts-${timestamp}.mp3`;
    const s3Key = `playground/${filename}`;

    // Check if S3 is configured
    let audioUrl: string;
    if (isS3Configured()) {
      // Upload to S3
      audioUrl = await uploadToS3(audioBuffer, s3Key);
      console.log("Uploaded audio to S3:", audioUrl);
    } else if (isFilesystemStorageAvailable()) {
      // Store in server filesystem
      audioUrl = await saveAudioToFilesystem(audioBuffer, filename);
      console.log("Saved audio to server filesystem:", audioUrl);
    } else {
      // Fallback to mock URL if neither S3 nor filesystem is available
      audioUrl = `/mock-audio/playground-${timestamp}.mp3`;
      console.log(
        "Neither S3 nor filesystem storage is configured, using mock URL:",
        audioUrl
      );
    }

    return {
      success: true,
      audioUrl,
      message: "TTS generated successfully",
    };
  } catch (error) {
    console.error("Error generating playground TTS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate TTS",
    };
  }
}
