"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic2, Upload, FileText, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Import custom hooks
import useEventCreation from "@/hooks/useEventCreation";
import useTextToSpeech from "@/hooks/useTextToSpeech";

// Import components
import EventCreationSidebar from "@/components/event-creation/EventCreationSidebar";
import EventCreationForm from "@/components/event-creation/EventCreationForm";
import ScriptGeneration from "@/components/event-creation/ScriptGeneration";
import FileUpload from "@/components/event-creation/FileUpload";

export default function EventCreation() {
  // Use custom hooks
  const {
    eventInfo,
    setEventInfo,
    scriptSegments,
    setScriptSegments,
    selectedSegment,
    setSelectedSegment,
    progress,
    setProgress,
    formData,
    isGeneratingScript,
    collectedEventData,
    handleFormChange,
    generateMockSegments,
    handleEventDataCollected,
    handleUpdateSegment,
    submitFinalEvent,
  } = useEventCreation();

  const { speakText, stopSpeaking, isPlaying } = useTextToSpeech();

  // Local state
  const [activeTab, setActiveTab] = useState("chat");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update event info
    setEventInfo((prev) => ({
      ...prev,
      name: formData.eventName,
      type: formData.eventType,
      date: formData.eventDate,
      location: formData.eventLocation,
      hasStructure: true,
      hasVoiceSettings: !!formData.voiceType,
      hasLanguageSettings: !!formData.language,
    }));

    // Update progress
    setProgress((prev) => Math.min(prev + 40, 100));

    // Switch to chat tab
    setActiveTab("chat");

    // Generate mock script segments
    generateMockSegments();
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Update event structure status
      setEventInfo((prev) => ({
        ...prev,
        hasStructure: true,
      }));
      setProgress((prev) => Math.min(prev + 20, 100));

      // Simulate extracting event info from file
      setTimeout(() => {
        setEventInfo((prev) => ({
          ...prev,
          name: file.name.replace(/\.(pdf|docx|txt|md)$/, ""),
          type: "Conference",
          date: "2025-05-15",
        }));

        // Generate mock script segments
        generateMockSegments();
      }, 500);
    }
  };

  // Handle generating audio for a script segment
  const handleGenerateAudio = (segmentId: number) => {
    // Set status to generating
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" }
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
                status: "generated",
                audio: `mock-audio-url-${segmentId}.mp3`,
              }
            : s
        )
      );

      // If all segments have audio, increase progress
      if (scriptSegments.every((segment) => segment.status === "generated")) {
        setProgress((prev) => Math.min(prev + 15, 100));
      }
    }, 2000);
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
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic2 className="h-6 w-6 text-terracotta" />
            <span className="text-xl font-bold">RhymeAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-accent flex items-center gap-2"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

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
          <EventCreationSidebar
            eventInfo={eventInfo}
            progress={progress}
            scriptSegments={scriptSegments}
            formData={formData}
            onFinalize={submitFinalEvent}
          />

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
                    <ScriptGeneration
                      isGeneratingScript={isGeneratingScript}
                      scriptSegments={scriptSegments}
                      selectedSegment={selectedSegment}
                      collectedEventData={collectedEventData}
                      progress={progress}
                      onUpdateSegment={handleUpdateSegment}
                      onGenerateAudio={handleGenerateAudio}
                      onPlayAudio={handlePlayAudio}
                      onEventDataCollected={handleEventDataCollected}
                      onFinalize={submitFinalEvent}
                    />
                  </TabsContent>

                  {/* Upload Tab Content */}
                  <TabsContent
                    value="upload"
                    className="focus-visible:outline-none"
                  >
                    <FileUpload
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
                      onChange={handleFormChange}
                      onSubmit={handleFormSubmit}
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
