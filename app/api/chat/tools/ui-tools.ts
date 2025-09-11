import { ChatCompletionTool } from "openai/resources/index.mjs";
import { prepareLayoutForChat, prepareScriptForChat, recordChatUIInteraction } from "@/app/actions/chat/ui-actions";

// Define the UI tools
export const uiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "showEventLayout",
      description: "Show the event layout in a visual UI component. Use this when the user wants to see the event layout or schedule.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event to show the layout for",
          },
          messageId: {
            type: "string",
            description: "The ID of the current message for tracking purposes",
          },
        },
        required: ["eventId", "messageId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "showEventScript",
      description: "Show the event script in a visual UI component. Use this when the user wants to see the event script or script segments.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The ID of the event to show the script for",
          },
          messageId: {
            type: "string",
            description: "The ID of the current message for tracking purposes",
          },
        },
        required: ["eventId", "messageId"],
      },
    },
  },
];

// Tool execution functions
export const uiToolExecutors: Record<string, Function> = {
  showEventLayout: async ({ eventId, messageId }: { eventId: string; messageId: string }) => {
    try {
      // Prepare the layout data
      const result = await prepareLayoutForChat(eventId);
      
      // Record the interaction
      await recordChatUIInteraction(eventId, "layout", messageId);
      
      if (result.success) {
        return {
          success: true,
          message: `I've opened the layout for "${result.eventName}" in a visual viewer. You can see the detailed schedule and segments there.`,
          action: "openLayout",
          eventId,
          layout: result.layout,
        };
      } else {
        return {
          success: false,
          message: `I couldn't find the layout for this event. ${result.error}`,
        };
      }
    } catch (error) {
      console.error("Error executing showEventLayout:", error);
      return {
        success: false,
        message: "I encountered an error while trying to show the event layout. Please try again later.",
      };
    }
  },
  
  showEventScript: async ({ eventId, messageId }: { eventId: string; messageId: string }) => {
    try {
      // Prepare the script data
      const result = await prepareScriptForChat(eventId);
      
      // Record the interaction
      await recordChatUIInteraction(eventId, "script", messageId);
      
      if (result.success) {
        return {
          success: true,
          message: `I've opened the script for "${result.eventName}" in a visual viewer. You can see all the script segments there.`,
          action: "openScript",
          eventId,
          segments: result.segments,
        };
      } else {
        return {
          success: false,
          message: `I couldn't find the script for this event. ${result.error}`,
        };
      }
    } catch (error) {
      console.error("Error executing showEventScript:", error);
      return {
        success: false,
        message: "I encountered an error while trying to show the event script. Please try again later.",
      };
    }
  },
};
