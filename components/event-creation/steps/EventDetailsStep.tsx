import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import SafeAIChat from "@/components/SafeAIChat";

interface EventDetailsStepProps {
  eventData: Record<string, any> | null;
  isLoading: boolean;
  onEventDataCollected: (data: Record<string, any>) => void;
  onContinue: () => void;
}

export function EventDetailsStep({
  eventData,
  isLoading,
  onEventDataCollected,
  onContinue,
}: EventDetailsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Event Details</h2>

      {!eventData ? (
        <SafeAIChat
          className="border rounded-lg shadow-sm"
          title="Event Creation Assistant"
          description="I'll help you create your AI host script by collecting all necessary information about your event."
          initialMessage="Hi! I'm your RhymeAI event assistant. I'll help you create a script for your event's AI host. To create an effective script, I need to collect some essential information about your event. Let's start with the basics:

1. What's the name of your event?
2. What type of event is it? (conference, webinar, workshop, etc.)
3. When will the event take place?
4. Where will it be held?
5. How many attendees do you expect?
6. Please provide a brief description of your event.
7. Do you have any preferences for the AI host's voice? (gender, tone, accent)

You can share as much detail as you'd like - the more information you provide, the better I can tailor the AI host script to your specific event!"
          placeholder="Tell me about your event..."
          eventContext={{
            purpose: "To create a customized AI host script for an event",
            requiredFields: [
              "eventName",
              "eventType",
              "eventDate",
              "eventLocation",
              "audienceSize",
              "speakerInfo",
              "voicePreference",
              "language",
              "eventDescription",
            ],
            contextType: "event-creation",
            additionalInfo: {
              currentStep: "information-gathering",
              nextStep: "layout-generation",
            },
          }}
          onEventDataCollected={onEventDataCollected}
        />
      ) : (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium">Collected Event Information</h3>
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-sm font-medium">Event Name:</dt>
            <dd>{eventData.eventName}</dd>

            <dt className="text-sm font-medium">Event Type:</dt>
            <dd>{eventData.eventType}</dd>

            <dt className="text-sm font-medium">Date:</dt>
            <dd>{eventData.eventDate}</dd>

            <dt className="text-sm font-medium">Location:</dt>
            <dd>{eventData.eventLocation || "Not specified"}</dd>

            <dt className="text-sm font-medium">Expected Audience:</dt>
            <dd>{eventData.audienceSize || "Not specified"}</dd>

            <dt className="text-sm font-medium">Description:</dt>
            <dd className="col-span-2">
              {eventData.eventDescription || "Not provided"}
            </dd>
          </dl>

          <div className="flex justify-end">
            <Button onClick={onContinue} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  Continue to Layout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
