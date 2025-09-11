// Define types for event creation and management

// Voice settings types
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
  gender?: VoiceSettingsGender;
  age?: VoiceSettingsAge;
  tone?: VoiceSettingsTone;
  accent?: VoiceSettingsAccent;
  speed?: VoiceSettingsSpeed;
  pitch?: VoiceSettingsPitch;
}

// Script segment types
export type ScriptSegmentStatus =
  | "draft"
  | "editing"
  | "generating"
  | "generated"
  | "failed"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export interface ScriptSegment {
  id: number;
  type: string;
  content: string;
  audio_url?: string | null; // Added to match database field
  status: ScriptSegmentStatus;
  order: number;
  timing: number;
  presentationSlide: string | null;
}

// Input type for creating or updating script segments
export interface ScriptSegmentInput {
  type: string;
  content: string;
  status: ScriptSegmentStatus;
  audio_url?: string | null;
  timing?: number | null;
  order: number;
}

// Event types
export interface Event {
  eventId: number;
  title: string;
  description?: string;
  eventType: string;
  status: "draft" | "ready" | "completed" | "cancelled";
  location?: string;
  eventDate: string;
  expectedAttendees?: number;
  voiceSettings?: VoiceSettings;
  language: string;
  updatedAt?: string;
  createdAt: string;
  scriptSegments: ScriptSegment[];
}
