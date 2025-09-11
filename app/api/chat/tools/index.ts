// Import and re-export all tools
import { eventTools } from "./event-tools";
import { scriptTools } from "./script-tools";
import { audioTools } from "./audio-tools";
import { presentationTools } from "./presentation-tools";
import { uiTools, uiToolExecutors } from "./ui-tools";

// Export all tools
export const tools = {
  ...eventTools,
  ...scriptTools,
  ...audioTools,
  ...presentationTools,
  ...uiToolExecutors,
};

// Export individual tool categories for direct access
export {
  eventTools,
  scriptTools,
  audioTools,
  presentationTools,
  uiTools,
  uiToolExecutors,
};
