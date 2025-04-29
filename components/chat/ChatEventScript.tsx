"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChatAudioElement } from "./ChatAudioElement";

interface ScriptSegment {
  id: number;
  type: string;
  content: string;
  audio_url?: string;
  status: "draft" | "editing" | "generating" | "generated";
  order: number;
  timing: number;
}

interface ChatEventScriptProps {
  segments: ScriptSegment[];
  eventName: string;
  compact?: boolean;
  onGenerateAudio?: (segmentId: number) => Promise<any>;
  onGenerateBatchAudio?: (segmentIds: number[]) => Promise<any>;
}

export function ChatEventScript({
  segments,
  eventName,
  compact = true,
  onGenerateAudio,
  onGenerateBatchAudio,
}: ChatEventScriptProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [expandedSegments, setExpandedSegments] = useState<
    Record<number, boolean>
  >({});
  const [playingSegment, setPlayingSegment] = useState<number | null>(null);
  const [generatingSegments, setGeneratingSegments] = useState<
    Record<number, boolean>
  >({});
  const [segmentErrors, setSegmentErrors] = useState<Record<number, string>>(
    {}
  );
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle a specific segment
  const toggleSegment = (segmentId: number) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [segmentId]: !prev[segmentId],
    }));
  };

  // Toggle audio player
  const toggleAudioPlayer = (segmentId: number) => {
    setPlayingSegment(playingSegment === segmentId ? null : segmentId);
  };

  // Handle generate audio with proper async handling
  const handleGenerateAudio = async (segmentId: number) => {
    if (!onGenerateAudio) return;

    try {
      // Set loading state
      setGeneratingSegments((prev) => ({
        ...prev,
        [segmentId]: true,
      }));

      // Clear any previous errors
      setSegmentErrors((prev) => ({
        ...prev,
        [segmentId]: "",
      }));

      // Call the generation function
      await onGenerateAudio(segmentId);

      // Automatically expand the segment and show the audio player
      setExpandedSegments((prev) => ({
        ...prev,
        [segmentId]: true,
      }));

      setPlayingSegment(segmentId);
    } catch (error) {
      console.error(`Error generating audio for segment ${segmentId}:`, error);

      // Set error state
      setSegmentErrors((prev) => ({
        ...prev,
        [segmentId]:
          error instanceof Error ? error.message : "Failed to generate audio",
      }));
    } finally {
      // Clear loading state
      setGeneratingSegments((prev) => ({
        ...prev,
        [segmentId]: false,
      }));
    }
  };

  // Handle batch audio generation
  const handleBatchGeneration = async () => {
    if (!onGenerateBatchAudio) return;

    // Get segments without audio
    const segmentsWithoutAudio = segments
      .filter((segment) => !segment.audio_url)
      .map((segment) => segment.id);

    if (segmentsWithoutAudio.length === 0) {
      return; // Nothing to generate
    }

    try {
      setIsBatchGenerating(true);
      setBatchError(null);

      // Call the batch generation function
      await onGenerateBatchAudio(segmentsWithoutAudio);

      // Expand all segments after generation
      setIsExpanded(true);
    } catch (error) {
      console.error("Error generating batch audio:", error);
      setBatchError(
        error instanceof Error
          ? error.message
          : "Failed to generate audio for all segments"
      );
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Sort segments by order
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  // Count segments without audio
  const segmentsWithoutAudio = segments.filter(
    (segment) => !segment.audio_url
  ).length;

  return (
    <div className="my-4 border rounded-lg overflow-hidden bg-card">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{eventName} Script</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{segments.length} script segments</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {segmentsWithoutAudio > 0 && onGenerateBatchAudio && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchGeneration}
              disabled={isBatchGenerating}
              className="h-8 text-xs"
            >
              {isBatchGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Generate All Audio
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Show batch error if there is one */}
      {batchError && (
        <div className="p-2 m-2 bg-destructive/10 text-destructive text-xs rounded-md">
          Error generating audio: {batchError}
        </div>
      )}

      {isExpanded && (
        <div className="p-4">
          {sortedSegments.map((segment) => (
            <div
              key={segment.id}
              className="mb-3 border rounded-md overflow-hidden"
            >
              <div
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSegment(segment.id)}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-6 px-2 flex items-center"
                  >
                    {segment.order}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-sm">{segment.type}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(segment.timing)} • {segment.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {segment.audio_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudioPlayer(segment.id);
                      }}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      {playingSegment === segment.id
                        ? "Hide Player"
                        : "Play Audio"}
                    </Button>
                  ) : generatingSegments[segment.id] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled
                    >
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateAudio(segment.id);
                      }}
                    >
                      <Mic className="h-3 w-3 mr-1" />
                      Generate Audio
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedSegments[segment.id] ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {expandedSegments[segment.id] && (
                <div className="p-3 pt-0 border-t">
                  <p className="text-sm mt-2 whitespace-pre-wrap">
                    {segment.content}
                  </p>

                  {/* Show error message if there is one */}
                  {segmentErrors[segment.id] && (
                    <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded-md">
                      Error: {segmentErrors[segment.id]}
                    </div>
                  )}

                  {playingSegment === segment.id && segment.audio_url && (
                    <div className="mt-3">
                      <ChatAudioElement
                        audioUrl={segment.audio_url}
                        segmentId={segment.id}
                        compact={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isExpanded && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="flex items-center gap-1"
          >
            <ChevronDown className="h-4 w-4" />
            Show {segments.length} script segments
          </Button>
        </div>
      )}
    </div>
  );
}
