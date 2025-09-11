"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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
import { AudioSegment, AudioTrack, ProjectData } from "@/types/audio-editor";

/**
 * Generate audio for a segment of text
 * @param content The text content to generate audio for
 * @param voiceSettings Optional voice configuration
 * @returns URL to the generated audio file
 */
export async function generateSegmentAudio(
  content: string,
  voiceSettings: any = {}
): Promise<string> {
  try {
    console.log(`Generating audio for: ${content}`);

    // Check if TTS is configured
    if (!isTTSConfigured()) {
      console.log("TTS not configured, using mock audio");
      // Fallback to mock behavior if TTS is not configured
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockAudioUrl = `/api/audio/${Date.now()}.mp3`;
      return mockAudioUrl;
    }

    // Default voice settings for emcee
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
    const audioBuffer = await generateTTS(content, voiceConfig);

    // Generate a unique key for the audio file
    const timestamp = Date.now();
    const segmentHash = Buffer.from(content.substring(0, 20))
      .toString("hex")
      .substring(0, 8);
    const filename = `segment-${segmentHash}-${timestamp}.mp3`;
    const s3Key = `audio-editor/${filename}`;

    // Store the audio file and get URL
    let audioUrl: string;

    // Try to upload to S3 first
    if (isS3Configured()) {
      audioUrl = await uploadToS3(audioBuffer, s3Key);
      console.log("Uploaded segment audio to S3:", audioUrl);
    }
    // If S3 is not available, try filesystem storage
    else if (isFilesystemStorageAvailable()) {
      audioUrl = await saveAudioToFilesystem(audioBuffer, filename);
      console.log("Saved segment audio to filesystem:", audioUrl);
    }
    // If neither is available, use a mock URL
    else {
      audioUrl = `/api/audio/${timestamp}.mp3`;
      console.log("Using mock audio URL:", audioUrl);
    }

    return audioUrl;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio");
  }
}

/**
 * Save project data
 * @param project The project data to save
 * @returns ID of the saved project
 */
export async function saveProject(project: ProjectData): Promise<string> {
  try {
    // In production, this would save to a database
    console.log("Saving project:", project.name);

    // For development, simulate saving by storing in cookies or localStorage
    const projectId = project.id;

    // Store a simplified version in cookies
    const cookieStore = await cookies();
    await cookieStore.set({
      name: `rhymeai-audio-project-${projectId}`,
      value: JSON.stringify({
        id: projectId,
        name: project.name,
        lastModified: new Date().toISOString(),
      }),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, we would revalidate paths that show project listings
    revalidatePath("/playground/audio-editor");

    return projectId;
  } catch (error) {
    console.error("Error saving project:", error);
    throw new Error("Failed to save project");
  }
}

/**
 * Export project audio as a single file
 * @param projectId The ID of the project to export
 * @returns URL to the exported audio file
 */
export async function exportProjectAudio(projectId: string): Promise<string> {
  try {
    // In production, this would combine all audio segments,
    // apply volume adjustments, and create a final audio file
    console.log(`Exporting audio for project: ${projectId}`);

    // Simulate processing time for audio export
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate a mock download URL
    // In production, this would be a signed URL to the processed file
    const downloadUrl = `/api/export/${projectId}/${Date.now()}.mp3`;

    return downloadUrl;
  } catch (error) {
    console.error("Error exporting project audio:", error);
    throw new Error("Failed to export project audio");
  }
}

/**
 * Get a list of available voices for TTS
 * @returns Array of voice options
 */
export async function getAvailableVoices(): Promise<
  Array<{ id: string; name: string; language: string }>
> {
  try {
    // In production, this would fetch from a voice API
    console.log("Fetching available voices");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock voice data
    return [
      { id: "v1", name: "Professional Male", language: "en-US" },
      { id: "v2", name: "Professional Female", language: "en-US" },
      { id: "v3", name: "Casual Male", language: "en-US" },
      { id: "v4", name: "Casual Female", language: "en-US" },
      { id: "v5", name: "Energetic Male", language: "en-US" },
      { id: "v6", name: "Energetic Female", language: "en-US" },
      { id: "v7", name: "British Male", language: "en-GB" },
      { id: "v8", name: "British Female", language: "en-GB" },
    ];
  } catch (error) {
    console.error("Error fetching voices:", error);
    return []; // Return empty array on error to prevent UI breaking
  }
}

/**
 * Get available background music options
 * @returns Array of background music options
 */
export async function getBackgroundMusicOptions(): Promise<
  Array<{ id: string; name: string; category: string; duration: string }>
> {
  try {
    // In production, this would fetch from a music library API
    console.log("Fetching background music options");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock background music data
    return [
      {
        id: "bg1",
        name: "Corporate Inspiration",
        category: "Corporate",
        duration: "2:30",
      },
      {
        id: "bg2",
        name: "Conference Opening",
        category: "Conference",
        duration: "1:45",
      },
      {
        id: "bg3",
        name: "Technology Innovation",
        category: "Technology",
        duration: "3:10",
      },
      {
        id: "bg4",
        name: "Motivational Ambient",
        category: "Motivational",
        duration: "2:15",
      },
      {
        id: "bg5",
        name: "Presentation Background",
        category: "Corporate",
        duration: "2:00",
      },
      {
        id: "bg6",
        name: "Subtle Tech Beat",
        category: "Technology",
        duration: "1:30",
      },
      {
        id: "bg7",
        name: "Uplifting Corporate",
        category: "Corporate",
        duration: "2:45",
      },
      {
        id: "bg8",
        name: "Gentle Conference",
        category: "Conference",
        duration: "2:10",
      },
    ];
  } catch (error) {
    console.error("Error fetching background music:", error);
    return []; // Return empty array on error to prevent UI breaking
  }
}
