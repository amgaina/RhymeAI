import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import ScriptEditor, { ScriptSegment } from "@/components/ScriptEditor";
import AudioPreview from "@/components/AudioPreview";

interface ScriptDisplayProps {
  scriptSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  isGeneratingScript: boolean;
  collectedEventData: Record<string, string> | null;
  isPlaying: boolean;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onFinalizeEvent: () => void;
  progress: number;
}

export default function ScriptDisplay({
  scriptSegments,
  selectedSegment,
  isGeneratingScript,
  collectedEventData,
  isPlaying,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
  onSpeakText,
  onStopSpeaking,
  onFinalizeEvent,
  progress,
}: ScriptDisplayProps) {
  if (scriptSegments.length === 0 && !isGeneratingScript) {
    return null;
  }

  return (
    <>
      {isGeneratingScript && (
        <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-primary-foreground">
            Generating your event script based on collected information...
          </p>
        </div>
      )}

      {scriptSegments.length > 0 && (
        <>
          <div className="border-t border-primary/10 pt-6 mt-2">
            <h3 className="text-xl font-bold text-primary-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Generated Script
              {collectedEventData && (
                <span className="text-sm font-normal text-primary-foreground/70 ml-2">
                  Based on your {collectedEventData.eventType || "event"}{" "}
                  details
                </span>
              )}
            </h3>
            <ScriptEditor
              segments={scriptSegments}
              onUpdateSegment={onUpdateSegment}
              onGenerateAudio={onGenerateAudio}
              onPlayAudio={onPlayAudio}
            />
          </div>

          {selectedSegment && (
            <AudioPreview
              title={`Preview: ${selectedSegment.type}`}
              scriptText={selectedSegment.content}
              audioUrl={selectedSegment.audio}
              onTtsPlay={
                selectedSegment.audio?.startsWith("mock-audio-url")
                  ? () => onSpeakText(selectedSegment.content)
                  : undefined
              }
              onTtsStop={
                selectedSegment.audio?.startsWith("mock-audio-url")
                  ? onStopSpeaking
                  : undefined
              }
              isPlaying={isPlaying}
            />
          )}

          <div className="flex justify-end">
            <Button
              onClick={onFinalizeEvent}
              disabled={progress < 75}
              className="bg-cta hover:bg-cta/90 text-white btn-pulse"
            >
              Finalize Event
            </Button>
          </div>
        </>
      )}
    </>
  );
}
