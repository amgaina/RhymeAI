import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import EventLayoutEditor from "../EventLayoutEditor";
import { EventLayout, LayoutSegment } from "@/types/layout";

interface EventLayoutStepProps {
  eventId: number | null;
  eventLayout: EventLayout | null;
  isGeneratingLayout: boolean;
  isGeneratingScript: boolean;
  onGenerateLayout: (eventId: string) => void;
  onUpdateSegment: (segment: LayoutSegment) => void;
  onAddSegment: (segment: Omit<LayoutSegment, "id">) => void;
  onDeleteSegment: (segmentId: string) => void;
  onGenerateScript: () => void;
  onBack: () => void;
}

export function EventLayoutStep({
  eventId,
  eventLayout,
  isGeneratingLayout,
  isGeneratingScript,
  onGenerateLayout,
  onUpdateSegment,
  onAddSegment,
  onDeleteSegment,
  onGenerateScript,
  onBack,
}: EventLayoutStepProps) {
  console.log("Event Layout Step Props:", {
    eventId,
    eventLayout,
    isGeneratingLayout,
    isGeneratingScript,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Event Layout</h2>

      {isGeneratingLayout ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Generating event layout based on your information...</p>
          </div>
        </div>
      ) : eventLayout ? (
        <div className="space-y-4">
          <EventLayoutEditor
            layout={eventLayout}
            onUpdateSegment={onUpdateSegment}
            onAddSegment={onAddSegment}
            onDeleteSegment={onDeleteSegment}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>

            <Button onClick={onGenerateScript} disabled={isGeneratingScript}>
              {isGeneratingScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  Generate Script
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p>No layout available. Please generate a layout first.</p>
            <Button
              className="mt-4"
              onClick={() => {
                if (eventId) {
                  console.log("Generating layout for event ID:", eventId);
                  onGenerateLayout(eventId.toString());
                } else {
                  console.error("No event ID available for layout generation");
                  // Show error message to the user
                  alert(
                    "Error: Cannot generate layout - no event ID available."
                  );
                }
              }}
            >
              Generate Layout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
