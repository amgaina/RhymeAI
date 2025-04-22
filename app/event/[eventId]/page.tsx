"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PlusCircle, Mic2, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { EventData, getEvents } from "@/app/actions/event";
import { useParams, useRouter } from "next/navigation";
import { ScriptSegment } from "@/types/event";

// Import our modular components
import { EventHeader } from "@/components/dashboard/EventHeader";
import EventOverview from "@/components/dashboard/EventOverview";
import ScriptManager from "@/components/dashboard/ScriptManager";
import PresentationManager from "@/components/dashboard/PresentationManager";
import EventDashboard from "@/components/dashboard/EventDashboard";
import DeviceManager from "@/components/dashboard/DeviceManager";
import EventSettings from "@/components/dashboard/EventSettings";
import EnhancedAudioPlayer from "@/components/dashboard/EnhancedAudioPlayer";
import { useDevices } from "@/hooks/useDevices";
import { RhymeAIChat } from "@/components/RhymeAIChat";

export default function EventDetailPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const {
    recordingDevices,
    streamDestinations,
    toggleDeviceStreaming,
    toggleStreamDestination,
  } = useDevices();

  const [event, setEvent] = useState<EventData | null>(null);
  const [isEventRunning, setIsEventRunning] = useState(false);
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
  const [isLoading, setIsLoading] = useState(true);

  // Load specific event data
  useEffect(() => {
    async function loadEventData() {
      try {
        setIsLoading(true);
        const result = await getEvents();

        if (result.success && result.events) {
          // Transform the events as before
          const clientEvents: EventData[] = result.events.map((event) => ({
            id: String(event.event_id),
            name: event.title,
            type: event.event_type,
            date: event.event_date.toISOString().split("T")[0],
            location: event.location,
            description: event.description,
            voiceSettings: event.voice_settings as {
              type: string;
              language: string;
            },
            scriptSegments: event.segments.map((segment) => ({
              id: segment.id,
              type: segment.segment_type,
              content: segment.content,
              status: segment.status as
                | "draft"
                | "editing"
                | "generating"
                | "generated",
              timing: segment.timing || 0,
              order: segment.order,
              audio: segment.audio_url,
              presentationSlide: null,
            })),
            createdAt: event.created_at.toISOString(),
            status: event.status,
            hasPresentation: event.has_presentation,
            playCount: event.play_count,
          }));

          // Find the specific event
          const foundEvent = clientEvents.find((e) => e.id === eventId);
          if (foundEvent) {
            setEvent(foundEvent);
            calculateTotalDuration(foundEvent.scriptSegments);
          } else {
            toast({
              title: "Event not found",
              description: "The requested event could not be found",
              variant: "destructive",
            });
            router.push("/dashboard");
          }
        } else {
          console.error("Failed to load events:", result.error);
          toast({
            title: "Error loading event",
            description: result.error || "Could not load event details",
            variant: "destructive",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error loading event:", error);
        toast({
          title: "Error loading event",
          description: "There was a problem connecting to the server",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadEventData();
  }, [eventId, router, toast]);

  // Calculate total duration of script segments
  const calculateTotalDuration = (segments: ScriptSegment[] = []) => {
    if (!segments || !Array.isArray(segments)) {
      setTotalDuration(0);
      return;
    }

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
          if (event) {
            let timeSum = 0;
            for (let i = 0; i < event.scriptSegments.length; i++) {
              timeSum += event.scriptSegments[i].timing || 0;

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

  // Handle script segment updates
  const handleUpdateSegment = (segmentId: number, content: string) => {
    if (!event) return;

    setEvent({
      ...event,
      scriptSegments: event.scriptSegments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, content, status: "editing" }
          : segment
      ),
    });
  };

  // Handle audio generation
  const handleGenerateAudio = (segmentId: number) => {
    if (!event) return;

    // Set status to generating
    setEvent({
      ...event,
      scriptSegments: event.scriptSegments.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" }
          : segment
      ),
    });

    // Simulate audio generation with timeout
    setTimeout(() => {
      setEvent({
        ...event,
        scriptSegments: event.scriptSegments.map((segment) =>
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
    if (!event) return;

    // Simulate slide generation
    setTimeout(() => {
      setEvent(event);
    }, 2000);
  };

  // Handle seek to a specific segment
  const handleSeekToSegment = (segmentIndex: number) => {
    if (!event) return;

    setCurrentSegmentIndex(segmentIndex);

    // Calculate time elapsed until the beginning of this segment
    let timeSum = 0;
    for (let i = 0; i < segmentIndex; i++) {
      timeSum += event.scriptSegments[i]?.timing || 0;
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
    if (event && currentSegmentIndex < event.scriptSegments.length - 1) {
      handleSeekToSegment(currentSegmentIndex + 1);
    }
  };

  // Handle save settings
  const handleSaveSettings = (updatedEvent: EventData) => {
    setEvent(updatedEvent);
    // Here you would typically save to the server as well
  };

  // Handle add segment
  const handleAddSegment = () => {
    if (!event) return;

    const newSegment: ScriptSegment = {
      id: Date.now(), // Use timestamp as ID
      type: "segment",
      content: "New segment content...",
      status: "draft",
      timing: 30, // Default 30 seconds
      order: event.scriptSegments.length + 1,
      audio: null,
      presentationSlide: null,
    };

    setEvent({
      ...event,
      scriptSegments: [...event.scriptSegments, newSegment],
    });
  };

  // Handle delete segment
  const handleDeleteSegment = (segmentId: number) => {
    if (!event) return;

    setEvent({
      ...event,
      scriptSegments: event.scriptSegments.filter(
        (segment) => segment.id !== segmentId
      ),
    });
  };

  // Handle regenerate all audio
  const handleRegenerateAll = () => {
    if (!event) return;

    // First mark all as generating
    setEvent({
      ...event,
      scriptSegments: event.scriptSegments.map((segment) => ({
        ...segment,
        status: "generating",
      })),
    });

    // Then simulate generation with delay
    setTimeout(() => {
      setEvent({
        ...event,
        scriptSegments: event.scriptSegments.map((segment, index) => ({
          ...segment,
          status: "generated",
          audio: `mock-audio-url-${index + 1}.mp3`,
        })),
      });
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-3 text-primary-foreground">Loading event...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-primary-foreground mb-4">
          Event not found
        </h1>
        <Link href="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <EventHeader
            eventName={event.name}
            eventDate={event.date}
            eventType={event.type}
            isRunning={isEventRunning}
            isReady={event.status === "ready"}
            onBack={() => router.push("/dashboard")}
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
                event={event}
                totalDuration={totalDuration}
                onNavigateToTab={setActiveTab}
                onPlayAudio={(audioUrl) => {
                  const segment = event.scriptSegments.find(
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
                  segments={event.scriptSegments || []}
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
                segments={event.scriptSegments}
                onGenerateSlides={handleGenerateSlides}
                onUpdateSlide={(segmentId, slidePath) => {
                  console.log("Update slide for segment", segmentId, slidePath);
                }}
                onPreviewSlide={(slidePath) => {
                  console.log("Preview slide", slidePath);
                }}
              />
            </TabsContent>

            {/* Event Dashboard Tab */}
            <TabsContent value="event" className="space-y-4">
              {/* Event Control Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EventDashboard
                  segments={event.scriptSegments}
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
                event={event}
                onSaveSettings={handleSaveSettings}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Assistant */}
        <div className="grid grid-cols-1 gap-6 stagger-animation">
          <Card
            className="animate-slide-up rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <RhymeAIChat
              title="Event Assistant"
              initialMessage={`How can I help with '${event.name}'? Ask me about managing voices, event settings, or generating content.`}
              placeholder="Ask about this event..."
              className="border-0 shadow-none"
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
