import { Message } from "ai";
import { saveChatToS3, loadChatFromS3 } from "@/lib/chat-persistence";

/**
 * Save chat messages to S3 storage
 * This is called directly by the route.ts API handler
 * @param id The chat ID
 * @param messages The chat messages to save
 */
export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  try {
    console.log(`Saving chat with ID: ${id} to S3`);
    await saveChatToS3(id, messages);
  } catch (error) {
    console.error(`Error saving chat with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Load chat messages from S3 storage
 * @param id The chat ID
 * @returns The chat messages
 */
export async function loadChat(id: string): Promise<Message[]> {
  try {
    console.log(`Loading chat with ID: ${id} from S3`);
    return await loadChatFromS3(id);
  } catch (error) {
    console.error(`Error loading chat with ID ${id}:`, error);
    return [];
  }
}

/**
 * Get chat ID from various sources (for use in tools)
 * @param providedId ID passed to the tool
 * @returns The chat ID to use for storage
 */
export async function getBestChatId(providedId: string): Promise<string> {
  if (!providedId) {
    console.warn("No ID provided to getBestChatId");
    // If no ID is provided, generate a new UUID as fallback
    const { v4: uuidv4 } = await import("uuid");
    return uuidv4();
  }

  // Simply return the provided ID - this will be either:
  // 1. The event ID from the database (if the event exists)
  // 2. The activeChatId from Redux (if the event doesn't exist yet)
  console.log(`Using provided ID as chat ID: ${providedId}`);
  return providedId;
}
