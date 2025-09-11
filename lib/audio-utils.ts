/**
 * Utilities for handling audio playback and duration detection in the audio editor
 */

// Type definitions for audio player manager
interface AudioManagerOptions {
  onPlay?: (id: string) => void;
  onPause?: (id: string) => void;
  onEnded?: (id: string) => void;
  onError?: (id: string, error: Error) => void;
}

/**
 * Improved Audio Manager implementation
 */
export function createAudioManager(options: AudioManagerOptions = {}) {
  const audioElements: Record<string, HTMLAudioElement> = {};
  const playPromises: Record<string, Promise<void> | null> = {};
  const playingIds = new Set<string>();
  // Add handling time tracking to detect stale play operations
  const lastPlayRequestTime: Record<string, number> = {};
  // Track segments that should be playing at the current time
  const activeSegmentIds = new Set<string>();
  // Track if we're in solo mode
  let soloModeActive = false;
  // Track which segment is in solo mode
  let soloSegmentId: string | null = null;

  return {
    /**
     * Get or create an audio element for a specific ID
     */
    getAudio(id: string, url?: string): HTMLAudioElement {
      if (!audioElements[id]) {
        audioElements[id] = new Audio();

        // Add event listeners
        audioElements[id].addEventListener("ended", () => {
          playingIds.delete(id);
          activeSegmentIds.delete(id);
          playPromises[id] = null;
          if (options.onEnded) options.onEnded(id);
        });

        audioElements[id].addEventListener("error", (e) => {
          playingIds.delete(id);
          activeSegmentIds.delete(id);
          playPromises[id] = null;
          if (options.onError)
            options.onError(id, new Error(`Audio error: ${e}`));
        });
      }

      // Update URL if provided
      if (url && audioElements[id].src !== url) {
        audioElements[id].src = url;
      }

      return audioElements[id];
    },

    /**
     * Safely play audio with robust handling and duplicate prevention
     * Returns true if playback started or was already playing
     */
    async play(
      id: string,
      url?: string,
      settings?: { volume?: number; currentTime?: number }
    ): Promise<boolean> {
      // Record this play request time
      const requestTime = Date.now();
      lastPlayRequestTime[id] = requestTime;

      try {
        // If this segment is already marked as playing and not seeking, don't attempt to play again
        if (playingIds.has(id)) {
          const audio = audioElements[id];

          // If we need to update the playback position, update it without restarting
          if (settings?.currentTime !== undefined && audio) {
            const currentPosition = audio.currentTime;
            // Only seek if the new time is significantly different to avoid unnecessary operations
            if (Math.abs(currentPosition - settings.currentTime) > 0.5) {
              audio.currentTime = settings.currentTime;
            }
          }

          // Update volume if needed
          if (settings?.volume !== undefined && audioElements[id]) {
            audioElements[id].volume = Math.max(
              0,
              Math.min(1, settings.volume)
            );
          }

          // Ensure the audio is actually playing (might have paused due to a browser event)
          if (audio && audio.paused) {
            try {
              await audio.play();
            } catch (e: any) {
              // Ignore AbortError errors
              if (e.name !== "AbortError") {
                console.warn("Attempted to resume already playing audio:", e);
              }
            }
          }

          // Add this to active segments
          activeSegmentIds.add(id);
          return true;
        }

        // Get or create the audio element
        const audio = this.getAudio(id, url);

        // Apply settings if provided
        if (settings) {
          if (settings.volume !== undefined) {
            audio.volume = Math.max(0, Math.min(1, settings.volume));
          }

          if (settings.currentTime !== undefined) {
            audio.currentTime = settings.currentTime;
          }
        }

        // Wait for any existing play operation to resolve or reject
        if (playPromises[id] !== null && playPromises[id] !== undefined) {
          try {
            await playPromises[id];
          } catch (e) {
            // Ignore errors from previous attempts
            console.log(`Previous play promise error resolved for ${id}`);
          }
        }

        // Reset the promise
        playPromises[id] = null;

        // If this request is no longer the most recent, abort
        if (lastPlayRequestTime[id] !== requestTime) {
          console.log(`Skipping superseded play request for ${id}`);
          return false;
        }

        // Mark as playing before the actual play call to prevent race conditions
        playingIds.add(id);
        activeSegmentIds.add(id);

        // If solo mode is active and this is not the solo segment, don't actually play
        // BUT only apply this check for individual segment plays, not during global playback
        // We can detect global playback by checking if multiple segments are active
        if (
          soloModeActive &&
          soloSegmentId !== id &&
          activeSegmentIds.size <= 1
        ) {
          console.log(
            `Skipping play for ${id} because solo mode is active for ${soloSegmentId}`
          );
          return false;
        }

        // Log with precision
        console.log(
          `Playing audio ${id} at position ${audio.currentTime.toFixed(
            2
          )}s, volume ${audio.volume.toFixed(2)}`
        );

        // Start playback
        try {
          // Check if the audio source is actually set
          if (!audio.src && url) {
            console.log(`Setting audio source for ${id} to ${url}`);
            audio.src = url;
            await new Promise((resolve) => {
              audio.onloadedmetadata = resolve;
              // Add timeout to avoid hanging
              setTimeout(resolve, 2000);
            });
          }

          // Force a load if needed
          if (audio.readyState < 2) {
            console.log(`Forcing load for ${id}`);
            audio.load();

            // Wait for the audio to be loaded enough to play
            if (audio.readyState < 2) {
              console.log(`Waiting for audio ${id} to load...`);
              await new Promise<void>((resolve) => {
                const loadHandler = () => {
                  audio.removeEventListener("canplaythrough", loadHandler);
                  resolve();
                };

                // Set a timeout to avoid hanging indefinitely
                setTimeout(() => {
                  audio.removeEventListener("canplaythrough", loadHandler);
                  console.log(
                    `Timeout waiting for audio ${id} to load, continuing anyway`
                  );
                  resolve();
                }, 2000);

                audio.addEventListener("canplaythrough", loadHandler);
              });
            }
          }

          // Now call play() which returns a promise in modern browsers
          console.log(`Calling play() for ${id}`);
          const playPromise = audio.play();

          // Store the promise for future reference, but handle browsers that don't return promises
          if (playPromise !== undefined) {
            playPromises[id] = playPromise;
            await playPromise;
          }

          if (options.onPlay) options.onPlay(id);
          return true;
        } catch (error) {
          // Handle play failure
          if (lastPlayRequestTime[id] === requestTime) {
            playingIds.delete(id);
            activeSegmentIds.delete(id);
          }

          // Only log non-abort errors
          if ((error as any).name !== "AbortError") {
            console.error(`Error playing audio ${id}:`, error);
          }
          return false;
        }
      } catch (error) {
        console.error(`Unexpected error for ${id}:`, error);
        if (lastPlayRequestTime[id] === requestTime) {
          playingIds.delete(id);
          activeSegmentIds.delete(id);
        }
        return false;
      }
    },

    /**
     * Safely pause audio
     */
    async pause(id: string): Promise<boolean> {
      lastPlayRequestTime[id] = 0; // Invalidate any pending play requests
      activeSegmentIds.delete(id);

      try {
        const audio = audioElements[id];
        if (!audio) return true;

        // Wait for any pending play operation to finish
        if (playPromises[id] !== null && playPromises[id] !== undefined) {
          try {
            await playPromises[id];
          } catch (e) {
            // Ignore errors from previous attempts
          }
        }

        // Reset the promise
        playPromises[id] = null;

        // Pause the audio
        audio.pause();
        playingIds.delete(id);

        if (options.onPause) options.onPause(id);
        return true;
      } catch (error) {
        console.error(`Error pausing audio ${id}:`, error);
        return false;
      }
    },

    /**
     * Stop all currently playing audio
     */
    async stopAll(): Promise<void> {
      // Reset play request times
      Object.keys(lastPlayRequestTime).forEach((id) => {
        lastPlayRequestTime[id] = 0;
      });

      const ids = Array.from(playingIds);
      activeSegmentIds.clear();

      // Also reset solo mode when stopping all
      soloModeActive = false;
      soloSegmentId = null;

      await Promise.all(ids.map((id) => this.pause(id)));
    },

    /**
     * Check if segment is currently playing
     * More reliable than checking HTML Audio element state
     */
    isPlaying(id: string): boolean {
      // Use our explicit tracking rather than audio.paused which can be inconsistent
      return playingIds.has(id);
    },

    /**
     * Check if segment is supposed to be active at the current time
     */
    isActiveSegment(id: string): boolean {
      return activeSegmentIds.has(id);
    },

    /**
     * Mark a segment as active/inactive
     */
    setSegmentActive(id: string, active: boolean): void {
      if (active) {
        activeSegmentIds.add(id);
      } else {
        activeSegmentIds.delete(id);
      }
    },

    /**
     * Enable solo mode for a specific segment
     */
    setSolo(id: string, solo: boolean): void {
      if (solo) {
        soloModeActive = true;
        soloSegmentId = id;

        // Pause all other playing segments
        playingIds.forEach((playingId) => {
          if (playingId !== id) {
            this.pause(playingId);
          }
        });
      } else {
        soloModeActive = false;
        soloSegmentId = null;
      }
    },

    /**
     * Check if solo mode is active
     */
    isSoloActive(): boolean {
      return soloModeActive;
    },

    /**
     * Get the current solo segment ID
     */
    getSoloSegmentId(): string | null {
      return soloSegmentId;
    },

    /**
     * Get or create the audio element for a segment
     */
    getOrCreateAudio(id: string, url: string): HTMLAudioElement {
      const audioId = `${id}`;

      // Create the audio element if it doesn't exist
      if (!audioElements[audioId]) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audioElements[audioId] = audio;
      }

      return audioElements[audioId];
    },

    /**
     * Get audio duration safely
     */
    getAudioDuration(id: string): number | undefined {
      if (audioElements[id]) {
        return audioElements[id].duration;
      }
      return undefined;
    },

    /**
     * Check if audio is loaded
     */
    isLoaded(id: string): boolean {
      return !!audioElements[id] && audioElements[id].readyState >= 2;
    },

    /**
     * Get current playback position
     */
    getCurrentTime(id: string): number | null {
      if (audioElements[id]) {
        return audioElements[id].currentTime;
      }
      return null;
    },

    /**
     * Trim an audio file (returns a new audio URL)
     */
    async trimAudio(
      sourceUrl: string,
      startTimeSeconds: number,
      endTimeSeconds: number
    ): Promise<string> {
      // In a real implementation, this would use Web Audio API to trim the audio
      // For now, we'll simulate trimming by returning the original URL
      console.log(
        `Trimming audio from ${startTimeSeconds}s to ${endTimeSeconds}s`
      );
      return sourceUrl;
    },

    /**
     * Clean up resources
     */
    dispose(): void {
      this.stopAll();

      // Clean up audio elements
      for (const id in audioElements) {
        try {
          audioElements[id].pause();
          audioElements[id].src = "";
          delete audioElements[id];
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Clear all state
      Object.keys(playPromises).forEach((id) => {
        playPromises[id] = null;
        delete playPromises[id];
      });

      playingIds.clear();
      activeSegmentIds.clear();
    },
  };
}

/**
 * Get the duration of an audio file by preloading it
 * Returns a promise that resolves with the duration in seconds
 */
export function getAudioFileDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      // First try using Web Audio API which is more reliable
      if (
        typeof AudioContext !== "undefined" ||
        typeof (window as any).webkitAudioContext !== "undefined"
      ) {
        try {
          const context = new (AudioContext ||
            (window as any).webkitAudioContext)();

          // Fetch the audio file
          fetch(url)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.arrayBuffer();
            })
            .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
            .then((audioBuffer) => {
              // Get the duration from the decoded audio buffer
              resolve(audioBuffer.duration);
              // Clean up the context
              if (
                context.state !== "closed" &&
                typeof context.close === "function"
              ) {
                context.close();
              }
            })
            .catch((error) => {
              console.warn(
                "Web Audio API method failed, falling back to Audio element:",
                error
              );
              // Fall back to Audio element method
              fallbackToAudioElement();
            });
        } catch (error) {
          console.warn(
            "Web Audio API initialization failed, falling back to Audio element:",
            error
          );
          // Fall back to Audio element method
          fallbackToAudioElement();
        }
      } else {
        // Web Audio API not supported, use Audio element
        fallbackToAudioElement();
      }

      // Fallback method using Audio element
      function fallbackToAudioElement() {
        const audio = new Audio();

        const handleDurationChange = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            cleanup();
            resolve(audio.duration);
          }
        };

        const handleMetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            cleanup();
            resolve(audio.duration);
          }
        };

        const handleCanPlayThrough = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            cleanup();
            resolve(audio.duration);
          }
        };

        const handleError = (e: Event) => {
          console.error("Audio element error:", e);
          cleanup();
          // Use a default value instead of rejecting
          console.warn("Using default duration of 30 seconds due to error");
          resolve(30);
        };

        const cleanup = () => {
          audio.removeEventListener("durationchange", handleDurationChange);
          audio.removeEventListener("loadedmetadata", handleMetadata);
          audio.removeEventListener("canplaythrough", handleCanPlayThrough);
          audio.removeEventListener("error", handleError);
          clearTimeout(timeout);
          // Don't need the audio anymore
          audio.src = "";
        };

        // Set a timeout to avoid hanging indefinitely
        const timeout = setTimeout(() => {
          cleanup();
          // If we can't determine duration, use a default value
          console.warn("Timeout reached, using default duration of 30 seconds");
          resolve(30); // Default 30 seconds
        }, 5000);

        // Add event listeners to get duration
        audio.addEventListener("durationchange", handleDurationChange);
        audio.addEventListener("loadedmetadata", handleMetadata);
        audio.addEventListener("canplaythrough", handleCanPlayThrough);
        audio.addEventListener("error", handleError);

        // Set crossOrigin to anonymous to handle CORS issues
        audio.crossOrigin = "anonymous";

        // Load the audio file
        audio.src = url;
        audio.load();
      }
    } catch (error) {
      console.error("Unhandled error in getAudioFileDuration:", error);
      // Use a default value instead of rejecting
      resolve(30);
    }
  });
}

