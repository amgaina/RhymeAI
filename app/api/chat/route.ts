import { google } from "@ai-sdk/google";
import {
  streamText,
  Message,
  appendClientMessage,
  appendResponseMessages,
} from "ai";
import { v4 as uuidv4 } from "uuid";
import {
  eventTools,
  scriptTools,
  audioTools,
  presentationTools,
} from "./tools";
import { generateSystemPrompt } from "./prompts";
import { loadChatFromS3, saveChatToS3 } from "@/lib/chat-persistence";
import { saveChat } from "./tools/chats-store";

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
function createSystemMessage(
  contextType: string,
  requiredFields: any,
  chatId: string,
  additionalInfo?: any
): Message {
  const systemPrompt = generateSystemPrompt(
    contextType,
    requiredFields,
    additionalInfo,
    chatId
  );

  console.log("Generated system prompt:", chatId, systemPrompt);

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
    const {
      messages: incomingMessages,
      eventContext = {},
      id: chatId,
    } = await req.json();

    // Transform messages to include an 'id' property
    const messages = transformMessages(incomingMessages);

    // Set default values for eventContext if it's undefined or missing properties
    const contextType = eventContext.contextType || "general-assistant";
    const requiredFields = eventContext.requiredFields || [];
    const additionalInfo = eventContext.additionalInfo || {};

    // Generate a context-aware system prompt with additionalInfo
    const systemMessage = createSystemMessage(
      contextType,
      requiredFields,
      chatId,
      additionalInfo // Pass the additionalInfo to the prompt generator,
    );

    // Combine system message with user messages
    const messagesWithSystem = [systemMessage, ...messages];

    // Optimized Gemini model configuration for script generation
    const result = streamText({
      model: google("gemini-2.0-flash-exp", {}),
      tools: {
        // Event tools - Create and Store
        store_event_data: eventTools.storeEventDataTool,

        // Event tools - Read
        get_events: eventTools.getEventsTool,
        list_events: eventTools.listEventsTool,
        get_event_details: eventTools.getEventDetailsTool,
        get_event_layout: eventTools.getEventLayoutTool,
        get_event_script: eventTools.getEventScriptTool,
        get_voice_settings: eventTools.getVoiceSettingsTool,

        // Event tools - Update
        generate_event_layout: eventTools.generateEventLayoutTool,
        update_layout_segment: eventTools.updateLayoutSegmentTool,
        update_voice_settings: eventTools.updateVoiceSettingsTool,
        update_script_segment: eventTools.updateScriptSegmentTool,

        // Event tools - Finalize
        finalize_event: eventTools.finalizeEventTool,

        // Script tools
        generate_script: scriptTools.generateScriptTool,
        generate_script_from_layout: scriptTools.generateScriptFromLayoutTool,

        // Audio tools
        generate_audio: audioTools.generateAudioTool,
        generate_batch_audio: audioTools.batchGenerateAudioTool,
        list_all_script_audio: audioTools.listAudioFilesTool,

        // Presentation tools
        generate_presentation: presentationTools.generatePresentationTool,
      },
      messages: messagesWithSystem,
      async onFinish({ response }) {
        if (!chatId) {
          console.warn("No chat ID provided for persistence");
          return;
        }

        console.log(`Saving chat with ID: ${chatId}`);
        await saveChat({
          id: chatId,
          messages: appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }),
        });
      },
      temperature: 0.5, // Lower temperature for more focused responses
      maxTokens: 1500, // Increased token limit for more comprehensive scripts
    });

    // Save chat messages to S3
    // Use the ID passed from the frontend, fallback to eventId from context, or generate new one if needed
    await saveChatToS3(chatId, messagesWithSystem);

    // Include custom metadata for client-side synchronization
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error processing POST request:", error);

    // Create a more detailed error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack =
      error instanceof Error ? error.stack : "No stack trace available";

    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : "Unknown",
    });

    // Return a more helpful error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        timestamp: new Date().toISOString(),
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  try {
    const messages = await loadChatFromS3(chatId);
    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // If the error is "Not Found", return an empty array instead of an error
    if (errorMessage.includes("Not Found")) {
      console.log(`Chat with ID ${chatId} not found, returning empty array`);
      return new Response(JSON.stringify([]), { status: 200 });
    }

    return new Response(`Failed to load chat: ${errorMessage}`, {
      status: 500,
    });
  }
}
