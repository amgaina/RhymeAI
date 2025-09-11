import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds The duration in seconds
 * @returns A formatted string like "1h 30m" or "45m" or "30s"
 */
export function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  let result = "";

  if (hours > 0) {
    result += `${hours}h `;
  }

  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }

  if (remainingSeconds > 0 && hours === 0) {
    result += `${remainingSeconds}s`;
  }

  return result.trim();
}
