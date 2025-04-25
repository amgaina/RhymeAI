"use server";

import { generateEventLayout } from "../layout";
import { generateAIEventLayout } from "./ai-generator";

/**
 * Test function to compare AI-generated layout with template-based layout
 */
export async function testLayoutGeneration(eventId: string) {
  try {
    console.log(`Testing layout generation for event: ${eventId}`);
    
    // Generate layout using AI
    console.log("Generating AI-based layout...");
    const aiResult = await generateAIEventLayout(eventId);
    
    // Generate layout using template
    console.log("Generating template-based layout...");
    const templateResult = await generateEventLayout(eventId, false);
    
    return {
      success: true,
      aiLayout: aiResult.success ? aiResult.layout : null,
      templateLayout: templateResult.success ? templateResult.layout : null,
      aiSuccess: aiResult.success,
      templateSuccess: templateResult.success,
      aiMessage: aiResult.message || aiResult.error,
      templateMessage: templateResult.message || templateResult.error,
    };
  } catch (error) {
    console.error("Error testing layout generation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
