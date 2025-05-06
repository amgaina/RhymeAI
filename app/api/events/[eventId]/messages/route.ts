import { NextRequest, NextResponse } from "next/server";
import { loadEventChatHistory } from "@/app/actions/chat/load-event-chat";
import { getScriptSegments } from "@/app/actions/event/script";

/**
 * API endpoint to fetch messages for a specific event
 * This is used by the chat interface to load conversation history
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    // In Next.js 14, we need to use the context object properly
    // Extract the eventId from the context
    const { params } = context;

    // Safely access the eventId with proper validation
    if (!params) {
      return NextResponse.json(
        { error: "Route parameters are missing" },
        { status: 400 }
      );
    }

    // Get the eventId from the params object
    const eventId = (await params).eventId;

    // Validate that we have an eventId
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string, 10)
      : 10;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page") as string, 10)
      : 0;
    // const before = searchParams.get("before"); // Not currently used

    // Validate eventId
    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "Invalid event ID format" },
        { status: 400 }
      );
    }

    // Load chat history with pagination
    const result = await loadEventChatHistory(eventIdNum, limit, page);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to load chat history" },
        { status: 500 }
      );
    }

    // Get script data if available
    let scriptData = null;
    try {
      // Use the validated numeric event ID
      const scriptResult = await getScriptSegments(eventIdNum.toString());
      if (scriptResult.success && scriptResult.segments) {
        scriptData = {
          segments: scriptResult.segments,
        };
      }
    } catch (error) {
      console.warn("Failed to load script data:", error);
      // Continue without script data
    }

    return NextResponse.json({
      messages: result.messages || [],
      hasMore: result.pagination?.hasMore || false,
      total: result.pagination?.total || 0,
      eventDetails: result.eventDetails,
      scriptData,
    });
  } catch (error) {
    // Log the error with more context
    console.error("Error in GET /api/events/[eventId]/messages:", error);

    // Provide a more detailed error response
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        path: "/api/events/[eventId]/messages",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
