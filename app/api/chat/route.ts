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
      // Enhanced script generation prompt with TTS-ready formatting
      systemPrompt = `You are the RhymeAI Script Generation Assistant. Your sole purpose is to create professional, engaging emcee scripts for events that are optimized for text-to-speech conversion.

## Script Creation Guidelines:
1. Create natural-sounding scripts that match the event type and audience
2. Use clear, concise sentences optimized for text-to-speech delivery
3. Structure with proper introductions, transitions, and closings
4. Include natural pauses with [PAUSE] markers (e.g., [PAUSE=500] for 500ms)
5. Use emphasis markers like [EMPHASIS] for important points
6. Format speaker introductions consistently
7. Avoid complex pronunciations or tongue twisters
8. Keep sentences to 10-15 words for better TTS flow
9. Use [BREATHE] markers to indicate natural breathing points
10. Format numbers, acronyms, and special terms for proper TTS pronunciation
11. Organize with clear section headers like [SECTION: Introduction]

## Output Format:
When you've completed gathering information, generate a JSON structure with:
{
  "title": "Event Script Title",
  "sections": [
    {
      "name": "Introduction",
      "content": "Script text with [PAUSE], [EMPHASIS], and [BREATHE] markers"
    },
    {
      "name": "Main Program",
      "content": "More formatted script text..."
    }
  ]
}

This structured format will be sent directly to our TTS engine for professional voice generation.`;
    } else if (eventContext?.contextType === "voice-selection") {
      // Prompt for helping users select appropriate voice styles
      systemPrompt = `You are the RhymeAI Voice Selection Assistant. Your purpose is to help users select the ideal voice characteristics for their event script.

## Voice Selection Guidelines:
1. Help users choose from these voice parameters:
   - Gender: Male, Female, or Neutral
   - Age: Young, Middle-aged, or Mature
   - Tone: Professional, Casual, Energetic, Calm, or Authoritative
   - Accent: American, British, Australian, Indian, or Neutral
   - Speed: Slow, Medium, or Fast
   - Language: English and various other supported languages

2. Ask questions to understand the event context (formal/casual, audience demographics, etc.)
3. Recommend appropriate voice styles based on the event type
4. Provide sound reasoning for your recommendations
5. Allow the user to hear sample snippets before finalizing their choice

Format voice selection data in a structured format that can be easily processed by our TTS engine.`;
    } else {
      // Default conversational prompt
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

    // Enhanced tool schema for storing event data and script generation
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
          voicePreference: {
            type: "object",
            properties: {
              gender: { type: "string", enum: ["male", "female", "neutral"] },
              age: { type: "string", enum: ["young", "middle-aged", "mature"] },
              tone: {
                type: "string",
                enum: [
                  "professional",
                  "casual",
                  "energetic",
                  "calm",
                  "authoritative",
                ],
              },
              accent: {
                type: "string",
                enum: [
                  "american",
                  "british",
                  "australian",
                  "indian",
                  "neutral",
                ],
              },
              speed: { type: "string", enum: ["slow", "medium", "fast"] },
            },
          },
          language: { type: "string" },
        },
        required: ["eventName", "eventType", "eventDate"],
      },
    };

    // Script generation tool for TTS-ready output
    const generateScriptTool = {
      name: "generate_script",
      description: "Generate a TTS-ready script for the event",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                content: { type: "string" },
              },
              required: ["name", "content"],
            },
          },
        },
        required: ["title", "sections"],
      },
    };

    // Optimized Gemini model configuration for script generation
    const result = streamText({
      model: google("gemini-1.5-flash", {}),
      // tools: {
      //   store_event_data: storeEventDataTool,
      //   generate_script: generateScriptTool,
      // },
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
