import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import {
  AudioSegment,
  AudioManager,
  TrimSettings,
  AudioTrack,
} from "@/types/audio-editor";
import { RootState } from "../store";

// Export the audio state interface for use in the store
export interface AudioPlaybackState {
  isPlaying: boolean;
  audioInitialized: boolean;
  currentTime: number;
  masterVolume: number;
  activeSegment: string | null;
  playingSegments: string[];
  audioElementIds: string[];
  audioManager: AudioManager | null;
  selectedTrack: number | null;
  zoomLevel: number;
  isLoading: boolean;
  editingScript: string;
  trimming: TrimSettings | null;
  project: {
    id: string;
    name: string;
    duration: number;
    tracks: AudioTrack[];
    slides: {
      id: number;
      title: string;
      time: number;
      imageUrl: string;
      notes: string;
    }[];
  };
}

const initialState: AudioPlaybackState = {
  isPlaying: false,
  audioInitialized: false,
  currentTime: 0,
  masterVolume: 80,
  activeSegment: null,
  playingSegments: [],
  audioElementIds: [],
  audioManager: null,
  selectedTrack: 1, // Default to selecting the first track (Emcee)
  zoomLevel: 1,
  isLoading: false,
  editingScript: "",
  trimming: null,
  project: {
    id: "default-project",
    name: "New Project",
    duration: 600, // 10 minutes
    tracks: [
      {
        id: 1,
        type: "emcee",
        name: "Emcee Voice",
        volume: 100,
        muted: false,
        color: "#4f46e5", // Indigo
        locked: false,
        segments: [],
      },
      {
        id: 2,
        type: "background",
        name: "Background Music",
        volume: 60,
        muted: false,
        color: "#16a34a", // Green
        locked: false,
        segments: [],
      },
      {
        id: 3,
        type: "effects",
        name: "Sound Effects",
        volume: 80,
        muted: false,
        color: "#f59e0b", // Amber
        locked: false,
        segments: [],
      },
    ],
    slides: [],
  },
};

export const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setAudioInitialized: (state, action: PayloadAction<boolean>) => {
      state.audioInitialized = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setMasterVolume: (state, action: PayloadAction<number>) => {
      state.masterVolume = action.payload;
    },
    setActiveSegment: (state, action: PayloadAction<string | null>) => {
      state.activeSegment = action.payload;
    },
    addPlayingSegment: (state, action: PayloadAction<string>) => {
      if (!state.playingSegments.includes(action.payload)) {
        state.playingSegments.push(action.payload);
      }
    },
    removePlayingSegment: (state, action: PayloadAction<string>) => {
      state.playingSegments = state.playingSegments.filter(
        (id) => id !== action.payload
      );
    },
    clearPlayingSegments: (state) => {
      state.playingSegments = [];
    },
    registerAudioElement: (state, action: PayloadAction<string>) => {
      if (!state.audioElementIds.includes(action.payload)) {
        state.audioElementIds.push(action.payload);
      }
    },
    unregisterAudioElement: (state, action: PayloadAction<string>) => {
      state.audioElementIds = state.audioElementIds.filter(
        (id) => id !== action.payload
      );
    },
    setAudioManager: (state, action: PayloadAction<AudioManager | null>) => {
      state.audioManager = action.payload;
    },
    setProject: (state, action: PayloadAction<typeof state.project>) => {
      state.project = action.payload;
    },
    setSelectedTrack: (state, action: PayloadAction<number | null>) => {
      state.selectedTrack = action.payload;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setEditingScript: (state, action: PayloadAction<string>) => {
      state.editingScript = action.payload;
    },
    setTrimming: (state, action: PayloadAction<TrimSettings | null>) => {
      state.trimming = action.payload;
    },
    addTrack: (
      state,
      action: PayloadAction<{
        type: "emcee" | "background" | "effects";
        name: string;
      }>
    ) => {
      const { type, name } = action.payload;
      const newTrackId =
        state.project.tracks.length > 0
          ? Math.max(...state.project.tracks.map((t) => t.id)) + 1
          : 1;
      const colors = {
        emcee: "#4f46e5",
        background: "#16a34a",
        effects: "#f59e0b",
      };
      state.project.tracks.push({
        id: newTrackId,
        type,
        name,
        volume: 80,
        muted: false,
        color: colors[type] || "#6b7280", // No need for type assertion now
        locked: false,
        segments: [],
      });
    },
    deleteSegment: (state, action: PayloadAction<string>) => {
      const segmentId = action.payload;
      for (const track of state.project.tracks) {
        const segmentIndex = track.segments.findIndex(
          (s) => s.id === segmentId
        );
        if (segmentIndex !== -1) {
          track.segments.splice(segmentIndex, 1);
          break;
        }
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
      for (const track of state.project.tracks) {
        const segmentIndex = track.segments.findIndex(
          (s) => s.id === segmentId
        );
        if (segmentIndex !== -1) {
          track.segments[segmentIndex].startTime = startTime;
          track.segments[segmentIndex].endTime = endTime;
          break;
        }
      }
    },
    addSegments: (
      state,
      action: PayloadAction<{ trackId: number; segments: AudioSegment[] }>
    ) => {
      const { trackId, segments } = action.payload;
      const track = state.project.tracks.find((t) => t.id === trackId);
      if (track) {
        track.segments.push(...segments);
      }
    },
    updateTrackVolume: (
      state,
      action: PayloadAction<{ trackId: number; volume: number }>
    ) => {
      const { trackId, volume } = action.payload;
      const track = state.project.tracks.find((t) => t.id === trackId);
      if (track) {
        track.volume = volume;
      }
    },
    toggleTrackLock: (state, action: PayloadAction<number>) => {
      const track = state.project.tracks.find((t) => t.id === action.payload);
      if (track) {
        track.locked = !track.locked;
      }
    },
    toggleTrackMute: (state, action: PayloadAction<number>) => {
      const track = state.project.tracks.find((t) => t.id === action.payload);
      if (track) {
        track.muted = !track.muted;
      }
    },
  },
});

