// Define types for event creation and management

// Script Segment Status
export type ScriptSegmentStatus =
  | "generating"
  | "draft"
  | "editing"
  | "generated";

// Script Segment structure
export interface ScriptSegmentBase {
  type: string;
  content: string;
  status: ScriptSegmentStatus;
  audio_url?: string | null;
  timing?: number;
  order: number;
}

export interface ScriptSegment extends ScriptSegmentBase {
  id: number;
  audio?: string | null;
}

// Voice Settings
export type VoiceSettingsGender = "male" | "female" | "neutral";
export type VoiceSettingsAge = "young" | "middle-aged" | "mature";
export type VoiceSettingsTone =
  | "professional"
  | "energetic"
  | "casual"
  | "calm"
  | "authoritative";
export type VoiceSettingsSpeed = "slow" | "medium" | "fast";

export interface VoiceSettings {
  gender: VoiceSettingsGender;
  age: VoiceSettingsAge;
  tone: VoiceSettingsTone;
  speed: VoiceSettingsSpeed;
  accent?: string;
}
