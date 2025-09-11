import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import audioReducer from "./slices/audioSlice";
import projectReducer from "./slices/projectSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    audio: audioReducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths
        ignoredActions: [
          "audio/setAudioManager",
          "audio/registerAudioElement",
          "audio/addPlayingSegment",
          "audio/removePlayingSegment",
          "audio/setPlaying",
          "audio/setAudioInitialized",
        ],
        ignoredPaths: ["audio.audioManager"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
