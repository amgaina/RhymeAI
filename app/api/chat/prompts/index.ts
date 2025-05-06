import { generateEventAssistancePrompt } from "./event-assistance";
import { scriptGenerationPrompt } from "./script-generation";
import { voiceSelectionPrompt } from "./voice-selection";
import { eventLayoutPrompt } from "./event-layout";
import { audioGenerationPrompt } from "./audio-generation";
import { presentationPrompt } from "./presentation";
import { generalAssistantPrompt } from "./general-assistant";
import { eventCreationPrompt } from "./event-creation";

/**
 * Generates a system prompt based on context type
 */
export function generateSystemPrompt(
  contextType: string,
  requiredFields: string[] = [],
  additionalInfo: any = {}
) {
  // Switch based on context type
  switch (contextType) {
    case "event-assistance":
      return generateEventAssistancePrompt(requiredFields, additionalInfo);

    case "event-creation":
      // If no event ID is provided, use the event creation prompt
      if (!additionalInfo?.eventId) {
        return eventCreationPrompt(requiredFields, additionalInfo);
      }
      // If an event ID is provided, use the event assistance prompt
      return generateEventAssistancePrompt(requiredFields, additionalInfo);

    case "event-layout":
      return eventLayoutPrompt();

    case "script-generation":
      return scriptGenerationPrompt();

    case "voice-selection":
      return voiceSelectionPrompt();

    case "audio-generation":
      return audioGenerationPrompt();

    case "presentation":
      return presentationPrompt();

    case "general-assistant":
      return generalAssistantPrompt(requiredFields, additionalInfo);

    default:
      return `You are RhymeAI, an AI assistant for event management.
      Help the user with their event planning needs in a friendly and professional manner.`;
  }
}

// Export individual prompt generators for direct use if needed
export {
  generateEventAssistancePrompt,
  scriptGenerationPrompt,
  voiceSelectionPrompt,
  eventLayoutPrompt,
  audioGenerationPrompt,
  presentationPrompt,
  generalAssistantPrompt,
  eventCreationPrompt,
};
