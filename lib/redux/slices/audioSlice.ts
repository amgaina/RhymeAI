import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AudioSegment, AudioManager } from "@/types/audio-editor";
import { RootState } from "../store";

// Re-export the types for consumers
export type { AudioSegment, AudioManager } from "@/types/audio-editor";

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
  },
});

// Export actions
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

export default audioSlice.reducer;
