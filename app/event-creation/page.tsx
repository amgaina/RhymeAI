"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic2, Upload, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import Link from "next/link";

// Import custom hooks
import { useEventCreation } from "@/hooks/useEventCreation";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

// Import custom components
import EventSidebar from "@/components/event-creation/EventSidebar";
import EventCreationForm from "@/components/event-creation/EventCreationForm";
import FileUpload from "@/components/event-creation/FileUpload";
import ScriptDisplay from "@/components/event-creation/ScriptDisplay";
import Header from "@/components/event-creation/Header";

export default function EventCreation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("chat");

  // Use custom hooks
  const {
    eventInfo,
    setEventInfo,
    progress,
    setProgress,
    formData,
    handleFormChange,
    handleFormSubmit,
    scriptSegments,
    setScriptSegments,
    selectedSegment,
    setSelectedSegment,
    isGeneratingScript,
    collectedEventData,
    uploadedFile,
    handleFileUpload,
    handleEventDataCollected,
    handleUpdateSegment,
  } = useEventCreation();

  const {
    availableVoices,
    selectedVoice,
    isPlaying,
    ttsSupported,
    speakText,
    stopSpeaking,
    changeVoice,
    handleGenerateAudio,
  } = useSpeechSynthesis();

  // Function to finalize event and redirect to dashboard
  const finalizeEvent = () => {
    // Prepare event data for saving
    const eventData = {
      id: Date.now().toString(),
      name: eventInfo.name || formData.eventName,
      type: eventInfo.type || formData.eventType,
      date: eventInfo.date || formData.eventDate,
      location: eventInfo.location || formData.eventLocation,
      description: formData.eventDescription,
      voiceSettings: {
        type: formData.voiceType,
        language: formData.language,
      },
      scriptSegments: scriptSegments,
      createdAt: new Date().toISOString(),
      status: "ready",
    };

    // In a real implementation, this would save to an API
    console.log("Saving event data:", eventData);

    // For now, let's store in localStorage for demo purposes
    if (typeof window !== "undefined") {
      const existingEvents = JSON.parse(
        localStorage.getItem("rhymeai-events") || "[]"
      );
      localStorage.setItem(
        "rhymeai-events",
        JSON.stringify([...existingEvents, eventData])
      );
    }

    alert("Event finalized! Redirecting to dashboard...");
    // Redirect to the dashboard
    router.push("/dashboard");
  };

  // Update voice settings when form data changes
  const handleVoiceFormChange = (field: string, value: string) => {
    handleFormChange(field, value);

    // If the voice type changes, update the selected voice
    if (field === "voiceType" && availableVoices.length > 0) {
      changeVoice(value);
    }

    // Update event info for voice and language settings
    if (field === "voiceType" || field === "language") {
      setEventInfo((prev) => ({
        ...prev,
        hasVoiceSettings:
          !!value || field !== "voiceType" ? prev.hasVoiceSettings : true,
        hasLanguageSettings:
          !!value || field !== "language" ? prev.hasLanguageSettings : true,
      }));
    }
  };

  // Test the selected voice
  const testVoice = () => {
    speakText(
      "This is a sample of how your AI host voice will sound during the event."
    );
  };

  // Handle generating audio for a segment
  const onGenerateAudio = (segmentId: number) => {
    handleGenerateAudio(
      scriptSegments,
      setScriptSegments,
      segmentId,
      setProgress
    );
  };

  // Handle playing audio for a script segment
  const handlePlayAudio = (audioUrl: string) => {
    const segment = scriptSegments.find((s) => s.audio === audioUrl);
    if (segment) {
      setSelectedSegment(segment);

      // If it's a mock URL, use TTS to play the content
      if (audioUrl.startsWith("mock-audio-url")) {
        speakText(segment.content);
      }
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-6">
        <Link
          href="/dashboard"
          className="text-primary-foreground/70 hover:text-primary-foreground inline-flex items-center mb-6 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar for event creation mode */}
          <div className="w-full lg:w-80 animate-slide-up">
            <EventSidebar
              eventInfo={eventInfo}
              progress={progress}
              scriptSegments={scriptSegments}
              formData={{
                voiceType: formData.voiceType,
                language: formData.language,
              }}
              onFinalizeEvent={finalizeEvent}
            />
          </div>

          {/* Main content */}
          <div
            className="flex-1 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Card className="rhyme-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Create Your Event</CardTitle>
                <CardDescription>
                  Let's create an AI host for your event - provide details
                  through chat, upload a file, or fill out a form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-3 mb-6 bg-primary/5">
                    <TabsTrigger
                      value="chat"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <Mic2 className="h-4 w-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="form"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Form</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Chat Tab Content */}
                  <TabsContent
                    value="chat"
                    className="focus-visible:outline-none"
                  >
                    <div className="grid grid-cols-1 gap-6">
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
                          purpose:
                            "To create a customized AI host script for an event",
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
                        onEventDataCollected={handleEventDataCollected}
                      />

                      <ScriptDisplay
                        scriptSegments={scriptSegments}
                        selectedSegment={selectedSegment}
                        isGeneratingScript={isGeneratingScript}
                        collectedEventData={collectedEventData}
                        isPlaying={isPlaying}
                        onUpdateSegment={handleUpdateSegment}
                        onGenerateAudio={onGenerateAudio}
                        onPlayAudio={handlePlayAudio}
                        onSpeakText={speakText}
                        onStopSpeaking={stopSpeaking}
                        onFinalizeEvent={finalizeEvent}
                        progress={progress}
                      />
                    </div>
                  </TabsContent>

                  {/* Upload Tab Content */}
                  <TabsContent
                    value="upload"
                    className="focus-visible:outline-none"
                  >
                    <FileUpload
                      uploadedFile={uploadedFile}
                      onFileUpload={handleFileUpload}
                      onContinue={() => setActiveTab("chat")}
                    />
                  </TabsContent>

                  {/* Form Tab Content */}
                  <TabsContent
                    value="form"
                    className="focus-visible:outline-none"
                  >
                    <EventCreationForm
                      formData={formData}
                      availableVoices={availableVoices}
                      isPlaying={isPlaying}
                      onFormChange={handleVoiceFormChange}
                      onFormSubmit={handleFormSubmit}
                      onTestVoice={testVoice}
                      onStopVoice={stopSpeaking}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
