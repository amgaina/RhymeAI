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
} from "lucide-react";
import ScriptManager from "./ScriptManager";
import ScriptTTSGenerator from "./ScriptTTSGenerator";
import DOMBasedAudioPlayer from "./DOMBasedAudioPlayer";

interface EnhancedScriptManagerProps {
  segments: ScriptSegment[];
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => Promise<void>;
  onDeleteSegment?: (segmentId: number) => void;
  onAddSegment?: () => void;
  onRegenerateAll?: () => void;
  onGenerateScript?: () => void;
  onGenerateAllTTS?: () => Promise<void>;
  onGenerateSingleTTS?: (segmentId: number) => Promise<void>;
  isGeneratingScript?: boolean;
  hasLayout?: boolean;
}

export default function EnhancedScriptManager({
  segments,
  onUpdateSegment,
  onGenerateAudio,
  onDeleteSegment,
  onAddSegment,
  onRegenerateAll,
  onGenerateScript,
  onGenerateAllTTS,
  onGenerateSingleTTS,
  isGeneratingScript = false,
  hasLayout = true,
}: EnhancedScriptManagerProps) {
  const [activeTab, setActiveTab] = useState("edit");
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Edit Script</TabsTrigger>
              <TabsTrigger value="tts">Generate Audio</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <ScriptManager
                segments={segments}
                onUpdateSegment={onUpdateSegment}
                onGenerateAudio={onGenerateAudio}
                onDeleteSegment={onDeleteSegment}
                onAddSegment={onAddSegment}
                onRegenerateAll={onRegenerateAll}
              />
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
          audioUrl={selectedAudioPreview.audioUrl}
          segmentId={selectedAudioPreview.segmentId} // Pass the segment ID for presigned URL
        />
      )}
    </div>
  );
}
