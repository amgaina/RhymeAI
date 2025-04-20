import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScriptEditor from "@/components/ScriptEditor";
import AudioPreview from "@/components/AudioPreview";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { ScriptSegment } from "@/types/event";

interface ScriptGenerationProps {
  isGeneratingScript: boolean;
  scriptSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  collectedEventData: Record<string, string> | null;
  progress: number;
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
  onEventDataCollected: (data: Record<string, string>) => void;
  onFinalize: () => void;
}

export default function ScriptGeneration({
  isGeneratingScript,
  scriptSegments,
  selectedSegment,
  collectedEventData,
  progress,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
  onEventDataCollected,
  onFinalize,
}: ScriptGenerationProps) {
  const { isPlaying, speakText, stopSpeaking } = useTextToSpeech();

  return (
    <div className="grid grid-cols-1 gap-6">
      {isGeneratingScript && (
        <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-primary-foreground">
            Generating your event script based on collected information...
          </p>
        </div>
      )}

      <RhymeAIChat
        className="border-0 shadow-none"
        title="Event Creation Assistant"
        description="I'll help you create your AI host script by collecting all necessary information about your event."
        initialMessage="Hi! I'm your RhymeAI event assistant. I'll help you create a script for your event's AI host. To create an effective script, I need to collect some essential information about your event. Let's start with the basics:

1. What's the name of your event?
2. What type of event is it? (conference, webinar, workshop, etc.)
3. When will the event take place?
4. Where will it be held?

You can share as much detail as you'd like - the more information you provide, the better I can tailor the AI host script to your specific event!"
        placeholder="Tell me about your event..."
        eventContext={{
          purpose: "To create a customized AI host script for an event",
          requiredFields: [
            "eventName",
            "eventType",
            "eventDate",
            "eventLocation",
            "expectedAttendees",
            "eventDescription",
            "speakerInformation",
            "specialInstructions",
            "voicePreferences",
            "languagePreferences",
          ],
          contextType: "event-creation",
          additionalInfo: {
            currentStep: "information-gathering",
            nextStep: "script-generation",
          },
        }}
        onEventDataCollected={onEventDataCollected}
      />

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
