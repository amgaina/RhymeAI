import { useEffect, useRef, useMemo } from "react";

// Detect platform
const isMac =
  typeof navigator !== "undefined"
    ? /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    : false;

// Define shortcut types
export type KeyboardShortcut = {
  key: string; // The key to press (e.g., 'a', 'ArrowUp', etc.)
  ctrlKey?: boolean; // Whether Ctrl key is required (Windows/Linux)
  metaKey?: boolean; // Whether Command key is required (Mac)
  shiftKey?: boolean; // Whether Shift key is required
  altKey?: boolean; // Whether Alt/Option key is required
  description: string; // Human-readable description of what the shortcut does
  action: () => void; // Function to execute when shortcut is triggered
  preventDefault?: boolean; // Whether to prevent default browser behavior
  global?: boolean; // Whether shortcut works globally or only when focused
  platform?: "mac" | "windows" | "both"; // Platform specificity
};

// Define a cross-platform shortcut type that automatically uses the right modifier key
export type CrossPlatformShortcut = Omit<
  KeyboardShortcut,
  "ctrlKey" | "metaKey"
> & {
  modKey?: boolean; // Will use Command on Mac, Ctrl elsewhere
};

// Define shortcut groups for organization
export type ShortcutGroup = {
  name: string;
  shortcuts: KeyboardShortcut[];
};

// Main hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  // Use a ref to keep track of the current shortcuts
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  // Update the ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Set up the keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if the event target is an input, textarea, or contentEditable element
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcutsRef.current) {
        // Check if the key matches
        const keyMatches = event.key === shortcut.key;

        // Check if modifier keys match
        const ctrlMatches =
          shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const metaMatches =
          shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const shiftMatches =
          shortcut.shiftKey === undefined ||
          event.shiftKey === shortcut.shiftKey;
        const altMatches =
          shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        // If all conditions match, execute the action
        if (
          keyMatches &&
          ctrlMatches &&
          metaMatches &&
          shiftMatches &&
          altMatches
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Return all shortcuts for documentation purposes
  return shortcuts;
}

// Helper function to create a cross-platform shortcut
export function createCrossPlatformShortcut(
  shortcut: CrossPlatformShortcut
): KeyboardShortcut {
  const { modKey, ...rest } = shortcut;

  if (modKey) {
    return {
      ...rest,
      ctrlKey: !isMac ? modKey : undefined,
      metaKey: isMac ? modKey : undefined,
    };
  }

  return rest as KeyboardShortcut;
}

// Helper function to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Add modifier keys based on platform
  if (shortcut.ctrlKey) parts.push(isMac ? "Control" : "Ctrl");
  if (shortcut.metaKey) parts.push("⌘");
  if (shortcut.altKey) parts.push(isMac ? "Option" : "Alt");
  if (shortcut.shiftKey) parts.push("Shift");

  // Add the main key, with special formatting for certain keys
  let key = shortcut.key;

  // Format special keys
  switch (key) {
    case " ":
      key = "Space";
      break;
    case "ArrowUp":
      key = "↑";
      break;
    case "ArrowDown":
      key = "↓";
      break;
    case "ArrowLeft":
      key = "←";
      break;
    case "ArrowRight":
      key = "→";
      break;
    case "Delete":
      key = "Del";
      break;
    case "Backspace":
      key = "⌫";
      break;
    case "Enter":
      key = "↵";
      break;
    case "Escape":
      key = "Esc";
      break;
    default:
      // Capitalize single letters
      if (key.length === 1) {
        key = key.toUpperCase();
      }
  }

  parts.push(key);

  // Join with + symbol
  return parts.join(" + ");
}
