/**
 * Types for event layout structures
 */

export type SegmentType =
  | "introduction"
  | "keynote"
  | "panel"
  | "break"
  | "q_and_a"
  | "conclusion"
  | "presentation"
  | "demo"
  | "theory"
  | "practical"
  | "group_work"
  | "agenda"
  | "discussion"
  | "action_items"
  | "main_content";

// Layout segment interface for working with layouts
export interface LayoutSegment {
  id: string; // UUID for the segment
  name: string; // Display name of the segment
  type: SegmentType; // Type of segment
  description: string; // Brief description of the segment
  duration: number; // Duration in minutes
  order: number; // Order in the event flow
  startTime?: string; // Start time in format "HH:MM AM/PM"
  endTime?: string; // End time in format "HH:MM AM/PM"
  customProperties?: Record<string, any>; // For segment-specific properties
}

// Event layout structure
export interface EventLayout {
  id: number | string;
  eventId: number;
  segments: LayoutSegment[];
  totalDuration: number;
  lastUpdated: string; // ISO string
  version?: number; // For tracking changes
}

// Templates for different event types
export const EVENT_TYPES = [
  "conference",
  "webinar",
  "workshop",
  "corporate",
  "general",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Response types for API calls
export interface LayoutResponse {
  success: boolean;
  layout?: EventLayout | null;
  message?: string;
  error?: string;
  newSegment?: LayoutSegment; // For add operations
}

export interface SegmentResponse {
  success: boolean;
  segment?: LayoutSegment | null;
  message?: string;
  error?: string;
}

export interface ScriptResponse {
  success: boolean;
  segments?: any[];
  message?: string;
  error?: string;
}

// Database model types for type safety with Prisma
export interface EventLayoutDB {
  id: number;
  event_id: number;
  total_duration: number;
  layout_version: number;
  created_at: Date;
  updated_at: Date;
  last_generated_by: string | null;
  chat_context: string | null;
  segments?: LayoutSegmentDB[];
}

export interface LayoutSegmentDB {
  id: string;
  layout_id: number;
  name: string;
  type: string;
  description: string;
  duration: number;
  order: number;
  start_time: string | null;
  end_time: string | null;
  custom_properties: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface ScriptSegmentDB {
  id: number;
  event_id: number;
  layout_segment_id: string | null;
  segment_type: string;
  content: string;
  audio_url: string | null;
  status: "draft" | "editing" | "generating" | "generated";
  timing: number;
  order: number;
  created_at: Date;
  updated_at: Date;
}
