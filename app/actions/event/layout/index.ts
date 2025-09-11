"use server";

// Export layout operations from their respective modules
export { generateEventLayout } from "../layout"; // Export from parent file
export { generateAIEventLayout } from "./ai-generator"; // Export AI-based generator
export {
  updateEventLayoutSegment,
  addLayoutSegment,
  deleteLayoutSegment,
} from "./management";
export { generateScriptFromLayout } from "./scripts";

// Export types from the global types directory
export type {
  EventLayout,
  LayoutSegment,
  SegmentType,
  EventType,
} from "@/types/layout";
