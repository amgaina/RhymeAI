import { google } from "@ai-sdk/google";
import { streamText, Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import {
  eventTools,
  scriptTools,
  audioTools,
  presentationTools,
} from "./tools";
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
function createSystemMessage(
  contextType: string,
  requiredFields: any,
  additionalInfo?: any
): Message {
  const systemPrompt = generateSystemPrompt(
    contextType,
    requiredFields,
    additionalInfo
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

    // Generate a context-aware system prompt with additionalInfo
    const systemMessage = createSystemMessage(
      eventContext.contextType,
      eventContext.requiredFields,
      eventContext.additionalInfo // Pass the additionalInfo to the prompt generator
    );

    // Combine system message with user messages
    const messagesWithSystem = [systemMessage, ...messages];

    // Check if we're using the general assistant context type
    if (eventContext.contextType === "general-assistant") {
      console.log("Using general assistant context - no event ID required");
    } else {
      console.log(
        "Event ID from context:",
        eventContext?.additionalInfo?.eventId || "No event ID"
      );
    }

    // Optimized Gemini model configuration for script generation
    const result = streamText({
      model: google("gemini-2.5-pro-exp-03-25", {}),
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

        // Presentation tools
        generate_presentation: presentationTools.generatePresentationTool,
      },
      messages: messagesWithSystem,
      temperature: 0.5, // Lower temperature for more focused responses
      maxTokens: 1500, // Increased token limit for more comprehensive scripts
    });

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
