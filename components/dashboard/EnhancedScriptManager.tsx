"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptSegment } from "@/types/event";
import {
  FileText,
  Sparkles,
  Wand2,
  Loader2,
  RefreshCcw,
  PlusCircle,
  MessageSquare,
  ArrowDownUp,
  Music,
  Mic,
} from "lucide-react";
import ScriptManager from "./ScriptManager";
import ScriptTTSGenerator from "./ScriptTTSGenerator";
import DOMBasedAudioPlayer from "./DOMBasedAudioPlayer";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface EnhancedScriptManagerProps {
  eventId: number;
  segments: ScriptSegment[];
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => Promise<void>;
  onDeleteSegment?: (segmentId: number) => void;
  onAddSegment?: () => void;
  onRegenerateAll?: () => void;
  onGenerateScript?: () => void;
  onGenerateAllTTS?: () => Promise<void>;
  onGenerateSingleTTS?: (segmentId: number) => Promise<void>;
  onReorderSegments?: (segments: ScriptSegment[]) => void;
  isGeneratingScript?: boolean;
  isGeneratingAudio?: boolean;
  hasLayout?: boolean;
  eventName?: string;
  eventType?: string;
}

export default function EnhancedScriptManager({
  eventId,
  segments,
  onUpdateSegment,
  onGenerateAudio,
  onDeleteSegment,
  onAddSegment,
  onRegenerateAll,
  onGenerateScript,
  onGenerateAllTTS,
  onGenerateSingleTTS,
  onReorderSegments,
  isGeneratingScript = false,
  isGeneratingAudio = false,
  hasLayout = true,
  eventName = "Event",
  eventType = "event",
}: EnhancedScriptManagerProps) {
  const [activeTab, setActiveTab] = useState("edit");
  const [showAIChat, setShowAIChat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAudioPreview, setSelectedAudioPreview] = useState<{
    audioUrl: string;
    title: string;
    scriptText: string;
    segmentId?: number; // Add segmentId for presigned URL
  } | null>(null);

  // Handle playing audio for a script segment
  const handlePlayAudio = (
    audioUrl: string,
    title: string,
    scriptText: string,
    segmentId?: number
  ) => {
    setSelectedAudioPreview({
      audioUrl,
      title: title || "Audio Preview",
      scriptText: scriptText || "",
      segmentId, // Pass the segment ID for presigned URL
    });
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    setIsDragging(false);

    // Dropped outside the list
    if (!result.destination || !segments) return;

    const items = Array.from(segments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    // Call the reorder callback if provided
    if (onReorderSegments) {
      onReorderSegments(updatedItems);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Script Management
              </CardTitle>
              <CardDescription>
                Edit script segments and generate audio for your event
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAIChat(!showAIChat)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {showAIChat ? "Hide AI Chat" : "AI Assistant"}
              </Button>
              {onGenerateScript && (
                <Button
                  variant="default"
                  onClick={onGenerateScript}
                  disabled={isGeneratingScript || !hasLayout}
                  title={
                    !hasLayout
                      ? "Create a layout first to generate a script"
                      : "Generate script based on your event layout"
                  }
                  className="flex items-center gap-1"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Script
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* AI Chat Assistant */}
          {showAIChat && (
            <div className="mb-6">
              <RhymeAIChat
                eventId={eventId}
                title="Script Assistant"
                initialMessage={`I'm here to help you with the script for "${eventName}". You can ask me to suggest content, improve wording, or provide ideas for your ${eventType}.`}
                placeholder="Ask about script content..."
                eventContext={{
                  purpose: "script-assistance",
                  contextType: "general-assistant",
                  requiredFields: [],
                  additionalInfo: {
                    eventName: eventName || "",
                    eventType: eventType || "",
                    scriptSegments: segments || [],
                  },
                }}
                preserveChat={true}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Edit Script</TabsTrigger>
              <TabsTrigger value="tts">Generate Audio</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <DragDropContext
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
              >
                <ScriptManager
                  segments={segments}
                  onUpdateSegment={onUpdateSegment}
                  onGenerateAudio={onGenerateAudio}
                  onDeleteSegment={onDeleteSegment}
                  onAddSegment={onAddSegment}
                  onRegenerateAll={onRegenerateAll}
                />
              </DragDropContext>
            </TabsContent>
            <TabsContent value="tts">
              {onGenerateAllTTS && onGenerateSingleTTS && (
                <ScriptTTSGenerator
                  segments={segments}
                  onGenerateAll={onGenerateAllTTS}
                  onGenerateSingle={onGenerateSingleTTS}
                  onPlayAudio={handlePlayAudio}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="text-sm text-muted-foreground">
            <p>
              Script segments are generated based on your event layout. Each
              segment can be edited and have its own audio generated.
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Audio Preview */}
      {selectedAudioPreview && (
        <DOMBasedAudioPlayer
          title={selectedAudioPreview.title}
          scriptText={selectedAudioPreview.scriptText}
          audioS3key={selectedAudioPreview.audioUrl}
          segmentId={selectedAudioPreview.segmentId} // Pass the segment ID for presigned URL
        />
      )}
    </div>
  );
}
