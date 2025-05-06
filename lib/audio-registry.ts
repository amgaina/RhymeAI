/**
 * Registry for audio elements to keep them outside of Redux store
 * This avoids serialization issues with HTMLAudioElement in Redux
 */

// Registry to hold actual HTMLAudioElement instances
class AudioRegistry {
  private audioElements: Record<string, HTMLAudioElement> = {};

  // Get an audio element by ID
  get(id: string): HTMLAudioElement | undefined {
    return this.audioElements[id];
  }

  // Set or create an audio element
  set(id: string, element: HTMLAudioElement): void {
    this.audioElements[id] = element;
  }

  // Remove an audio element
  remove(id: string): void {
    if (this.audioElements[id]) {
      try {
        this.audioElements[id].pause();
        this.audioElements[id].src = "";
      } catch (e) {
        console.error(`Error cleaning up audio element ${id}:`, e);
      }
      delete this.audioElements[id];
    }
  }

  // Check if an audio element exists
  has(id: string): boolean {
    return !!this.audioElements[id];
  }

  // Get all audio element IDs
  getIds(): string[] {
    return Object.keys(this.audioElements);
  }

  // Get all audio elements
  getAll(): Record<string, HTMLAudioElement> {
    return { ...this.audioElements };
  }

  // Stop all audio elements
  stopAll(): void {
    Object.values(this.audioElements).forEach((audio) => {
      try {
        audio.pause();
      } catch (e) {
        console.error("Error stopping audio:", e);
      }
    });
  }

  // Clean up all audio elements
  clear(): void {
    Object.keys(this.audioElements).forEach((id) => this.remove(id));
    this.audioElements = {};
  }
}

// Create a singleton instance
export const audioRegistry = new AudioRegistry();

export default audioRegistry;
