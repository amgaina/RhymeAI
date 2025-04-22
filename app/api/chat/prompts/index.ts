import { eventCreationPrompt } from './event-creation';
import { scriptGenerationPrompt } from './script-generation';
import { voiceSelectionPrompt } from './voice-selection';
import { eventLayoutPrompt } from './event-layout';
import { audioGenerationPrompt } from './audio-generation';
import { presentationPrompt } from './presentation';

/**
 * Generates system prompts based on context type
 */
export function generateSystemPrompt(
  contextType: string,
  requiredFields?: string[]
) {
  switch (contextType) {
    case "event-creation":
      return eventCreationPrompt(requiredFields);
    
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
    
    default:
      return `You are the RhymeAI Emcee Assistant, exclusively focused on helping create professional event scripts and presentations.

Your primary functions:
- Guide users through event information collection
- Generate customized event layouts based on event type
- Create professional script segments from the layout
- Generate high-quality audio using text-to-speech
- Build engaging presentations with synchronized audio and visuals
- Help refine and improve content at each step

Focus on providing practical, actionable assistance for creating effective event content.`;
  }
}

// Export all prompts for direct access
export {
  eventCreationPrompt,
  scriptGenerationPrompt,
  voiceSelectionPrompt,
  eventLayoutPrompt,
  audioGenerationPrompt,
  presentationPrompt
};
