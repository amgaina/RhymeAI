"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Calendar,
  Settings,
  Mic2,
  Clock,
  FileText,
} from "lucide-react";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our new modular components
import EventList, { EventItem } from "@/components/dashboard/EventList";
import { EventHeader } from "@/components/dashboard/EventHeader";
import EventOverview from "@/components/dashboard/EventOverview";
import ScriptManager, {
  ScriptSegment,
} from "@/components/dashboard/ScriptManager";
import PresentationManager from "@/components/dashboard/PresentationManager";
import EventDashboard from "@/components/dashboard/EventDashboard";
import DeviceManager from "@/components/dashboard/DeviceManager";
import EventSettings from "@/components/dashboard/EventSettings";
import EnhancedAudioPlayer from "@/components/dashboard/EnhancedAudioPlayer";

interface EventData {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  description: string;
  voiceSettings: {
    type: string;
    language: string;
  };
  scriptSegments: ScriptSegment[];
  createdAt: string;
  status: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEventRunning, setIsEventRunning] = useState(false);
  const [recordingDevices, setRecordingDevices] = useState([
    {
      id: "camera1",
      name: "Main Camera",
      type: "video" as const,
      connected: true,
      streaming: false,
    },
    {
      id: "mic1",
      name: "Room Microphone",
      type: "audio" as const,
      connected: true,
      streaming: false,
    },
    {
      id: "speaker1",
      name: "Main Speakers",
      type: "output" as const,
      connected: true,
      streaming: false,
    },
    {
      id: "screen1",
      name: "Presentation Screen",
      type: "display" as const,
      connected: true,
      streaming: false,
    },
  ]);
  const [streamDestinations, setStreamDestinations] = useState([
    { id: "youtube", name: "YouTube", connected: false },
    { id: "facebook", name: "Facebook", connected: false },
    { id: "zoom", name: "Zoom Meeting", connected: true },
    { id: "custom", name: "Custom RTMP", connected: false },
  ]);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAudioPreview, setSelectedAudioPreview] = useState<{
    audioUrl: string;
    title: string;
    scriptText: string;
  } | null>(null);

  // Load events from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEvents = JSON.parse(
        localStorage.getItem("rhymeai-events") || "[]"
      );
      setEvents([
        ...savedEvents,
        {
          id: "1",
          name: "Tech Conference 2025",
          date: "June 15-17, 2025",
          type: "Conference",
          location: "San Francisco, CA",
          description:
            "Annual technology conference featuring the latest innovations",
          voiceSettings: {
            type: "Professional",
            language: "English",
          },
          scriptSegments: [
            {
              id: 1,
              type: "introduction",
              content:
                "Welcome to Tech Conference 2025! I'm your AI host, and I'm excited to guide you through this amazing event.",
              audio: "mock-audio-url-1.mp3",
              status: "generated",
              timing: 45,
              presentationSlide: "slide-intro.jpg",
            },
            {
              id: 2,
              type: "agenda",
              content:
                "Let me walk you through today's agenda. We'll start with our keynote presentation, followed by breakout sessions.",
              audio: "mock-audio-url-2.mp3",
              status: "generated",
              timing: 30,
              presentationSlide: "slide-agenda.jpg",
            },
            {
              id: 3,
              type: "speaker introduction",
              content:
                "Please welcome our keynote speaker, Dr. Jane Smith, CTO of Tech Innovations.",
              audio: "mock-audio-url-3.mp3",
              status: "generated",
              timing: 20,
              presentationSlide: "slide-speaker.jpg",
            },
          ],
          createdAt: "2025-03-15T10:00:00Z",
          status: "ready",
        },
        {
          id: "2",
          name: "Product Launch Webinar",
          date: "May 5, 2025",
          type: "Webinar",
          location: "Virtual",
          description: "Launching our new product line to the market",
          voiceSettings: {
            type: "Energetic",
            language: "English",
          },
          scriptSegments: [],
          createdAt: "2025-04-01T14:30:00Z",
          status: "draft",
        },
      ]);
    }
  }, []);

  // Set the first event as selected by default
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0]);
      calculateTotalDuration(events[0].scriptSegments);
    }
  }, [events]);

  // Calculate total duration of script segments
  const calculateTotalDuration = (segments: ScriptSegment[]) => {
    const total = segments.reduce(
      (sum, segment) => sum + (segment.timing || 0),
      0
    );
    setTotalDuration(total);
  };

  // Toggle event running state
  const toggleEventRunning = () => {
    if (isEventRunning) {
      // Stop the event
      setIsEventRunning(false);
      setTimeElapsed(0);
      setCurrentSegmentIndex(0);
    } else {
      // Start the event
      setIsEventRunning(true);

      // Create interval to increment time elapsed and manage current segment
      const interval = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;

          // Check if we need to move to the next segment
          if (selectedEvent) {
            let timeSum = 0;
            for (let i = 0; i < selectedEvent.scriptSegments.length; i++) {
              timeSum += selectedEvent.scriptSegments[i].timing || 0;

              if (newTime <= timeSum && i !== currentSegmentIndex) {
                setCurrentSegmentIndex(i);
                break;
              }
            }

            // Check if we've reached the end of the event
            if (newTime >= totalDuration) {
              clearInterval(interval);
              setIsEventRunning(false);
              return totalDuration;
            }
          }

          return newTime;
        });
      }, 1000);

      // Cleanup interval on stop
      return () => clearInterval(interval);
    }
  };

  // Toggle recording device streaming
  const toggleDeviceStreaming = (deviceId: string) => {
    setRecordingDevices((devices) =>
      devices.map((device) =>
        device.id === deviceId
          ? { ...device, streaming: !device.streaming }
          : device
      )
    );
  };

  // Toggle streaming platform connection
  const toggleStreamDestination = (destId: string) => {
    setStreamDestinations((destinations) =>
      destinations.map((dest) =>
        dest.id === destId ? { ...dest, connected: !dest.connected } : dest
      )
    );
  };

  // Handle script segment updates
  const handleUpdateSegment = (segmentId: number, content: string) => {
    if (!selectedEvent) return;

    setSelectedEvent({
      ...selectedEvent,
      scriptSegments: selectedEvent.scriptSegments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, content, status: "editing" }
          : segment
      ),
    });
  };

  // Handle audio generation
  const handleGenerateAudio = (segmentId: number) => {
    if (!selectedEvent) return;

    // Set status to generating
    setSelectedEvent({
      ...selectedEvent,
      scriptSegments: selectedEvent.scriptSegments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" }
          : segment
      ),
    });

    // Simulate audio generation with timeout
    setTimeout(() => {
      setSelectedEvent({
        ...selectedEvent,
        scriptSegments: selectedEvent.scriptSegments.map((segment) =>
          segment.id === segmentId
            ? {
              ...segment,
              status: "generated",
              audio: `mock-audio-url-${segmentId}.mp3`,
            }
            : segment
        ),
      });
    }, 2000);
  };

  // Handle playing audio for a script segment
  const handlePlayAudio = (
    audioUrl: string,
    title?: string,
    scriptText?: string
  ) => {
    setSelectedAudioPreview({
      audioUrl,
      title: title || "Audio Preview",
      scriptText: scriptText || "",
    });
  };

  // Handle slides generation
  const handleGenerateSlides = () => {
    if (!selectedEvent) return;

    // Simulate slide generation
    setTimeout(() => {
      setSelectedEvent({
        ...selectedEvent,
        scriptSegments: selectedEvent.scriptSegments.map((segment, index) => ({
          ...segment,
          presentationSlide:
            segment.presentationSlide || `slide-${index + 1}.jpg`,
        })),
      });
    }, 2000);
  };

  // Handle seek to a specific segment
  const handleSeekToSegment = (segmentIndex: number) => {
    if (!selectedEvent) return;

    setCurrentSegmentIndex(segmentIndex);

    // Calculate time elapsed until the beginning of this segment
    let timeSum = 0;
    for (let i = 0; i < segmentIndex; i++) {
      timeSum += selectedEvent.scriptSegments[i].timing || 0;
    }

    setTimeElapsed(timeSum);
  };

  // Handle previous segment
  const handlePrevSegment = () => {
    if (currentSegmentIndex > 0) {
      handleSeekToSegment(currentSegmentIndex - 1);
    }
  };

  // Handle next segment
  const handleNextSegment = () => {
    if (
      selectedEvent &&
      currentSegmentIndex < selectedEvent.scriptSegments.length - 1
    ) {
      handleSeekToSegment(currentSegmentIndex + 1);
    }
  };

  // Handle save settings
  const handleSaveSettings = (updatedEvent: EventData) => {
    setSelectedEvent(updatedEvent);

    // Update in the events list
    setEvents((prev) =>
      prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
  };

  // Handle add segment
  const handleAddSegment = () => {
    if (!selectedEvent) return;

    const newSegment: ScriptSegment = {
      id: Date.now(), // Use timestamp as ID
      type: "segment",
      content: "New segment content...",
      status: "draft",
      timing: 30, // Default 30 seconds
    };

    setSelectedEvent({
      ...selectedEvent,
      scriptSegments: [...selectedEvent.scriptSegments, newSegment],
    });
  };

  // Handle delete segment
  const handleDeleteSegment = (segmentId: number) => {
    if (!selectedEvent) return;

    setSelectedEvent({
      ...selectedEvent,
      scriptSegments: selectedEvent.scriptSegments.filter(
        (segment) => segment.id !== segmentId
      ),
    });
  };

  // Handle regenerate all audio
  const handleRegenerateAll = () => {
    if (!selectedEvent) return;

    // First mark all as generating
    setSelectedEvent({
      ...selectedEvent,
      scriptSegments: selectedEvent.scriptSegments.map((segment) => ({
        ...segment,
        status: "generating",
      })),
    });

    // Then simulate generation with delay
    setTimeout(() => {
      setSelectedEvent({
        ...selectedEvent,
        scriptSegments: selectedEvent.scriptSegments.map((segment, index) => ({
          ...segment,
          status: "generated",
          audio: `mock-audio-url-${index + 1}.mp3`,
        })),
      });
    }, 3000);
  };

  // Convert event data to event item format for EventList
  const eventItems: EventItem[] = events.map((event) => ({
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location,
    description: event.description,
    voiceSettings: event.voiceSettings,
    scriptSegmentsCount: event.scriptSegments.length,
    createdAt: event.createdAt,
    status: event.status,
    duration: event.scriptSegments.reduce(
      (sum, segment) => sum + (segment.timing || 0),
      0
    ),
  }));

  // Create new event link
  const createEventLink = "/create-event";

  return (
    <div className="min-h-screen bg-secondary">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold text-primary-foreground">
              Your Events
            </h1>
            <p className="text-primary-foreground/70">
              Manage your AI-powered event hosts
            </p>
          </div>
          <Link href={createEventLink}>
            <Button
              className="mt-4 md:mt-0 bg-cta hover:bg-cta/90 text-white btn-pulse animate-slide-up flex items-center gap-2"
              style={{ animationDelay: "0.2s" }}
            >
              <PlusCircle className="h-5 w-5" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 stagger-animation">
          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Total Events
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Active Voices
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.filter((e) => e.status === "ready").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Mic2 className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Script Segments
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.reduce(
                      (sum, event) => sum + event.scriptSegments.length,
                      0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.4s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Content Minutes
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {Math.round(totalDuration / 60)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Table or Selected Event Detail */}
        {!selectedEvent ? (
          <EventList
            events={eventItems}
            onSelectEvent={(eventId) => {
              const event = events.find((e) => e.id === eventId);
              if (event) {
                setSelectedEvent(event);
                calculateTotalDuration(event.scriptSegments);
              }
            }}
            createEventLink={createEventLink}
          />
        ) : (
          <div className="mb-8">
            <EventHeader
              eventName={selectedEvent.name}
              eventDate={selectedEvent.date}
              eventType={selectedEvent.type}
              isRunning={isEventRunning}
              isReady={selectedEvent.status === "ready"}
              onBack={() => setSelectedEvent(null)}
              onToggleRunning={toggleEventRunning}
              onEdit={() => setActiveTab("settings")}
            />

            {/* Event Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="bg-primary/5 p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="script"
                  className="data-[state=active]:bg-background"
                >
                  Script
                </TabsTrigger>
                <TabsTrigger
                  value="presentation"
                  className="data-[state=active]:bg-background"
                >
                  Presentation
                </TabsTrigger>
                <TabsTrigger
                  value="event"
                  className="data-[state=active]:bg-background"
                >
                  Event Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-background"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <EventOverview
                  event={selectedEvent}
                  totalDuration={totalDuration}
                  onNavigateToTab={setActiveTab}
                  onPlayAudio={(audioUrl) => {
                    const segment = selectedEvent.scriptSegments.find(
                      (s) => s.audio === audioUrl
                    );
                    if (segment) {
                      handlePlayAudio(
                        audioUrl,
                        `${segment.type} Preview`,
                        segment.content
                      );
                    }
                  }}
                />
              </TabsContent>

              {/* Script Tab */}
              <TabsContent value="script" className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  <ScriptManager
                    segments={selectedEvent.scriptSegments || []}
                    onUpdateSegment={handleUpdateSegment}
                    onGenerateAudio={handleGenerateAudio}
                    onDeleteSegment={handleDeleteSegment}
                    onAddSegment={handleAddSegment}
                    onRegenerateAll={handleRegenerateAll}
                  />

                  {/* Selected Audio Preview */}
                  {selectedAudioPreview && (
                    <EnhancedAudioPlayer
                      title={selectedAudioPreview.title}
                      scriptText={selectedAudioPreview.scriptText}
                      audioUrl={selectedAudioPreview.audioUrl}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Presentation Tab */}
              <TabsContent value="presentation" className="space-y-4">
                <PresentationManager
                  segments={selectedEvent.scriptSegments}
                  onGenerateSlides={handleGenerateSlides}
                  onUpdateSlide={(segmentId, slidePath) => {
                    // Implementation for updating slide
                    console.log(
                      "Update slide for segment",
                      segmentId,
                      slidePath
                    );
                  }}
                  onPreviewSlide={(slidePath) => {
                    // Implementation for previewing slide
                    console.log("Preview slide", slidePath);
                  }}
                />
              </TabsContent>

              {/* Event Dashboard Tab */}
              <TabsContent value="event" className="space-y-4">
                {/* Event Control Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <EventDashboard
                    segments={selectedEvent.scriptSegments}
                    isRunning={isEventRunning}
                    currentSegmentIndex={currentSegmentIndex}
                    timeElapsed={timeElapsed}
                    totalDuration={totalDuration}
                    onPlayPause={toggleEventRunning}
                    onPrevSegment={handlePrevSegment}
                    onNextSegment={handleNextSegment}
                    onSeekTo={handleSeekToSegment}
                  />

                  {/* Recording & Streaming */}
                  <DeviceManager
                    recordingDevices={recordingDevices}
                    streamDestinations={streamDestinations}
                    isEventRunning={isEventRunning}
                    onToggleDevice={toggleDeviceStreaming}
                    onToggleDestination={toggleStreamDestination}
                    onStartRecording={() => setIsRecording(!isRecording)}
                    onRefreshDevices={() => console.log("Refreshing devices")}
                    onAddDevice={() => console.log("Adding new device")}
                  />
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <EventSettings
                  event={selectedEvent}
                  onSaveSettings={handleSaveSettings}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* AI Assistant */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-animation">
          <Card
            className="md:col-span-3 animate-slide-up rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <RhymeAIChat
              title="Event Assistant"
              initialMessage="How can I help with your event planning today? Ask me about creating events, managing voices, or generating scripts."
              placeholder="Ask about event planning..."
              className="border-0 shadow-none"
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