/**
 * Create a blob URL from a File object
 * This function handles audio file import by creating a Blob URL
 */
export function createAudioFileUrl(file: File): string {
  try {
    // Validate that the file is an audio file
    if (!file.type.startsWith("audio/")) {
      console.warn(`File might not be audio: ${file.name} (${file.type})`);
      // Continue anyway since some valid audio files might have incorrect MIME types
    }

    // Make sure the file has content
    if (file.size === 0) {
      throw new Error("File is empty");
    }

    // Create and return the blob URL
    const blobUrl = URL.createObjectURL(file);
    console.log(`Created blob URL for file: ${file.name} (${blobUrl})`);

    // Validate that the blob URL was created successfully
    if (!blobUrl || blobUrl === "") {
      throw new Error("Failed to create blob URL");
    }

    return blobUrl;
  } catch (error) {
    console.error(`Error creating audio file URL for ${file.name}:`, error);
    throw new Error(
      `Failed to create audio URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Revoke a blob URL to prevent memory leaks
 */
export function revokeAudioFileUrl(url: string): void {
  try {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      console.log("Revoked blob URL:", url);
    }
  } catch (error) {
    console.error("Error revoking audio URL:", error);
  }
}

/**
 * Normalize audio file for better cross-browser compatibility
 * This helps ensure audio files work consistently across browsers by performing validation
 * and potentially converting problematic formats
 */
export async function normalizeAudioFile(
  file: File
): Promise<{ url: string; duration?: number; metadata?: Record<string, any> }> {
  try {
    // Validate the file is an audio file
    const isAudioMIME = file.type.startsWith("audio/");
    const hasAudioExtension = /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name);

    if (!isAudioMIME && !hasAudioExtension) {
      throw new Error(
        `File "${file.name}" does not appear to be a valid audio file`
      );
    }

    // Create a blob URL for the file
    const fileUrl = createAudioFileUrl(file);

    // Try to get audio duration
    let duration: number | undefined;
    try {
      duration = await getAudioFileDuration(fileUrl);
      console.log(`Detected duration for ${file.name}: ${duration}s`);
    } catch (error) {
      console.warn(
        `Could not detect duration for ${file.name}. Using metadata fallback.`,
        error
      );

      // For some formats like WAV files on Safari, we may need to use the File API
      // to extract duration directly from file metadata
      // This is a placeholder for future implementation
    }

    return {
      url: fileUrl,
      duration,
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };
  } catch (error) {
    console.error(`Error normalizing audio file ${file.name}:`, error);
    throw new Error(
      `Failed to process audio file ${file.name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Convert AudioBuffer to WAV format
 * This is a helper function for normalizeAudioFile
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Create the buffer for the WAV file
  const dataLength = buffer.length * numChannels * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // "fmt " sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk size
  view.setUint16(20, format, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // Byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write the PCM samples
  const offset = 44;
  const channelData = [];

  // Extract data from each channel
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let pos = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const sampleInt = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset + pos, sampleInt, true);
      pos += bytesPerSample;
    }
  }

  return arrayBuffer;
}

// Helper to write strings to a DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
