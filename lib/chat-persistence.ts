"use server";

import { Message } from "ai";
import {
  uploadToS3,
  getPresignedUrl,
  checkS3ObjectExists,
  renameS3Object,
} from "./s3-utils";

const CHAT_BUCKET = process.env.S3_BUCKET_NAME || "rhymeai-audio";

/**
 * Save chat messages to S3
 * @param chatId The chat ID (same as eventId if it exists)
 * @param messages The chat messages to save
 * @returns The URL of the saved chat file
 */
export async function saveChatToS3(
  chatId: string,
  messages: Message[]
): Promise<string> {
  const key = `chats/${chatId}.json`;
  const buffer = Buffer.from(JSON.stringify(messages, null, 2), "utf-8");

  // Upload chat messages to S3
  return await uploadToS3(buffer, key, "application/json");
}

/**
 * Load chat messages from S3
 * @param chatId The chat ID (same as eventId if it exists)
 * @returns The chat messages
 */
export async function loadChatFromS3(chatId: string): Promise<Message[]> {
  const key = `chats/${chatId}.json`;

  try {
    // Check if chat file exists
    const exists = await checkS3ObjectExists(key);
    if (!exists) {
      console.log(
        `Chat file doesn't exist for chatId: ${chatId}. Returning empty array.`
      );
      return [];
    }

    // Generate a presigned URL to fetch the chat file
    const url = await getPresignedUrl(key);

    // Fetch the chat messages
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to load chat from S3: ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(`Error loading chat from S3 for chatId ${chatId}:`, error);
    return [];
  }
}

/**
 * Rename chat ID in S3
 * @param oldChatId The old chat ID
 * @param newChatId The new chat ID
 */
export async function renameChatIdInS3(oldChatId: string, newChatId: string) {
  const oldKey = `chats/${oldChatId}.json`;
  const newKey = `chats/${newChatId}.json`;
  try {
    await renameS3Object(oldKey, newKey);
    console.log(`Successfully renamed chat from ${oldChatId} to ${newChatId}`);
  } catch (error) {
    console.error(
      `Error renaming chat from ${oldChatId} to ${newChatId}:`,
      error
    );
  }
}

/**
 * Generate a unique chat ID if none is provided
 * @returns A unique chat ID
 */
export async function generateChatId(): Promise<string> {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
