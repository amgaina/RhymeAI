"use client";

import React from "react";
import { ChatAudioLink } from "@/components/chat/ChatAudioLink";
import { ChatEventLayout } from "@/components/chat/ChatEventLayout";
import { ChatEventScript } from "@/components/chat/ChatEventScript";
import {
  generateAudioForSegment,
  generateBatchAudio,
} from "@/app/actions/event/audio-generation";
import { ScriptSegment } from "@/types/event";

/**
 * Transforms chat message content to include audio players, layout viewers, and script viewers
 * @param content The chat message content
 * @param toolResults Optional tool results to extract layout and script data
 * @param eventId Optional event ID for context
 * @returns React elements with enhanced components
 */
export function transformChatContent(
  content: string,
  toolResults?: any[],
  eventId?: string | number
): React.ReactNode {
  if (!content) return null;

  // Extract layout and script data from tool results
  let layoutData = null;
  let scriptData = null;
  let eventName = "Event";

  if (toolResults && toolResults.length > 0) {
    for (const tool of toolResults) {
      try {
        const output =
          typeof tool.output === "string"
            ? JSON.parse(tool.output)
            : tool.output;

        // Extract layout data
        if (
          tool.toolName === "showEventLayout" &&
          output?.success &&
          output?.layout
        ) {
          layoutData = output.layout;
          eventName = output.eventName || "Event";
        }

        // Extract script data
        if (
          tool.toolName === "showEventScript" &&
          output?.success &&
          output?.segments
        ) {
          scriptData = output.segments;
          eventName = output.eventName || "Event";
        }
      } catch (e) {
        console.error("Error parsing tool output:", e);
      }
    }
  }

  // Regular expression to match audio links in various formats
  const audioLinkRegex = /\[([^\]]+)\]\(([^)]+\.mp3[^)]*)\)/g;
  const simpleLinkRegex = /(https?:\/\/[^\s]+\.mp3[^\s]*)/g;
  const listenHereRegex = /(Segment \d+[^:]*): (Listen Here)/gi;

  // Split the content by audio links
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Process markdown-style links: [text](url)
  while ((match = audioLinkRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Extract segment info from the link text
    const linkText = match[1];
    const audioUrl = match[2];

    // Try to extract segment ID from the URL or text
    const segmentIdMatch = audioUrl.match(/segment-(\d+)/);
    const segmentId = segmentIdMatch ? segmentIdMatch[1] : undefined;

    // Add audio player component
    parts.push(
      <ChatAudioLink
        key={`audio-${match.index}`}
        audioUrl={audioUrl}
        segmentId={segmentId}
        segmentName={linkText}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Process "Listen Here" links
  const remainingContent = content.substring(lastIndex);
  const processedContent = remainingContent.replace(
    listenHereRegex,
    (match, segmentName, linkText) => {
      return `<audio-link segment="${segmentName}" />`;
    }
  );

  // Process simple URLs
  const finalContent = processedContent.replace(simpleLinkRegex, (match) => {
    return `<audio-link url="${match}" />`;
  });

  // Add the remaining content
  if (finalContent) {
    parts.push(finalContent);
  }

  // Process the special tags in the final content
  const processedParts = parts.map((part, index) => {
    if (typeof part !== "string") return part;

    // Replace audio-link tags with actual components
    const segments = part.split(/<audio-link ([^>]+) \/>/g);
    if (segments.length === 1) return part;

    const renderedSegments: React.ReactNode[] = [];

    for (let i = 0; i < segments.length; i++) {
      renderedSegments.push(segments[i]);

      // Process attributes if this is an attribute segment
      if (i < segments.length - 1 && segments[i + 1]) {
        const attrs = segments[i + 1];

        // Extract segment name
        const segmentMatch = attrs.match(/segment="([^"]+)"/);
        const segmentName = segmentMatch ? segmentMatch[1] : undefined;

        // Extract URL
        const urlMatch = attrs.match(/url="([^"]+)"/);
        const url = urlMatch ? urlMatch[1] : undefined;

        if (url) {
          // Try to extract segment ID from the URL
          const segmentIdMatch = url.match(/segment-(\d+)/);
          const segmentId = segmentIdMatch ? segmentIdMatch[1] : undefined;

          renderedSegments.push(
            <ChatAudioLink
              key={`audio-${index}-${i}`}
              audioUrl={url}
              segmentId={segmentId}
              segmentName={segmentName}
            />
          );
        }

        // Skip the attribute segment
        i++;
      }
    }

    return renderedSegments;
  });

  // Create the final result with layout and script components if available
  const result = (
    <>
      {processedParts}

      {/* Render layout component if layout data is available */}
      {layoutData && (
        <ChatEventLayout
          layout={layoutData}
          eventName={eventName}
          compact={true}
        />
      )}

      {/* Render script component if script data is available */}
      {scriptData && (
        <ChatEventScript
          segments={scriptData.sort(
            (a: ScriptSegment, b: ScriptSegment) => a.order - b.order
          )}
          eventName={eventName}
          compact={true}
          onGenerateAudio={async (segmentId) => {
            if (eventId) {
              try {
                console.log(
                  `Generating audio for segment ${segmentId} of event ${eventId}`
                );

                // Call the audio generation function and await the result
                const result = await generateAudioForSegment(
                  eventId.toString(),
                  segmentId.toString()
                );

                console.log(`Audio generation result:`, result);

                if (!result.success) {
                  throw new Error(result.error || "Failed to generate audio");
                }

                // Return the updated segment data
                return result;
              } catch (error) {
                console.error("Error generating audio:", error);
                throw error; // Re-throw to let the component handle the error
              }
            }
          }}
          onGenerateBatchAudio={async (segmentIds) => {
            if (eventId) {
              try {
                console.log(
                  `Generating batch audio for ${segmentIds.length} segments of event ${eventId}`
                );

                // Call the batch audio generation function and await the result
                const result = await generateBatchAudio(
                  eventId.toString(),
                  segmentIds.map((id) => id.toString())
                );

                console.log(`Batch audio generation result:`, result);

                if (!result.success) {
                  throw new Error(
                    result.error || "Failed to generate batch audio"
                  );
                }

                // Return the updated segments data
                return result;
              } catch (error) {
                console.error("Error generating batch audio:", error);
                throw error; // Re-throw to let the component handle the error
              }
            }
          }}
        />
      )}
    </>
  );

  return result;
}
