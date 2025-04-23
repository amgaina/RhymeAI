import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { EventLayout } from "@/types/layout";
import { ScriptSegment } from "@/types/event";

interface FinalizeEventStepProps {
  eventData: Record<string, any> | null;
  eventLayout: EventLayout | null;
  scriptSegments: ScriptSegment[];
  isLoading: boolean;
  onFinalizeEvent: () => void;
  onBack: () => void;
}

export function FinalizeEventStep({
  eventData,
  eventLayout,
  scriptSegments,
  isLoading,
  onFinalizeEvent,
  onBack,
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
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Script
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
  );
}
