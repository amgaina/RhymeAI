import { google } from "@ai-sdk/google";
import { streamText, Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import { storeEventDataTool, generateScriptTool } from "./tools";
import { generateSystemPrompt } from "./prompts";

/**
 * Transforms incoming messages to include proper id properties
 */
function transformMessages(incomingMessages: any[]): Message[] {
  return incomingMessages.map((msg: any) => ({
    ...msg,
    id: msg.id || uuidv4(), // Use existing id or generate a new one
  }));
}

/**
 * Creates a system message based on context
 */
function createSystemMessage(eventContext: any): Message {
  const systemPrompt = generateSystemPrompt(
    eventContext?.contextType,
    eventContext?.requiredFields
  );

  return {
    id: "system",
    role: "system",
    content: systemPrompt,
    parts: [{ type: "text", text: systemPrompt }],
  } as Message;
}

export async function POST(req: Request) {
  try {
    // Get messages and eventContext from request body
    const { messages: incomingMessages, eventContext } = await req.json();

    // Transform messages to include an 'id' property
    const messages = transformMessages(incomingMessages);

    // Generate a context-aware system prompt
    const systemMessage = createSystemMessage(eventContext);

    // Combine system message with user messages
    const messagesWithSystem = [systemMessage, ...messages];

    // Optimized Gemini model configuration for script generation
    const result = streamText({
      model: google("gemini-1.5-flash", {}),
      tools: {
        store_event_data: storeEventDataTool,
        generate_script: generateScriptTool,
      },
      messages: messagesWithSystem,
      temperature: 0.5, // Lower temperature for more focused responses
      maxTokens: 1500, // Increased token limit for more comprehensive scripts
    });

    // Include custom metadata for client-side synchronization
    return result.toDataStreamResponse({
      sendSources: true,
      headers: {
        "X-RhymeAI-Sync-Token": uuidv4(), // Adds a sync token for client components
        "X-RhymeAI-Context-Type": eventContext?.contextType || "general",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
