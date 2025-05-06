import { NextRequest, NextResponse } from "next/server";
import { generateEventLayout } from "@/app/actions/event/layout";
import { generateAIEventLayout } from "@/app/actions/event/layout/ai-generator";

/**
 * API route to test AI-based layout generation
 * Call this endpoint with ?eventId=123 to test
 */
export async function GET(request: NextRequest) {
  try {
    // Get eventId from query params
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId parameter" },
        { status: 400 }
      );
    }
    
    // Generate layout using AI
    console.log("Generating AI-based layout...");
    const aiResult = await generateAIEventLayout(eventId);
    
    return NextResponse.json({
      success: true,
      aiLayout: aiResult.success ? aiResult.layout : null,
      aiSuccess: aiResult.success,
      aiMessage: aiResult.message || aiResult.error,
      aiReasoning: aiResult.aiContext,
    });
  } catch (error) {
    console.error("Error testing layout generation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
