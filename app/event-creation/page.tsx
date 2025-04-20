"use client";
import { useState, useEffect } from "react";
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

// Define ScriptSegment interface if not imported
interface ScriptSegment {
  id: number;
  type: string;
  content: string;
  audio: string | null;
  status: "draft" | "editing" | "generated" | "generating";
}

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

  // Test the selected voice
  const testVoice = () => {
    speakText(
      "This is a sample of how your AI host voice will sound during the event."
    );
  };

  // Handle generating audio for a segment
  const onGenerateAudio = (segmentId: number) => {
    handleGenerateAudio(segmentId);
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
              onFinalizeEvent={() => {}}
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
                        onPlayAudio={() => {}}
                        onSpeakText={speakText}
                        onStopSpeaking={stopSpeaking}
                        onFinalizeEvent={() => {}}
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
                      onFormChange={handleFormChange}
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
