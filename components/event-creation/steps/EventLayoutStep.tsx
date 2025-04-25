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
  onGoToDetails?: () => void; // Optional for backward compatibility
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
  onGoToDetails,
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
            <Button
              variant="outline"
              onClick={onGoToDetails || onBack}
              title="Go back to edit event details"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (eventId) {
                    onGenerateLayout(eventId.toString());
                  }
                }}
                disabled={isGeneratingLayout}
              >
                {isGeneratingLayout ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>Regenerate Layout</>
                )}
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
        </div>
      ) : (
        <div className="p-8 border rounded-lg bg-muted/30">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Create Event Layout</h3>
            <p className="text-muted-foreground">
              Generate an AI-powered layout for your event based on the details
              you provided. This will create segments for your event with
              appropriate timing and structure.
            </p>

            <div className="bg-primary/5 p-4 rounded-md border text-left">
              <h4 className="font-medium mb-2">What happens next:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>AI will analyze your event details</li>
                <li>Create appropriate segments based on event type</li>
                <li>Allocate time for each segment</li>
                <li>You can then customize the layout as needed</li>
              </ol>
            </div>

            <Button
              size="lg"
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
              disabled={isGeneratingLayout}
            >
              {isGeneratingLayout ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Layout...
                </>
              ) : (
                <>Generate Event Layout</>
              )}
            </Button>

            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoToDetails || onBack}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Event Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
