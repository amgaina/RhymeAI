import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import {
  AudioSegment,
  AudioTrack,
  ProjectData,
  TrimSettings,
  PresentationSlide,
} from "@/types/audio-editor";
import { RootState } from "../store";

// Re-export the types for consumers
export type {
  AudioTrack,
  ProjectData,
  AudioSegment,
  TrimSettings,
} from "@/types/audio-editor";

// UI state
interface UIState {
  selectedTrack: number;
  zoomLevel: number;
  isLoading: boolean;
  editingScript: string;
  trimming: TrimSettings | null;
}

// Export the project state interface for use in the store
export interface ProjectState {
  project: ProjectData;
  ui: UIState;
}

const initialState: ProjectState = {
  project: {
    id: uuidv4(),
    name: "New Project",
    duration: 60,
    tracks: [
      {
        id: 1,
        type: "emcee",
        name: "Emcee Voice",
        volume: 100,
        muted: false,
        color: "#4f46e5",
        locked: false,
        segments: [],
      },
      {
        id: 2,
        type: "background",
        name: "Background Music",
        volume: 50,
        muted: false,
        color: "#10b981",
        locked: false,
        segments: [],
      },
      {
        id: 3,
        type: "effects",
        name: "Sound Effects",
        volume: 70,
        muted: false,
        color: "#f59e0b",
        locked: false,
        segments: [],
      },
    ],
    slides: [],
  },
  ui: {
    selectedTrack: 1,
    zoomLevel: 1,
    isLoading: false,
    editingScript: "",
    trimming: null,
  },
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    // Project data actions
    setProject: (state, action: PayloadAction<ProjectData>) => {
      state.project = action.payload;
    },
    updateTrackVolume: (
      state,
      action: PayloadAction<{ trackId: number; volume: number }>
    ) => {
      const track = state.project.tracks.find(
        (t) => t.id === action.payload.trackId
      );
      if (track) {
        track.volume = action.payload.volume;
      }
    },
    toggleTrackMute: (state, action: PayloadAction<number>) => {
      const track = state.project.tracks.find((t) => t.id === action.payload);
      if (track) {
        track.muted = !track.muted;
      }
    },
    toggleTrackLock: (state, action: PayloadAction<number>) => {
      const track = state.project.tracks.find((t) => t.id === action.payload);
      if (track) {
        track.locked = !track.locked;
      }
    },
    addSegments: (
      state,
      action: PayloadAction<{ trackId: number; segments: AudioSegment[] }>
    ) => {
      const track = state.project.tracks.find(
        (t) => t.id === action.payload.trackId
      );
      if (track) {
        track.segments = [...track.segments, ...action.payload.segments];
      }
    },
    updateSegmentTiming: (
      state,
      action: PayloadAction<{
        segmentId: string;
        startTime: number;
        endTime: number;
      }>
    ) => {
      const { segmentId, startTime, endTime } = action.payload;
      state.project.tracks.forEach((track) => {
        const segment = track.segments.find((s) => s.id === segmentId);
        if (segment) {
          segment.startTime = startTime;
          segment.endTime = endTime;
        }
      });
    },
    deleteSegment: (state, action: PayloadAction<string>) => {
      const segmentId = action.payload;

      // Find the track that contains this segment
      state.project.tracks.forEach((track) => {
        // Filter out the segment with the matching ID
        const initialLength = track.segments.length;
        track.segments = track.segments.filter(
          (segment) => segment.id !== segmentId
        );

        // If we removed a segment, log it
        if (track.segments.length < initialLength) {
          console.log(`Deleted segment ${segmentId} from track ${track.id}`);
        }
      });
    },

    // UI actions
    setSelectedTrack: (state, action: PayloadAction<number>) => {
      state.ui.selectedTrack = action.payload;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.ui.zoomLevel = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.isLoading = action.payload;
    },
    setEditingScript: (state, action: PayloadAction<string>) => {
      state.ui.editingScript = action.payload;
    },
    setTrimming: (state, action: PayloadAction<TrimSettings | null>) => {
      state.ui.trimming = action.payload;
    },
    addTrack: (
      state,
      action: PayloadAction<{
        type: "emcee" | "background" | "effects";
        name: string;
      }>
    ) => {
      // Find the highest track ID and increment by 1
      const maxId = state.project.tracks.reduce(
        (max, track) => Math.max(max, track.id),
        0
      );
      const newId = maxId + 1;

      // Create a new track with default values
      const newTrack: AudioTrack = {
        id: newId,
        type: action.payload.type,
        name: action.payload.name,
        volume: 80,
        muted: false,
        color:
          action.payload.type === "emcee"
            ? "#4f46e5"
            : action.payload.type === "background"
            ? "#10b981"
            : "#f59e0b",
        locked: false,
        segments: [],
      };

      // Add the new track to the project
      state.project.tracks.push(newTrack);

      // Select the new track
      state.ui.selectedTrack = newId;
    },
  },
});

// Export actions
export const {
  setProject,
  updateTrackVolume,
  toggleTrackMute,
  toggleTrackLock,
  addSegments,
  updateSegmentTiming,
  deleteSegment,
  setSelectedTrack,
  setZoomLevel,
  setIsLoading,
  setEditingScript,
  setTrimming,
  addTrack,
} = projectSlice.actions;

// Selectors - Add explicit type annotations to parameters
export const selectProject = (state: RootState) => state.project.project;
export const selectAllSegments = (state: RootState) =>
  state.project.project.tracks.flatMap((track: AudioTrack) => track.segments);
export const selectTracks = (state: RootState) => state.project.project.tracks;
export const selectSelectedTrack = (state: RootState) =>
  state.project.ui.selectedTrack;
export const selectZoomLevel = (state: RootState) => state.project.ui.zoomLevel;
export const selectIsLoading = (state: RootState) => state.project.ui.isLoading;
export const selectEditingScript = (state: RootState) =>
  state.project.ui.editingScript;
export const selectTrimming = (state: RootState) => state.project.ui.trimming;

export default projectSlice.reducer;
