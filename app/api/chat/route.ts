import { google } from "@ai-sdk/google";
import { streamText, Message } from "ai";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    // Get messages and eventContext from request body
    const { messages: incomingMessages, eventContext } = await req.json();

    // Transform messages to include an 'id' property
    const messages: Message[] = incomingMessages.map((msg: any) => ({
      ...msg,
      id: msg.id || uuidv4(), // Use existing id or generate a new one
    }));

    // Generate a context-aware system prompt based on the eventContext
    let systemPrompt = "";

    if (eventContext?.contextType === "event-creation") {
      // Streamlined event creation prompt focused on gathering essential information
      systemPrompt = `You are the RhymeAI Event Creation Assistant. Your primary task is to efficiently collect all essential information needed to generate an AI emcee script.

## Core Event Information to Collect:
${eventContext?.requiredFields?.map((field: string) => `- ${field}`).join("\n")}

## Guidelines:
1. Focus exclusively on collecting essential event details (name, type, date, location, audience size)
2. Store and confirm each piece of information as the user provides it
3. If any required field is missing, ask for it directly
4. Once all essential details are collected, proceed to voice preferences (tone and language)
5. Summarize the collected information before finalizing

Remember: Your goal is to gather all necessary information to generate an effective emcee script for this specific event. Avoid irrelevant tangents.`;
    } else if (eventContext?.contextType === "script-generation") {
      // Improved script generation prompt with focus on quality script creation
      systemPrompt = `You are the RhymeAI Script Generation Assistant. Your sole purpose is to create professional, engaging emcee scripts for events.

## Script Creation Guidelines:
1. Create natural-sounding scripts that match the event type and audience
2. Use clear, concise sentences optimized for text-to-speech
3. Structure with proper introductions, transitions, and closings
4. Include natural pauses (indicated with [pause]) at appropriate moments
5. Format speaker introductions consistently
6. Use emphasis markers [emphasis] for important points
7. Incorporate event-specific terminology from the collected information
8. Ensure appropriate pacing throughout the script

Generate a complete, ready-to-use emcee script based on the event information provided.`;
    } else {
      // Default prompt focused on event script creation assistance
      systemPrompt = `You are the RhymeAI Emcee Assistant, exclusively focused on helping create professional event scripts.

Your primary functions:
- Guide users through event information collection
- Generate customized emcee scripts based on event details
- Help refine and improve existing scripts
- Suggest appropriate voice tones and styles for different events

Focus on providing practical, actionable assistance for creating effective event scripts.`;
    }

    const SystemMessage: Message = {
      id: "system",
      role: "system",
      content: systemPrompt,
      parts: [{ type: "text", text: systemPrompt }],
    };
    const systemMessage = SystemMessage as Message;

    const messagesWithSystem = [systemMessage, ...messages];

    // Define the store_event_data function for the tool schema
    const storeEventDataTool = {
      name: "store_event_data",
      description: "Store collected event information",
      parameters: {
        type: "object",
        properties: {
          eventName: { type: "string" },
          eventType: { type: "string" },
          eventDate: { type: "string" },
          eventLocation: { type: "string" },
          audienceSize: { type: "string" },
          speakerInfo: { type: "string" },
          voicePreference: { type: "string" },
          language: { type: "string" },
        },
        required: ["eventName", "eventType", "eventDate"],
      },
    };

    // Optimized Gemini model configuration for script generation
    const result = streamText({
      model: google("gemini-1.5-flash", {}),
      tools: {
        // store_event_data: storeEventDataTool,
      },
      messages: messagesWithSystem,
      temperature: 0.5, // Lower temperature for more focused responses
      maxTokens: 1500, // Increased token limit for more comprehensive scripts
    });

    return result.toDataStreamResponse({
      sendSources: true,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
