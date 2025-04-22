"use server";

// Export layout operations from their respective modules
export { generateEventLayout } from "./generator";
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
