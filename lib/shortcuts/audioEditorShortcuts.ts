import {
  KeyboardShortcut,
  ShortcutGroup,
  createCrossPlatformShortcut,
  CrossPlatformShortcut,
} from "../hooks/useKeyboardShortcuts";

// Define shortcut creator functions for different platforms
export const createShortcuts = (actions: {
  // Playback controls
  togglePlayPause: () => void;
  stopPlayback: () => void;
  skipForward: () => void;
  skipBackward: () => void;

  // Volume controls
  increaseVolume: () => void;
  decreaseVolume: () => void;
  toggleMute: () => void;

  // Track management
  addTrack: () => void;
  selectNextTrack: () => void;
  selectPreviousTrack: () => void;
  toggleTrackLock: () => void;
  toggleTrackMute: () => void;

  // Segment management
  addSegment: () => void;
  deleteSelectedSegment: () => void;
  trimSegment: () => void;

  // Timeline navigation
  zoomIn: () => void;
  zoomOut: () => void;
  moveToStart: () => void;
  moveToEnd: () => void;

  // Clipboard operations
  cut: () => void;
  copy: () => void;
  paste: () => void;

  // Misc
  save: () => void;
  undo: () => void;
  redo: () => void;
  showShortcuts: () => void;

  // Additional controls
  splitSegment: () => void;
  mergeSegments: () => void;
  duplicateSegment: () => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Navigation
  goToNextMarker: () => void;
  goToPreviousMarker: () => void;

  // View controls
  toggleFullscreen: () => void;
  toggleWaveform: () => void;
  toggleGrid: () => void;
}): ShortcutGroup[] => {
  // Define shortcut groups
  return [
    {
      name: "Playback Controls",
      shortcuts: [
        {
          key: " ",
          description: "Play/Pause",
          action: actions.togglePlayPause,
        },
        {
          key: "Escape",
          description: "Stop Playback",
          action: actions.stopPlayback,
        },
        {
          key: "ArrowRight",
          description: "Skip Forward 5s",
          action: actions.skipForward,
        },
        {
          key: "ArrowLeft",
          description: "Skip Backward 5s",
          action: actions.skipBackward,
        },
      ],
    },
    {
      name: "Volume Controls",
      shortcuts: [
        {
          key: "ArrowUp",
          description: "Increase Volume",
          action: actions.increaseVolume,
        },
        {
          key: "ArrowDown",
          description: "Decrease Volume",
          action: actions.decreaseVolume,
        },
        {
          key: "m",
          description: "Toggle Mute",
          action: actions.toggleMute,
        },
      ],
    },
    {
      name: "Track Management",
      shortcuts: [
        createCrossPlatformShortcut({
          key: "t",
          modKey: true,
          description: "Add New Track",
          action: actions.addTrack,
        }),
        {
          key: "Tab",
          description: "Select Next Track",
          action: actions.selectNextTrack,
        },
        {
          key: "Tab",
          shiftKey: true,
          description: "Select Previous Track",
          action: actions.selectPreviousTrack,
        },
        {
          key: "l",
          description: "Toggle Track Lock",
          action: actions.toggleTrackLock,
        },
        {
          key: "m",
          altKey: true,
          description: "Toggle Track Mute",
          action: actions.toggleTrackMute,
        },
      ],
    },
    {
      name: "Segment Management",
      shortcuts: [
        createCrossPlatformShortcut({
          key: "a",
          modKey: true,
          description: "Add Segment",
          action: actions.addSegment,
        }),
        {
          key: "Delete",
          description: "Delete Selected Segment",
          action: actions.deleteSelectedSegment,
        },
        {
          key: "t",
          description: "Trim Segment",
          action: actions.trimSegment,
        },
      ],
    },
    {
      name: "Timeline Navigation",
      shortcuts: [
        createCrossPlatformShortcut({
          key: "=",
          modKey: true,
          description: "Zoom In",
          action: actions.zoomIn,
        }),
        createCrossPlatformShortcut({
          key: "-",
          modKey: true,
          description: "Zoom Out",
          action: actions.zoomOut,
        }),
        {
          key: "Home",
          description: "Move to Start",
          action: actions.moveToStart,
        },
        {
          key: "End",
          description: "Move to End",
          action: actions.moveToEnd,
        },
      ],
    },
    {
      name: "Clipboard Operations",
      shortcuts: [
        createCrossPlatformShortcut({
          key: "x",
          modKey: true,
          description: "Cut",
          action: actions.cut,
        }),
        createCrossPlatformShortcut({
          key: "c",
          modKey: true,
          description: "Copy",
          action: actions.copy,
        }),
        createCrossPlatformShortcut({
          key: "v",
          modKey: true,
          description: "Paste",
          action: actions.paste,
        }),
      ],
    },
    {
      name: "Misc",
      shortcuts: [
        createCrossPlatformShortcut({
          key: "s",
          modKey: true,
          description: "Save Project",
          action: actions.save,
        }),
        createCrossPlatformShortcut({
          key: "z",
          modKey: true,
          description: "Undo",
          action: actions.undo,
        }),
        createCrossPlatformShortcut({
          key: "y",
          modKey: true,
          description: "Redo",
          action: actions.redo,
        }),
        // Alternative redo shortcut for Mac
        {
          key: "z",
          metaKey: true,
          shiftKey: true,
          description: "Redo (Mac)",
          action: actions.redo,
          platform: "mac",
        },
        {
          key: "?",
          shiftKey: true,
          description: "Show Keyboard Shortcuts",
          action: actions.showShortcuts,
        },
        {
          key: ".",
          metaKey: true,
          description: "Show Keyboard Shortcuts (Mac)",
          action: actions.showShortcuts,
          platform: "mac",
        },
        {
          key: ".",
          ctrlKey: true,
          description: "Show Keyboard Shortcuts (Windows)",
          action: actions.showShortcuts,
          platform: "windows",
        },
      ],
    },
    {
      name: "Additional Controls",
      shortcuts: [
        {
          key: "e",
          description: "Split Segment at Current Position",
          action: actions.splitSegment,
        },
        createCrossPlatformShortcut({
          key: "m",
          modKey: true,
          description: "Merge Selected Segments",
          action: actions.mergeSegments,
        }),
        createCrossPlatformShortcut({
          key: "d",
          modKey: true,
          description: "Duplicate Selected Segment",
          action: actions.duplicateSegment,
        }),
        createCrossPlatformShortcut({
          key: "a",
          modKey: true,
          description: "Select All Segments",
          action: actions.selectAll,
        }),
        {
          key: "Escape",
          description: "Deselect All",
          action: actions.deselectAll,
        },
      ],
    },
    {
      name: "Navigation",
      shortcuts: [
        {
          key: "Tab",
          description: "Go to Next Marker",
          action: actions.goToNextMarker,
        },
        {
          key: "Tab",
          shiftKey: true,
          description: "Go to Previous Marker",
          action: actions.goToPreviousMarker,
        },
      ],
    },
    {
      name: "View Controls",
      shortcuts: [
        {
          key: "F11",
          description: "Toggle Fullscreen",
          action: actions.toggleFullscreen,
        },
        {
          key: "w",
          description: "Toggle Waveform View",
          action: actions.toggleWaveform,
        },
        {
          key: "g",
          description: "Toggle Grid",
          action: actions.toggleGrid,
        },
      ],
    },
  ];
};

// Helper function to flatten all shortcuts for use with the hook
export const flattenShortcuts = (
  groups: ShortcutGroup[]
): KeyboardShortcut[] => {
  return groups.flatMap((group) => group.shortcuts);
};
