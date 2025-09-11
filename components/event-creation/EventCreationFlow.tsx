"use client";
import { useState } from "react";
import {
  createEvent,
  updateEvent,
  generateEventLayout,
  generateScriptFromLayout,
  updateEventLayoutSegment,
  addLayoutSegment,
  deleteLayoutSegment,
  finalizeEvent,
} from "@/app/actions/event";
import { generateTTSForAllSegments } from "@/app/actions/event/tts-generation";
import { EventLayout, LayoutSegment } from "@/types/layout";
import { ScriptSegment } from "@/types/event";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  showToolProcessingToast,
  updateToolProcessingToast,
} from "@/lib/toast-utils";
import { EventDetailsStep } from "./steps/EventDetailsStep";
import { EventCreationForm } from "@/components/EventCreationForm";
import { EventLayoutStep } from "./steps/EventLayoutStep";
import { ScriptGenerationStep } from "./steps/ScriptGenerationStep";
import { FinalizeEventStep } from "./steps/FinalizeEventStep";

// Define the steps in the event creation flow
type FlowStep =
  | "event_details"
  | "event_layout"
  | "script_generation"
  | "finalize";

// Helper function to validate date string format (YYYY-MM-DD)
const isValidDateString = (dateString: string): boolean => {
  // Check if the string matches the YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  // Check if the date is valid
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

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
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
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

    console.log("Event data received:", data);

    // Store the data in state regardless of what happens next
    setEventData(data);
    setProgress(25);

    // Show navigation options instead of automatically creating/updating event
    setShowNavigationOptions(true);
  };

  // State to control navigation options visibility
  const [showNavigationOptions, setShowNavigationOptions] = useState(false);

  // Function to actually create or update the event when user chooses to proceed
  const handleCreateOrUpdateEvent = async () => {
    if (!eventData) {
      console.error("No event data available");
      return;
    }

    setShowNavigationOptions(false);

    // If we already have an eventId, we're updating an existing event
    if (eventId) {
      await updateExistingEvent();
    } else {
      // Only create a new event if we don't have an eventId yet
      await createNewEvent();
    }
  };

  // Update an existing event
  const updateExistingEvent = async () => {
    if (!eventId || !eventData) return;

    console.log("Updating existing event with ID:", eventId);

    // Create FormData object for the update
    const formData = new FormData();
    formData.append("eventId", eventId.toString());
    formData.append("eventName", eventData.eventName || "");
    formData.append("eventType", eventData.eventType || "");
    // Ensure we have a valid date format (YYYY-MM-DD)
    let eventDate = eventData.eventDate;

    // If no date is provided or it's in an invalid format, use today's date
    if (!eventDate || !isValidDateString(eventDate)) {
      eventDate = new Date().toISOString().split("T")[0];
      console.log("Using default date:", eventDate);
    }

    formData.append("eventDate", eventDate);

    if (eventData.eventLocation)
      formData.append("eventLocation", eventData.eventLocation);
    if (eventData.audienceSize)
      formData.append("expectedAttendees", eventData.audienceSize);
    if (eventData.eventDescription)
      formData.append("eventDescription", eventData.eventDescription);
    if (eventData.language) formData.append("language", eventData.language);

    // Voice settings
    if (eventData.voicePreference?.gender)
      formData.append("voiceGender", eventData.voicePreference.gender);
    if (eventData.voicePreference?.tone)
      formData.append("voiceType", eventData.voicePreference.tone);
    if (eventData.voicePreference?.accent)
      formData.append("accent", eventData.voicePreference.accent);
    if (eventData.voicePreference?.speed)
      formData.append(
        "speakingRate",
        eventData.voicePreference.speed === "fast"
          ? "80"
          : eventData.voicePreference.speed === "slow"
          ? "20"
          : "50"
      );
    if (eventData.voicePreference?.pitch)
      formData.append(
        "pitch",
        eventData.voicePreference.pitch === "high"
          ? "80"
          : eventData.voicePreference.pitch === "low"
          ? "20"
          : "50"
      );

    // Show processing toast
    showToolProcessingToast(
      "updateEvent",
      "Updating event details. This may take a moment..."
    );

    try {
      setIsLoading(true);
      // Use updateEvent instead of createEvent
      const result = await updateEvent(formData);

      if (result.success) {
        // Update toast with success
        updateToolProcessingToast(
          "updateEvent",
          true,
          "Your event details have been updated successfully."
        );
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "updateEvent",
          false,
          result.error || "There was a problem updating your event."
        );
      }
    } catch (error) {
      console.error("Error updating event:", error);

      // Update toast with error
      updateToolProcessingToast(
        "updateEvent",
        false,
        "Failed to update event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new event
  const createNewEvent = async () => {
    if (!eventData) return;

    console.log("Creating new event...");

    // Create FormData object for the server action
    const formData = new FormData();
    formData.append("eventName", eventData.eventName || "");
    formData.append("eventType", eventData.eventType || "");
    // Ensure we have a valid date format (YYYY-MM-DD)
    let eventDate = eventData.eventDate;

    // If no date is provided or it's in an invalid format, use today's date
    if (!eventDate || !isValidDateString(eventDate)) {
      eventDate = new Date().toISOString().split("T")[0];
      console.log("Using default date:", eventDate);
    }

    formData.append("eventDate", eventDate);

    if (eventData.eventLocation)
      formData.append("eventLocation", eventData.eventLocation);
    if (eventData.audienceSize)
      formData.append("expectedAttendees", eventData.audienceSize);
    if (eventData.eventDescription)
      formData.append("eventDescription", eventData.eventDescription);
    if (eventData.language) formData.append("language", eventData.language);

    // Voice settings
    if (eventData.voicePreference?.gender)
      formData.append("voiceGender", eventData.voicePreference.gender);
    if (eventData.voicePreference?.tone)
      formData.append("voiceType", eventData.voicePreference.tone);
    if (eventData.voicePreference?.accent)
      formData.append("accent", eventData.voicePreference.accent);
    if (eventData.voicePreference?.speed)
      formData.append(
        "speakingRate",
        eventData.voicePreference.speed === "fast"
          ? "80"
          : eventData.voicePreference.speed === "slow"
          ? "20"
          : "50"
      );
    if (eventData.voicePreference?.pitch)
      formData.append(
        "pitch",
        eventData.voicePreference.pitch === "high"
          ? "80"
          : eventData.voicePreference.pitch === "low"
          ? "20"
          : "50"
      );

    // Show processing toast
    showToolProcessingToast(
      "createEvent",
      "Creating new event. This may take a moment..."
    );

    try {
      setIsLoading(true);
      const result = await createEvent(formData);

      if (result.success && result.eventId) {
        // Store the event ID
        const newEventId = result.eventId;
        console.log("New event created with ID:", newEventId);

        // Update state
        setEventId(newEventId);

        // Update toast with success
        updateToolProcessingToast(
          "createEvent",
          true,
          "Event created successfully! You can now proceed to create a layout for your event."
        );
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "createEvent",
          false,
          result.error || "There was a problem creating your event."
        );
      }
    } catch (error) {
      console.error("Error creating event:", error);

      // Update toast with error
      updateToolProcessingToast(
        "createEvent",
        false,
        "Failed to create event. Please try again."
      );
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

    // Show processing toast
    showToolProcessingToast(
      "generateLayout",
      "Generating event layout based on your event details. This may take a moment..."
    );

    try {
      setIsGeneratingLayout(true);
      console.log("Calling generateEventLayout with ID:", id);
      const result = await generateEventLayout(id);
      console.log("Layout generation result:", result);

      if (result.success && result.layout) {
        setEventLayout(result.layout);
        setProgress(50);

        // Update toast with success
        updateToolProcessingToast(
          "generateLayout",
          true,
          "Layout generated successfully! Review and customize the layout for your event."
        );
      } else {
        console.error("Error in layout generation result:", result.error);

        // Update toast with error
        updateToolProcessingToast(
          "generateLayout",
          false,
          result.error || "Failed to generate event layout."
        );
      }
    } catch (error) {
      console.error("Error generating layout:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Update toast with error
      updateToolProcessingToast(
        "generateLayout",
        false,
        `Failed to generate layout: ${errorMessage}. Please try again.`
      );
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

    // Show processing toast
    showToolProcessingToast(
      "generateScript",
      "Generating script based on your event layout. This may take a moment..."
    );

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

        // Update toast with success
        updateToolProcessingToast(
          "generateScript",
          true,
          "Script generated successfully! Review and edit the script segments for your event."
        );
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "generateScript",
          false,
          result.error || "Failed to generate script from layout."
        );
      }
    } catch (error) {
      console.error("Error generating script:", error);

      // Update toast with error
      updateToolProcessingToast(
        "generateScript",
        false,
        "Failed to generate script. Please try again."
      );
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
                audio: `mock-audio-url-${segmentId}.mp3`, // For backward compatibility
                audio_url: `audio/event-${eventId}/segment-${segmentId}.mp3`, // Store the S3 key for future use
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

  // Generate TTS for all script segments
  const handleGenerateAllTTS = async () => {
    if (!eventId) return;

    // Show processing toast
    showToolProcessingToast(
      "generateAllTTS",
      "Generating audio for all script segments. This may take a moment..."
    );

    try {
      setIsGeneratingTTS(true);
      const result = await generateTTSForAllSegments(eventId.toString());

      if (result.success) {
        // Update script segments with audio URLs
        if (result.results) {
          const updatedSegments = scriptSegments.map((segment) => {
            const updatedResult = result.results?.find(
              (r: any) => r.segmentId === segment.id
            );
            if (updatedResult && updatedResult.success) {
              return {
                ...segment,
                audio: updatedResult.audioUrl, // For backward compatibility
                audio_url: updatedResult.s3Key, // Store the S3 key for future use
                status: "generated" as const,
              };
            }
            return segment;
          });

          setScriptSegments(updatedSegments);
        }

        // Update toast with success
        updateToolProcessingToast(
          "generateAllTTS",
          true,
          `Generated audio for ${
            result.processedCount || "all"
          } script segments.`
        );
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "generateAllTTS",
          false,
          result.error || "Failed to generate audio for script segments."
        );
      }
    } catch (error) {
      console.error("Error generating TTS:", error);

      // Update toast with error
      updateToolProcessingToast(
        "generateAllTTS",
        false,
        "Failed to generate audio. Please try again."
      );
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // Finalize event without generating TTS
  const handleFinalizeWithoutTTS = async () => {
    if (!eventId) return;

    // Show processing toast
    showToolProcessingToast(
      "finalizeWithoutTTS",
      "Finalizing event without TTS generation. This may take a moment..."
    );

    try {
      setIsLoading(true);
      const result = await finalizeEvent(eventId.toString(), { skipTTS: true });

      if (result.success) {
        setProgress(100);

        // Update toast with success
        updateToolProcessingToast(
          "finalizeWithoutTTS",
          true,
          "Your event has been successfully finalized without TTS generation."
        );

        // Redirect to the event page after a short delay to allow the toast to be seen
        setTimeout(() => {
          window.location.href = `/event/${eventId}`;
        }, 1500);
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "finalizeWithoutTTS",
          false,
          result.error || "Failed to finalize event."
        );
      }
    } catch (error) {
      console.error("Error finalizing event:", error);

      // Update toast with error
      updateToolProcessingToast(
        "finalizeWithoutTTS",
        false,
        "Failed to finalize event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize the event with TTS
  const handleFinalizeEvent = async () => {
    if (!eventId) return;

    // Show processing toast
    showToolProcessingToast(
      "finalizeEvent",
      "Finalizing event with TTS generation. This may take a moment..."
    );

    try {
      setIsLoading(true);
      const result = await finalizeEvent(eventId.toString());

      if (result.success) {
        setProgress(100);

        // Update toast with success
        updateToolProcessingToast(
          "finalizeEvent",
          true,
          "Your event has been successfully finalized and is ready for presentation."
        );

        // Redirect to the event page after a short delay to allow the toast to be seen
        setTimeout(() => {
          window.location.href = `/event/${eventId}`;
        }, 1500);
      } else {
        // Update toast with error
        updateToolProcessingToast(
          "finalizeEvent",
          false,
          result.error || "Failed to finalize event."
        );
      }
    } catch (error) {
      console.error("Error finalizing event:", error);

      // Update toast with error
      updateToolProcessingToast(
        "finalizeEvent",
        false,
        "Failed to finalize event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to navigate to any step
  const navigateToStep = (step: FlowStep) => {
    setCurrentStep(step);

    // If navigating back to event details, set edit mode
    if (step === "event_details" && eventId) {
      // We're going back to edit an existing event
      console.log("Navigating back to edit event details");

      // Reset any state in the EventDetailsStep component
      // This will be handled by the component itself
    }
  };

  // Navigation options are directly rendered in the JSX below

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "event_details":
        return (
          <>
            {/* Original EventDetailsStep */}
            {false && (
              <EventDetailsStep
                eventId={eventId}
                eventData={eventData}
                isLoading={isLoading}
                onEventDataCollected={handleEventDataCollected}
                onContinue={() => {
                  handleCreateOrUpdateEvent();
                  navigateToStep("event_layout");
                }}
                isEditMode={!!eventId} // Set edit mode if we have an eventId (coming back from layout)
              />
            )}

            {/* New EventCreationForm */}
            <EventCreationForm />
          </>
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
            onBack={() => navigateToStep("event_details")}
            onGoToDetails={() => navigateToStep("event_details")}
          />
        );

      case "script_generation":
        return (
          <ScriptGenerationStep
            eventId={eventId}
            scriptSegments={scriptSegments}
            selectedSegment={selectedSegment}
            isGeneratingScript={isGeneratingScript}
            onUpdateSegment={handleUpdateScriptSegment}
            onGenerateAudio={handleGenerateAudio}
            onPlayAudio={handlePlayAudio}
            onGenerateScript={handleGenerateScript}
            onBack={() => navigateToStep("event_layout")}
            onGoToDetails={() => navigateToStep("event_details")}
            onContinue={() => navigateToStep("finalize")}
          />
        );

      case "finalize":
        return (
          <FinalizeEventStep
            eventId={eventId}
            eventData={eventData}
            eventLayout={eventLayout}
            scriptSegments={scriptSegments}
            isLoading={isLoading}
            isGeneratingTTS={isGeneratingTTS}
            onFinalizeEvent={handleFinalizeEvent}
            onFinalizeWithoutTTS={handleFinalizeWithoutTTS}
            onGenerateAllTTS={handleGenerateAllTTS}
            onBack={() => navigateToStep("script_generation")}
            onGoToDetails={() => navigateToStep("event_details")}
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
        <button
          onClick={() => eventId && navigateToStep("event_details")}
          className={`flex flex-col items-center ${
            currentStep === "event_details"
              ? "text-primary font-medium"
              : eventId
              ? "text-muted-foreground hover:text-primary cursor-pointer"
              : "text-muted-foreground"
          }`}
          disabled={!eventId}
          title={
            eventId ? "Go back to event details" : "Complete this step first"
          }
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "event_details"
                ? "bg-primary text-white"
                : progress >= 25
                ? eventId
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <span>Details</span>
        </button>

        <button
          onClick={() => eventId && navigateToStep("event_layout")}
          className={`flex flex-col items-center ${
            currentStep === "event_layout"
              ? "text-primary font-medium"
              : eventId && progress >= 25
              ? "text-muted-foreground hover:text-primary cursor-pointer"
              : "text-muted-foreground"
          }`}
          disabled={!eventId || progress < 25}
          title={
            !eventId
              ? "Complete previous step first"
              : progress < 25
              ? "Complete previous step first"
              : "Go to layout step"
          }
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "event_layout"
                ? "bg-primary text-white"
                : progress >= 50
                ? eventId
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span>Layout</span>
        </button>

        <button
          onClick={() =>
            eventId && progress >= 50 && navigateToStep("script_generation")
          }
          className={`flex flex-col items-center ${
            currentStep === "script_generation"
              ? "text-primary font-medium"
              : eventId && progress >= 50
              ? "text-muted-foreground hover:text-primary cursor-pointer"
              : "text-muted-foreground"
          }`}
          disabled={!eventId || progress < 50}
          title={
            !eventId
              ? "Complete previous steps first"
              : progress < 50
              ? "Complete previous steps first"
              : "Go to script step"
          }
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "script_generation"
                ? "bg-primary text-white"
                : progress >= 75
                ? eventId
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
          <span>Script</span>
        </button>

        <button
          onClick={() =>
            eventId && progress >= 75 && navigateToStep("finalize")
          }
          className={`flex flex-col items-center ${
            currentStep === "finalize"
              ? "text-primary font-medium"
              : eventId && progress >= 75
              ? "text-muted-foreground hover:text-primary cursor-pointer"
              : "text-muted-foreground"
          }`}
          disabled={!eventId || progress < 75}
          title={
            !eventId
              ? "Complete previous steps first"
              : progress < 75
              ? "Complete previous steps first"
              : "Go to finalize step"
          }
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              currentStep === "finalize"
                ? "bg-primary text-white"
                : progress >= 90
                ? eventId
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            4
          </div>
          <span>Finalize</span>
        </button>
      </div>

      {/* Current step content */}
      <div className="mt-8">{renderCurrentStep()}</div>

      {/* Navigation options dialog */}
      {showNavigationOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Event Details Collected
            </h3>
            <p className="mb-6 text-muted-foreground">
              Your event details have been collected. What would you like to do
              next?
            </p>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => {
                  handleCreateOrUpdateEvent();
                  setShowNavigationOptions(false);
                }}
                className="w-full"
              >
                Save Event Details
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  handleCreateOrUpdateEvent();
                  setShowNavigationOptions(false);
                  navigateToStep("event_layout");
                }}
                className="w-full"
              >
                Save and Go to Layout
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setShowNavigationOptions(false);
                }}
                className="w-full"
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
