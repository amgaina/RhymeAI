import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import ScriptEditor from "../ScriptEditor";
import AudioPreview from "@/components/AudioPreview";
import { ScriptSegment } from "@/types/event";

interface ScriptGenerationStepProps {
  eventId?: number | null; // Optional for backward compatibility
  scriptSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  isGeneratingScript: boolean;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
  onGenerateScript: () => void;
  onBack: () => void;
  onGoToDetails?: () => void; // Optional for backward compatibility
  onContinue: () => void;
}

export function ScriptGenerationStep({
  eventId,
  scriptSegments,
  selectedSegment,
  isGeneratingScript,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
  onGenerateScript,
  onBack,
  onGoToDetails,
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

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Layout
              </Button>

              {onGoToDetails && (
                <Button
                  variant="ghost"
                  onClick={onGoToDetails}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                  </svg>
                  Back to Details
                </Button>
              )}
            </div>

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
