"use client";

import { create } from 'zustand';

// Define the types of UI components that can be opened from chat
export type ChatUIComponentType = 'layout' | 'script' | 'audio' | 'none';

// Interface for the UI bridge store
interface ChatUIBridgeStore {
  // Current component to show
  activeComponent: ChatUIComponentType;
  // Data to pass to the component
  componentData: any;
  // Function to open a component
  openComponent: (type: ChatUIComponentType, data: any) => void;
  // Function to close the current component
  closeComponent: () => void;
}

// Create the store
export const useChatUIBridge = create<ChatUIBridgeStore>((set) => ({
  activeComponent: 'none',
  componentData: null,
  openComponent: (type, data) => set({ activeComponent: type, componentData: data }),
  closeComponent: () => set({ activeComponent: 'none', componentData: null }),
}));

/**
 * Open the layout viewer from chat
 * @param eventId The event ID
 * @param layoutData Optional layout data if already available
 */
export function openLayoutFromChat(eventId: string | number, layoutData?: any) {
  useChatUIBridge.getState().openComponent('layout', { eventId, layoutData });
}

/**
 * Open the script viewer from chat
 * @param eventId The event ID
 * @param scriptData Optional script data if already available
 */
export function openScriptFromChat(eventId: string | number, scriptData?: any) {
  useChatUIBridge.getState().openComponent('script', { eventId, scriptData });
}

/**
 * Open the audio player from chat
 * @param eventId The event ID
 * @param segmentId Optional segment ID to play
 */
export function openAudioFromChat(eventId: string | number, segmentId?: number) {
  useChatUIBridge.getState().openComponent('audio', { eventId, segmentId });
}

/**
 * Close any open component
 */
export function closeComponentFromChat() {
  useChatUIBridge.getState().closeComponent();
}
