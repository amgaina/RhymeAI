import { configureStore } from "@reduxjs/toolkit";
import { audioReducer, projectReducer, AudioPlaybackState } from "./slices";
import { ProjectState } from "./slices/projectSlice";
// Define the root state interface explicitly
export interface RootState {
  audio: AudioPlaybackState;
  project: ProjectState;
}

// Configure the store with properly typed reducers
export const store = configureStore({
  reducer: {
    audio: audioReducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values like Audio objects
    }),
});

// Export the AppDispatch type
export type AppDispatch = typeof store.dispatch;
