// Server-side voice settings types (must match database schema)
export type VoiceSettingsTone =
  | "professional"
  | "casual"
  | "energetic"
  | "calm"
  | "authoritative";
export type VoiceSettingsGender = "male" | "female" | "neutral";
export type VoiceSettingsAge = "young" | "middle-aged" | "mature";
export type VoiceSettingsSpeed = "slow" | "medium" | "fast";
export type VoiceSettingsAccent =
  | "american"
  | "british"
  | "australian"
  | "indian"
  | "neutral";
export type VoiceSettingsPitch = "low" | "medium" | "high";

export interface VoiceSettings {
  gender: VoiceSettingsGender;
  age?: VoiceSettingsAge;
  tone: VoiceSettingsTone;
  accent?: VoiceSettingsAccent;
  speed: VoiceSettingsSpeed;
  pitch?: VoiceSettingsPitch;
}

// Script types for server actions
export interface ScriptSegmentInput {
  type: string;
  content: string;
  status: string;
  audio_url?: string | null;
  timing?: number;
  order: number;
}

export type ScriptSegment = {
  id: number;
  type: string;
  content: string;
  audio_url?: string | null;
  status: "draft" | "editing" | "generating" | "generated";
  timing?: number | null;
  order: number;
};

export type PresentationSlide = {
  segmentId: number;
  slidePath: string;
  thumbnailUrl?: string;
};

export type RecordingDevice = {
  id: string;
  name: string;
  type: "audio" | "video" | "output" | "display";
  connected: boolean;
  streaming: boolean;
};

export type StreamDestination = {
  id: string;
  name: string;
  connected: boolean;
  url?: string;
};

export type EventSettings = {
  autoAdaptive?: boolean;
  autoSlideTransition?: boolean;
  audioNormalization?: boolean;
  promptForFeedback?: boolean;
  streamingQuality?: "low" | "medium" | "high";
  recordingFormat?: "mp3" | "wav" | "mp4";
  analytics?: {
    viewCount?: number;
    averageAttentionTime?: number;
    interactionRate?: number;
    feedbackScore?: number;
    lastUpdated?: string;
    [key: string]: any; // For any additional analytics properties
  };
};
