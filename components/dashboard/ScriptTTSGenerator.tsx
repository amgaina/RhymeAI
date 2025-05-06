"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScriptSegment } from "@/types/event";
import { Wand2, Play, Pause, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScriptTTSGeneratorProps {
  segments: ScriptSegment[];
  onGenerateAll: () => Promise<void>;
  onGenerateSingle: (segmentId: number) => Promise<void>;
  onPlayAudio: (
    audioUrl: string,
    title: string,
    content: string,
    segmentId?: number
  ) => void;
}

export default function ScriptTTSGenerator({
  segments,
  onGenerateAll,
  onGenerateSingle,
  onPlayAudio,
}: ScriptTTSGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(
    null
  );
  const [progress, setProgress] = useState(0);

  // Count segments by status
  const statusCounts = segments.reduce((acc, segment) => {
    acc[segment.status] = (acc[segment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate overall progress
  const totalSegments = segments.length;
  const generatedCount = statusCounts["generated"] || 0;
  const overallProgress = Math.round((generatedCount / totalSegments) * 100);

  // Handle generate all
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Start the generation process
      await onGenerateAll();

      // In a real implementation, you would update progress as each segment is processed
      // For now, we'll simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
    } finally {
      setIsGenerating(false);
      setCurrentSegmentIndex(null);
    }
  };

  // Handle generate single segment
  const handleGenerateSingle = async (segmentId: number, index: number) => {
    setCurrentSegmentIndex(index);

    try {
      await onGenerateSingle(segmentId);
    } catch (error) {
      console.error(`Error generating TTS for segment ${segmentId}:`, error);
    } finally {
      setCurrentSegmentIndex(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-accent" />
            <span>Text-to-Speech Generation</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5">
              {totalSegments} Segments
            </Badge>
            <Badge
              variant="outline"
              className={`${
                generatedCount === totalSegments
                  ? "bg-green-100 text-green-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {generatedCount}/{totalSegments} Generated
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {overallProgress}% Complete
              </p>
            </div>
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || generatedCount === totalSegments}
              className={`${
                generatedCount === totalSegments
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-accent hover:bg-accent/90"
              }`}
            >
              {isGenerating ? (
                <>
                  <Pause className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : generatedCount === totalSegments ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  All Generated
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate All
                </>
              )}
            </Button>
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-5">Content</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="divide-y">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-1 text-sm">{segment.order}</div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="capitalize">
                      {segment.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="col-span-5">
                    <p className="text-sm line-clamp-2">
                      {segment.content.substring(0, 100)}
                      {segment.content.length > 100 ? "..." : ""}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      className={`${
                        segment.status === "generated"
                          ? "bg-green-100 text-green-600"
                          : segment.status === "generating"
                          ? "bg-blue-100 text-blue-600"
                          : segment.status === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {segment.status === "generated" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : segment.status === "failed" ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : null}
                      {segment.status.charAt(0).toUpperCase() +
                        segment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    {segment.status === "generated" &&
                    (segment.audio || segment.audio_url) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onPlayAudio(
                            segment.audio_url || segment.audio!,
                            `${segment.type.replace(/_/g, " ")}`,
                            segment.content,
                            segment.id // Pass the segment ID for presigned URL
                          )
                        }
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          currentSegmentIndex === index ||
                          segment.status === "generating"
                        }
                        onClick={() => handleGenerateSingle(segment.id, index)}
                      >
                        {currentSegmentIndex === index ||
                        segment.status === "generating" ? (
                          <span className="animate-pulse">Generating...</span>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
