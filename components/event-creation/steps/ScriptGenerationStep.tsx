import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import ScriptEditor from "../ScriptEditor";
import AudioPreview from "@/components/AudioPreview";
import { ScriptSegment } from "@/types/event";

interface ScriptGenerationStepProps {
  scriptSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  isGeneratingScript: boolean;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
  onGenerateScript: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ScriptGenerationStep({
  scriptSegments,
  selectedSegment,
  isGeneratingScript,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
  onGenerateScript,
  onBack,
  onContinue,
}: ScriptGenerationStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Script Generation</h2>

      {scriptSegments.length > 0 ? (
        <div className="space-y-4">
          <ScriptEditor
            segments={scriptSegments}
            onUpdateSegment={onUpdateSegment}
            onGenerateAudio={onGenerateAudio}
            onPlayAudio={onPlayAudio}
          />

          {selectedSegment && (
            <AudioPreview
              title={`Preview: ${selectedSegment.type}`}
              scriptText={selectedSegment.content}
              audioUrl={selectedSegment.audio || undefined}
            />
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Layout
            </Button>

            <Button
              onClick={onContinue}
              disabled={!scriptSegments.some((s) => s.status === "generated")}
            >
              Continue to Finalize
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p>No script segments available. Please generate a script first.</p>
            <Button
              className="mt-4"
              onClick={onGenerateScript}
              disabled={isGeneratingScript}
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                "Generate Script"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
