"use client";

import { toast } from "@/components/ui/use-toast";

// Toast IDs for tracking
const toastIds: Record<string, string> = {};

/**
 * Shows a loading toast for a tool operation
 * @param toolName The name of the tool being processed
 * @param message The message to display
 * @returns The ID of the toast
 */
export function showToolProcessingToast(
  toolName: string,
  message: string
): string {
  // Dismiss any existing toast for this tool
  if (toastIds[toolName]) {
    toast.dismiss(toastIds[toolName]);
  }

  // Create a new loading toast
  const { id } = toast({
    title: "Processing...",
    description: message,
    variant: "loading",
    duration: Infinity, // Don't auto-dismiss
  });

  // Store the toast ID
  toastIds[toolName] = id;
  return id;
}

/**
 * Updates a tool processing toast with success or error
 * @param toolName The name of the tool that was processed
 * @param success Whether the operation was successful
 * @param message The success or error message
 */
export function updateToolProcessingToast(
  toolName: string,
  success: boolean,
  message: string
): void {
  const id = toastIds[toolName];
  if (!id) return;

  // Update the toast with success or error
  toast({
    id,
    title: success ? "Success" : "Error",
    description: message,
    variant: success ? "default" : "destructive",
    duration: 5000, // Auto-dismiss after 5 seconds
  });

  // Remove the toast ID from tracking
  delete toastIds[toolName];
}
