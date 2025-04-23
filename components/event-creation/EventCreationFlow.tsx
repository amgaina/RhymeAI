"use client";
import { useState } from "react";
import {
  createEvent,
  generateEventLayout,
  generateScriptFromLayout,
  updateEventLayoutSegment,
  addLayoutSegment,
  deleteLayoutSegment,
  finalizeEvent,
} from "@/app/actions/event";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { ScriptSegment } from "@/types/event";
import { useToast } from "@/components/ui/use-toast";
import { EventDetailsStep } from "./steps/EventDetailsStep";
import { EventLayoutStep } from "./steps/EventLayoutStep";
import { ScriptGenerationStep } from "./steps/ScriptGenerationStep";
import { FinalizeEventStep } from "./steps/FinalizeEventStep";

// Define the steps in the event creation flow
type FlowStep =
  | "event_details"
  | "event_layout"
  | "script_generation"
  | "finalize";

export default function EventCreationFlow() {
  const { toast } = useToast();

  // State for tracking the current step in the flow
  const [currentStep, setCurrentStep] = useState<FlowStep>("event_details");

  // State for event data
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventData, setEventData] = useState<Record<string, any> | null>(null);

  // State for layout data
  const [eventLayout, setEventLayout] = useState<EventLayout | null>(null);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);

  // State for script data
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(
    null
  );

  // State for tracking progress
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Handle event data collection from chat or form
  const handleEventDataCollected = async (data: Record<string, any>) => {
    if (!data || typeof data !== "object") {
      console.error("Invalid event data received:", data);
      return;
    }

    setEventData(data);
    setProgress(25);

    // Create FormData object for the server action
    const formData = new FormData();
    formData.append("eventName", data.eventName || "");
    formData.append("eventType", data.eventType || "");
    formData.append(
      "eventDate",
      data.eventDate || new Date().toISOString().split("T")[0]
    );

    if (data.eventLocation)
      formData.append("eventLocation", data.eventLocation);
    if (data.audienceSize)
      formData.append("expectedAttendees", data.audienceSize);
    if (data.eventDescription)
      formData.append("eventDescription", data.eventDescription);
    if (data.language) formData.append("language", data.language);

    // Voice settings
    if (data.voicePreference?.gender)
      formData.append("voiceGender", data.voicePreference.gender);
    if (data.voicePreference?.tone)
      formData.append("voiceType", data.voicePreference.tone);
    if (data.voicePreference?.accent)
      formData.append("accent", data.voicePreference.accent);
    if (data.voicePreference?.speed)
      formData.append(
        "speakingRate",
        data.voicePreference.speed === "fast"
          ? "80"
          : data.voicePreference.speed === "slow"
          ? "20"
          : "50"
      );
    if (data.voicePreference?.pitch)
      formData.append(
        "pitch",
        data.voicePreference.pitch === "high"
          ? "80"
          : data.voicePreference.pitch === "low"
          ? "20"
          : "50"
      );

    try {
      setIsLoading(true);
      const result = await createEvent(formData);

      if (result.success && result.eventId) {
        // Store the event ID
        const newEventId = result.eventId;

        // Update state
        setEventId(newEventId);
        toast({
          title: "Event created successfully!",
          description: "Now let's create a layout for your event.",
        });

        // Move to the next step
        setCurrentStep("event_layout");

        // Generate layout automatically using the event ID directly
        // This ensures we don't depend on the state update
        generateLayout(newEventId.toString());
      } else {
        toast({
          title: "Error creating event",
          description:
            result.error || "There was a problem creating your event.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate event layout
  const generateLayout = async (id: string) => {
    if (!id) {
      console.error("Cannot generate layout: No event ID provided");
      return;
    }

    console.log("Generating layout for event ID:", id);

    try {
      setIsGeneratingLayout(true);
      console.log("Calling generateEventLayout with ID:", id);
      const result = await generateEventLayout(id);
      console.log("Layout generation result:", result);

      if (result.success && result.layout) {
        setEventLayout(result.layout);
        setProgress(50);
        toast({
          title: "Layout generated!",
          description: "Review and customize the layout for your event.",
        });
      } else {
        console.error("Error in layout generation result:", result.error);
        toast({
          title: "Error generating layout",
          description: result.error || "Failed to generate event layout.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating layout:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error generating layout",
        description: `Failed to generate layout: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  // Handle layout segment updates
  const handleUpdateLayoutSegment = async (segment: LayoutSegment) => {
    if (!eventId) return;

    try {
      const result = await updateEventLayoutSegment(
        eventId.toString(),
        segment
      );

      if (result.success) {
        // Update the local state with the updated segment
        if (eventLayout) {
          const updatedSegments = eventLayout.segments.map((s) =>
            s.id === segment.id ? segment : s
          );

          setEventLayout({
            ...eventLayout,
            segments: updatedSegments,
            lastUpdated: new Date().toISOString(),
          });
        }

        toast({
          title: "Segment updated",
          description: "Layout segment has been updated successfully.",
        });
      } else {
        toast({
          title: "Error updating segment",
          description: result.error || "Failed to update layout segment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating layout segment:", error);
      toast({
        title: "Error",
        description: "Failed to update segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add a new layout segment
  const handleAddLayoutSegment = async (segment: Omit<LayoutSegment, "id">) => {
    if (!eventId || !eventLayout) return;

    try {
      // Create a temporary ID for optimistic UI updates
      const tempSegment = {
        ...segment,
        id: `temp-${Date.now()}`,
      };

      // Optimistically update UI
      setEventLayout({
        ...eventLayout,
        segments: [...eventLayout.segments, tempSegment],
        lastUpdated: new Date().toISOString(),
      });

      // Call server action
      const result = await addLayoutSegment(eventId.toString(), segment);

      if (result.success && result.newSegment) {
        // Update with the real segment from the server
        setEventLayout({
          ...eventLayout,
          segments: eventLayout.segments
            .filter((s) => s.id !== tempSegment.id)
            .concat(result.newSegment),
          lastUpdated: new Date().toISOString(),
        });

        toast({
          title: "Segment added",
          description: "New layout segment has been added successfully.",
        });
      } else {
        // Revert optimistic update
        setEventLayout({
          ...eventLayout,
          segments: eventLayout.segments.filter((s) => s.id !== tempSegment.id),
          lastUpdated: new Date().toISOString(),
        });

        toast({
          title: "Error adding segment",
          description: result.error || "Failed to add layout segment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding layout segment:", error);
      toast({
        title: "Error",
        description: "Failed to add segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete a layout segment
  const handleDeleteLayoutSegment = async (segmentId: string) => {
    if (!eventId || !eventLayout) return;

    try {
      // Optimistically update UI
      const filteredSegments = eventLayout.segments.filter(
        (s) => s.id !== segmentId
      );

      setEventLayout({
        ...eventLayout,
        segments: filteredSegments,
        lastUpdated: new Date().toISOString(),
      });

      // Call server action
      const result = await deleteLayoutSegment(eventId.toString(), segmentId);

      if (result.success) {
        toast({
          title: "Segment deleted",
          description: "Layout segment has been deleted successfully.",
        });
      } else {
        // Revert optimistic update
        setEventLayout({
          ...eventLayout,
          segments: eventLayout.segments,
          lastUpdated: new Date().toISOString(),
        });

        toast({
          title: "Error deleting segment",
          description: result.error || "Failed to delete layout segment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting layout segment:", error);
      toast({
        title: "Error",
        description: "Failed to delete segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate script from layout
  const handleGenerateScript = async () => {
    if (!eventId) return;

    try {
      setIsGeneratingScript(true);
      const result = await generateScriptFromLayout(eventId.toString());

      if (result.success && result.segments) {
        // Transform the segments to match our client-side format
        const formattedSegments = result.segments.map((segment: any) => ({
          id: segment.id,
          type: segment.segment_type,
          content: segment.content,
          audio: segment.audio_url,
          status: segment.status,
          order: segment.order,
          timing: segment.timing,
          presentationSlide: null,
        }));

        setScriptSegments(formattedSegments);
        setProgress(75);
        setCurrentStep("script_generation");

        toast({
          title: "Script generated!",
          description: "Review and edit the script segments for your event.",
        });
      } else {
        toast({
          title: "Error generating script",
          description: result.error || "Failed to generate script from layout.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handle script segment updates
  const handleUpdateScriptSegment = (segmentId: number, content: string) => {
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, content, status: "editing" as const }
          : segment
      )
    );
  };

  // Handle generating audio for a script segment
  const handleGenerateAudio = (segmentId: number) => {
    // Set status to generating
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" as const }
          : segment
      )
    );

    // Get the segment content
    const segment = scriptSegments.find((s) => s.id === segmentId);
    if (!segment) return;

    // Simulate audio generation with timeout
    setTimeout(() => {
      setScriptSegments((prev) =>
        prev.map((s) =>
          s.id === segmentId
            ? {
                ...s,
                status: "generated" as const,
                audio: `mock-audio-url-${segmentId}.mp3`,
              }
            : s
        )
      );

      // If all segments have audio, increase progress
      if (scriptSegments.every((segment) => segment.status === "generated")) {
        setProgress(90);
      }
    }, 2000);
  };

  // Handle playing audio for a script segment
  const handlePlayAudio = (audioUrl: string) => {
    const segment = scriptSegments.find((s) => s.audio === audioUrl);
    if (segment) {
      setSelectedSegment(segment);
    }
  };

  // Finalize the event
  const handleFinalizeEvent = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const result = await finalizeEvent(eventId.toString());

      if (result.success) {
        setProgress(100);
        toast({
          title: "Event finalized!",
          description:
            "Your event has been successfully finalized and is ready for presentation.",
        });

        // Redirect to dashboard or event view
        window.location.href = "/dashboard";
      } else {
        toast({
          title: "Error finalizing event",
          description: result.error || "Failed to finalize event.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error finalizing event:", error);
      toast({
        title: "Error",
        description: "Failed to finalize event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "event_details":
        return (
          <EventDetailsStep
            eventData={eventData}
            isLoading={isLoading}
            onEventDataCollected={handleEventDataCollected}
            onContinue={() => setCurrentStep("event_layout")}
          />
        );

      case "event_layout":
        return (
          <EventLayoutStep
            eventId={eventId}
            eventLayout={eventLayout}
            isGeneratingLayout={isGeneratingLayout}
            isGeneratingScript={isGeneratingScript}
            onGenerateLayout={generateLayout}
            onUpdateSegment={handleUpdateLayoutSegment}
            onAddSegment={handleAddLayoutSegment}
            onDeleteSegment={handleDeleteLayoutSegment}
            onGenerateScript={handleGenerateScript}
            onBack={() => setCurrentStep("event_details")}
          />
        );

      case "script_generation":
        return (
          <ScriptGenerationStep
            scriptSegments={scriptSegments}
            selectedSegment={selectedSegment}
            isGeneratingScript={isGeneratingScript}
            onUpdateSegment={handleUpdateScriptSegment}
            onGenerateAudio={handleGenerateAudio}
            onPlayAudio={handlePlayAudio}
            onGenerateScript={handleGenerateScript}
            onBack={() => setCurrentStep("event_layout")}
            onContinue={() => setCurrentStep("finalize")}
          />
        );

      case "finalize":
        return (
          <FinalizeEventStep
            eventData={eventData}
            eventLayout={eventLayout}
            scriptSegments={scriptSegments}
            isLoading={isLoading}
            onFinalizeEvent={handleFinalizeEvent}
            onBack={() => setCurrentStep("script_generation")}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between text-sm">
        <div
          className={`flex flex-col items-center ${
            currentStep === "event_details"
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "event_details"
                ? "bg-primary text-white"
                : progress >= 25
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <span>Details</span>
        </div>

        <div
          className={`flex flex-col items-center ${
            currentStep === "event_layout"
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "event_layout"
                ? "bg-primary text-white"
                : progress >= 50
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span>Layout</span>
        </div>

        <div
          className={`flex flex-col items-center ${
            currentStep === "script_generation"
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "script_generation"
                ? "bg-primary text-white"
                : progress >= 75
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
          <span>Script</span>
        </div>

        <div
          className={`flex flex-col items-center ${
            currentStep === "finalize"
              ? "text-primary font-medium"
              : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "finalize"
                ? "bg-primary text-white"
                : progress >= 90
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            4
          </div>
          <span>Finalize</span>
        </div>
      </div>

      {/* Current step content */}
      <div className="mt-8">{renderCurrentStep()}</div>
    </div>
  );
}
