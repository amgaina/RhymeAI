import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { EventLayout } from "@/types/layout";
import { ScriptSegment } from "@/types/event";

interface FinalizeEventStepProps {
  eventId?: number | null; // Optional for backward compatibility
  eventData: Record<string, any> | null;
  eventLayout: EventLayout | null;
  scriptSegments: ScriptSegment[];
  isLoading: boolean;
  onFinalizeEvent: () => void;
  onFinalizeWithoutTTS: () => void;
  onGenerateAllTTS: () => void;
  isGeneratingTTS: boolean;
  onBack: () => void;
  onGoToDetails?: () => void; // Optional for backward compatibility
}

export function FinalizeEventStep({
  eventId,
  eventData,
  eventLayout,
  scriptSegments,
  isLoading,
  onFinalizeEvent,
  onFinalizeWithoutTTS,
  onGenerateAllTTS,
  isGeneratingTTS,
  onBack,
  onGoToDetails,
}: FinalizeEventStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Finalize Event</h2>

      <div className="space-y-4 p-6 border rounded-lg bg-muted/50">
        <h3 className="font-medium text-lg">Event Summary</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Event Details</h4>
            <p>
              {eventData?.eventName} - {eventData?.eventType}
            </p>
            <p>
              {eventData?.eventDate} at {eventData?.eventLocation}
            </p>
          </div>

          <div>
            <h4 className="font-medium">Layout</h4>
            <p>
              {eventLayout?.segments.length} segments,{" "}
              {eventLayout?.totalDuration} minutes total
            </p>
          </div>

          <div>
            <h4 className="font-medium">Script</h4>
            <p>{scriptSegments.length} script segments</p>
            <p>
              {scriptSegments.filter((s) => s.status === "generated").length}{" "}
              segments with audio
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Script
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

          <div className="flex space-x-2">
            <Button
              onClick={onGenerateAllTTS}
              disabled={isLoading || isGeneratingTTS}
              variant="outline"
            >
              {isGeneratingTTS ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                "Generate All TTS"
              )}
            </Button>

            <Button
              onClick={onFinalizeWithoutTTS}
              disabled={isLoading}
              variant="secondary"
            >
              Finalize Without TTS
            </Button>

            <Button
              onClick={onFinalizeEvent}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Finalize Event"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
