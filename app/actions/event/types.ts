export type VoiceSettings = {
  gender: "male" | "female" | "neutral";
  age: "young" | "middle-aged" | "mature";
  tone: "professional" | "casual" | "energetic" | "calm" | "authoritative";
  accent?: string;
  speed: "slow" | "medium" | "fast";
};

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
