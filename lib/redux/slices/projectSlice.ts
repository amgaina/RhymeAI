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
  setSelectedTrack,
  setZoomLevel,
  setIsLoading,
  setEditingScript,
  setTrimming,
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
