"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Clock, FileText, Mic, Play, Volume2 } from "lucide-react";
import { ScriptSegment } from "@/types/event";
import { getEventById } from "@/app/actions/event";
import { formatDuration } from "@/lib/utils";
import { generateAudioForSegment } from "@/app/actions/event/audio-generation";
import ImprovedAudioPlayer from "@/components/dashboard/ImprovedAudioPlayer";

interface ChatScriptViewerProps {
  eventId: string | number;
  scriptData?: ScriptSegment[];
  onClose: () => void;
}

export default function ChatScriptViewer({
  eventId,
  scriptData: initialScriptData,
  onClose,
}: ChatScriptViewerProps) {
  const [segments, setSegments] = useState<ScriptSegment[]>(
    initialScriptData || []
  );
  const [isLoading, setIsLoading] = useState(!initialScriptData);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch script data if not provided
  useEffect(() => {
    if (!initialScriptData) {
      const fetchScript = async () => {
        try {
          setIsLoading(true);
          const result = await getEventById(eventId.toString());

          if (result.success && result.event?.scriptSegments) {
            setSegments(result.event.scriptSegments);
          } else {
            setError(result.error || "Failed to load script data");
            toast({
              title: "Error",
              description: "Failed to load script data",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching script:", error);
          setError("An unexpected error occurred");
          toast({
            title: "Error",
            description: "An unexpected error occurred while loading script",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchScript();
    }
  }, [eventId, initialScriptData, toast]);

  // Handle generating audio for a segment
  const handleGenerateAudio = async (segmentId: number) => {
    try {
      setGeneratingAudio(segmentId);

      const result = await generateAudioForSegment(
        eventId.toString(),
        segmentId.toString()
      );

      if (result.success) {
        // Update the segment with the new audio URL
        setSegments((prev) =>
          prev.map((segment) =>
            segment.id === segmentId
              ? {
                  ...segment,
                  audio: result.audioUrl,
                  status: "generated" as const,
                }
              : segment
          )
        );

        toast({
          title: "Audio Generated",
          description: "Audio has been generated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate audio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating audio",
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Event Script</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading script...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || segments.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Event Script</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-destructive">
              {segments.length === 0
                ? "No script segments available"
                : "Failed to load script information"}
            </p>
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Event Script</CardTitle>
          <CardDescription>{segments.length} script segments</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {segments
            .sort((a, b) => a.order - b.order)
            .map((segment) => (
              <Card
                key={segment.id}
                className={activeSegment === segment.id ? "border-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {segment.type}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDuration(segment.timing)} • {segment.status}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {segment.audio_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            setActiveSegment(
                              activeSegment === segment.id ? null : segment.id
                            )
                          }
                        >
                          <Volume2 className="h-4 w-4 mr-1" />
                          {activeSegment === segment.id
                            ? "Hide Player"
                            : "Play Audio"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleGenerateAudio(segment.id)}
                          disabled={generatingAudio === segment.id}
                        >
                          {generatingAudio === segment.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4 mr-1" />
                              Generate Audio
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {segment.content}
                  </p>

                  {activeSegment === segment.id && segment.audio && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <ImprovedAudioPlayer
                        audioUrl={segment.audio_url}
                        segmentId={segment.id}
                        showControls={true}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
