import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScriptEditor from "@/components/ScriptEditor";
import AudioPreview from "@/components/AudioPreview";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { ScriptSegment } from "@/types/event";

interface ScriptGenerationProps {
  scriptSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  collectedEventData: Record<string, string> | null;
  progress: number;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
  onFinalize: () => void;
}

export default function ScriptGeneration({
  scriptSegments,
  selectedSegment,
  collectedEventData,
  progress,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
  onFinalize,
}: ScriptGenerationProps) {
  const { isPlaying, speakText, stopSpeaking } = useTextToSpeech();

  // Only show "preparing" message when we have event data but no segments yet
  const showPreparingMessage =
    collectedEventData &&
    typeof collectedEventData === "object" &&
    scriptSegments.length === 0;

  // Only show script content when we have segments
  const showScriptContent = scriptSegments.length > 0;

  if (!showPreparingMessage && !showScriptContent) {
    return null; // Don't render anything if we don't have data yet
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {showPreparingMessage && (
        <div className="bg-accent/10 p-4 rounded-lg">
          <p className="text-accent">
            Event details collected. Preparing to generate your script...
          </p>
        </div>
      )}

      {showScriptContent && (
        <>
          <div className="border-t border-primary/10 pt-6 mt-2">
            <h3 className="text-xl font-bold text-primary-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Generated Script
              {collectedEventData && typeof collectedEventData === "object" && (
                <span className="text-sm font-normal text-primary-foreground/70 ml-2">
                  Based on your{" "}
                  {(collectedEventData.eventType as string) || "event"} details
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
                  ? () => speakText(selectedSegment.content)
                  : undefined
              }
              onTtsStop={
                selectedSegment.audio?.startsWith("mock-audio-url")
                  ? stopSpeaking
                  : undefined
              }
              isPlaying={isPlaying}
            />
          )}

          <div className="flex justify-end">
            <Button
              onClick={onFinalize}
              disabled={progress < 75}
              className="bg-cta hover:bg-cta/90 text-white btn-pulse"
            >
              Finalize Event
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
