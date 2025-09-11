import fs from "fs";
import path from "path";

// Define the base directory for storing audio files
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const PUBLIC_AUDIO_PATH = "/audio"; // Path to access files from the public URL

/**
 * Ensure the audio directory exists
 */
function ensureAudioDirectory() {
  try {
    // Check if the audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      // Create the directory recursively
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error("Error ensuring audio directory exists:", error);
    return false;
  }
}

/**
 * Save audio buffer to the server filesystem
 * @param audioBuffer The audio data buffer
 * @param filename The filename to save as
 * @returns The public URL path to access the file
 */
export async function saveAudioToFilesystem(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  // Ensure the audio directory exists
  if (!ensureAudioDirectory()) {
    throw new Error("Failed to create audio directory");
  }

  try {
    // Clean the filename to prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(AUDIO_DIR, safeFilename);

    // Write the file
    fs.writeFileSync(filePath, audioBuffer);

    // Return the public URL path
    return `${PUBLIC_AUDIO_PATH}/${safeFilename}`;
  } catch (error) {
    console.error("Error saving audio to filesystem:", error);
    throw new Error(
      `Failed to save audio file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check if filesystem storage is available
 */
export function isFilesystemStorageAvailable(): boolean {
  return ensureAudioDirectory();
}
