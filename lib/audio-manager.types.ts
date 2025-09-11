/**
 * Type definitions for the audio manager used in the application
 */

export interface AudioManagerCallbacks {
  onPlay?: (id: string) => void;
  onEnded?: (id: string) => void;
  onError?: (id: string, error: Error) => void;
}

export interface AudioManager {
  // Updated to match the actual implementation
  getAudio: (id: string, url?: string) => HTMLAudioElement;
  play: (
    id: string,
    url?: string,
    settings?: { volume?: number; currentTime?: number }
  ) => Promise<void>;
  pause: (id: string) => void;
  stopAll: () => void;
  isPlaying: (id: string) => boolean;
  getCurrentTime: () => number;
  dispose: () => void;
  setVolume?: (id: string, volume: number) => void; // Make optional for backward compatibility
  // Add aliases for compatibility
  stop?: (id: string) => void; // Alias for pause
  load?: (id: string, url: string) => void; // May be implemented separately
}