export const {
  setPlaying,
  setAudioInitialized,
  setCurrentTime,
  setMasterVolume,
  setActiveSegment,
  addPlayingSegment,
  removePlayingSegment,
  clearPlayingSegments,
  registerAudioElement,
  unregisterAudioElement,
  setAudioManager,
  setProject,
  setSelectedTrack,
  setZoomLevel,
  setIsLoading,
  setEditingScript,
  setTrimming,
  addTrack,
  deleteSegment,
  updateSegmentTiming,
  addSegments,
  updateTrackVolume,
  toggleTrackLock,
  toggleTrackMute,
} = audioSlice.actions;

// Selectors
export const selectIsPlaying = (state: RootState) => state.audio.isPlaying;
export const selectAudioInitialized = (state: RootState) =>
  state.audio.audioInitialized;
export const selectCurrentTime = (state: RootState) => state.audio.currentTime;
export const selectMasterVolume = (state: RootState) =>
  state.audio.masterVolume;
export const selectActiveSegment = (state: RootState) =>
  state.audio.activeSegment;
export const selectPlayingSegments = (state: RootState) =>
  state.audio.playingSegments;
export const selectAudioElementIds = (state: RootState) =>
  state.audio.audioElementIds;
export const selectAudioManager = (state: RootState) =>
  state.audio.audioManager;
export const selectProject = (state: RootState) => state.audio.project;
export const selectTracks = createSelector(
  [selectProject],
  (project) => project.tracks
);
export const selectAllSegments = createSelector([selectTracks], (tracks) => {
  return tracks.flatMap((track) => track.segments);
});
export const selectSegmentById = createSelector(
  [selectAllSegments, (_, segmentId: string) => segmentId],
  (segments, segmentId) =>
    segments.find((segment) => segment.id === segmentId) || null
);
export const selectSegmentsByTrackId = createSelector(
  [selectTracks, (_, trackId: number) => trackId],
  (tracks, trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    return track ? track.segments : [];
  }
);
export const selectSelectedTrack = (state: RootState) =>
  state.audio.selectedTrack;
export const selectZoomLevel = (state: RootState) => state.audio.zoomLevel;
export const selectIsLoading = (state: RootState) => state.audio.isLoading;
export const selectEditingScript = (state: RootState) =>
  state.audio.editingScript;
export const selectTrimming = (state: RootState) => state.audio.trimming;

export default audioSlice.reducer;
