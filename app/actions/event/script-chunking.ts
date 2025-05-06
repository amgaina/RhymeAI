"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Breaks down a script segment into smaller chunks for better TTS generation
 * Each chunk will be approximately the specified number of words
 */
export async function chunkScriptSegment(
  segmentId: number,
  targetChunkSize: number = 50 // Default to 50 words per chunk
) {
  try {
    // Get the original script segment
    const originalSegment = await db.script_segments.findUnique({
      where: { id: segmentId },
    });

    if (!originalSegment) {
      return {
        success: false,
        error: "Script segment not found",
      };
    }

    // Get the event ID for revalidation
    const eventId = originalSegment.event_id;

    // Split the content into sentences
    // This is a simple split by period, exclamation, or question mark
    // A more sophisticated NLP approach could be used for better results
    const sentences = originalSegment.content
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .map((s) => s.trim());

    // Group sentences into chunks of approximately targetChunkSize words
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceWordCount = sentence.split(/\s+/).length;

      // If adding this sentence would exceed the target chunk size and we already have content,
      // finish the current chunk and start a new one
      if (
        currentWordCount + sentenceWordCount > targetChunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentWordCount = 0;
      }

      // Add the sentence to the current chunk
      currentChunk.push(sentence);
      currentWordCount += sentenceWordCount;
    }

    // Add any remaining content as the final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }

    // If we only have one chunk, no need to create new segments
    if (chunks.length <= 1) {
      return {
        success: true,
        message: "Content is already optimal for TTS",
        chunks: [originalSegment],
      };
    }

    // Delete the original segment
    await db.script_segments.delete({
      where: { id: segmentId },
    });

    // Create new segments for each chunk
    const createdChunks = await Promise.all(
      chunks.map(async (chunkContent, index) => {
        return db.script_segments.create({
          data: {
            event_id: originalSegment.event_id,
            layout_segment_id: originalSegment.layout_segment_id,
            segment_type: originalSegment.segment_type,
            content: chunkContent,
            status: originalSegment.status,
            timing: Math.round(
              (originalSegment.timing * chunkContent.length) /
                originalSegment.content.length
            ), // Proportional timing
            order: originalSegment.order * 100 + index, // Preserve order with sub-ordering
          },
        });
      })
    );

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: true,
      chunks: createdChunks,
      message: `Split segment into ${chunks.length} chunks`,
    };
  } catch (error) {
    console.error("Error chunking script segment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to chunk script segment",
    };
  }
}

/**
 * Processes all script segments for an event, breaking them into smaller chunks
 */
export async function chunkAllScriptSegments(
  eventId: string,
  targetChunkSize: number = 50
) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get all script segments for the event
    const segments = await db.script_segments.findMany({
      where: { event_id: eventIdNum },
      orderBy: { order: "asc" },
    });

    if (segments.length === 0) {
      return {
        success: false,
        error: "No script segments found for this event",
      };
    }

    // Process each segment
    const results = await Promise.all(
      segments.map(async (segment) => {
        return chunkScriptSegment(segment.id, targetChunkSize);
      })
    );

    // Count successful chunks
    const successCount = results.filter((r) => r.success).length;
    const totalChunks = results.reduce(
      (sum, r) => sum + (r.chunks?.length || 0),
      0
    );

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: successCount > 0,
      message: `Processed ${successCount}/${segments.length} segments into ${totalChunks} chunks`,
      results,
    };
  } catch (error) {
    console.error("Error chunking script segments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to chunk script segments",
    };
  }
}
