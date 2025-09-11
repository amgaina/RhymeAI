import { ScriptSegmentStatus } from "./event";

/**
 * Core audio segment interface with sufficient flexibility for all components
 */
export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  audioUrl: string | null;
  status: AudioSegmentStatus;
}

/**
 * Restrict status to values all components can handle
 * This is a subset of ScriptSegmentStatus that all components support
 */
export type AudioSegmentStatus =
  | "draft"
  | "generating"
  | "generated"
  | "failed";

export interface AudioTrack {
  id: number;
  type: "emcee" | "background" | "effects";
  name: string;
  volume: number;
  muted: boolean;
  color: string;
  locked: boolean;
  segments: AudioSegment[];
}

export interface PresentationSlide {
  id: number;
  title: string;
  time: number;
  imageUrl: string;
  notes: string;
}

export interface ProjectData {
  id: string;
  name: string;
  duration: number;
  tracks: AudioTrack[];
  slides: PresentationSlide[];
}

export interface TrimSettings {
  segmentId: string;
  trackId: number;
  audioUrl: string;
  name: string;
}

export interface AudioManagerCallbacks {
  onPlay?: (id: string) => void;
  onPause?: (id: string) => void;
  onEnded?: (id: string) => void;
  onError?: (id: string, error: Error) => void;
}

/**
 * Interface for the audio manager that matches what createAudioManager returns
 */
export interface AudioManager {
  getAudio: (id: string, url?: string) => HTMLAudioElement;
  play: (
    id: string,
    url?: string,
    settings?: { volume?: number; currentTime?: number }
  ) => Promise<boolean>;
  pause: (id: string) => Promise<boolean>;
  stopAll: () => Promise<void>;
  isPlaying: (id: string) => boolean;
  isActiveSegment: (id: string) => boolean;
  setSegmentActive: (id: string, active: boolean) => void;
  setSolo: (id: string, solo: boolean) => void;
  isSoloActive: () => boolean;
  getSoloSegmentId: () => string | null;
  getOrCreateAudio: (id: string, url: string) => HTMLAudioElement;
  getAudioDuration: (id: string) => number | undefined;
  isLoaded: (id: string) => boolean;
  getCurrentTime: (id: string) => number | null;
  trimAudio: (
    sourceUrl: string,
    startTimeSeconds: number,
    endTimeSeconds: number
  ) => Promise<string>;
  dispose: () => void;
}

/**
 * Helper function to convert from ScriptSegmentStatus to AudioSegmentStatus
 */
export function adaptSegmentStatus(
  status: ScriptSegmentStatus
): AudioSegmentStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "generating":
      return "generating";
    case "generated":
      return "generated";
    case "failed":
      return "failed";
    default:
      return "draft";
  }
}
