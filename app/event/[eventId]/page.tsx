"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PlusCircle, Mic2, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  EventData,
  getEventById,
  generateEventLayout,
} from "@/app/actions/event";
import { useParams, useRouter } from "next/navigation";
import { ScriptSegment } from "@/types/event";
import { EventLayout, LayoutSegment } from "@/types/layout";

// Import our modular components
import { EventHeader } from "@/components/dashboard/EventHeader";
import EventOverview from "@/components/dashboard/EventOverview";
import ScriptManager from "@/components/dashboard/ScriptManager";
import EnhancedScriptManager from "@/components/dashboard/EnhancedScriptManager";
import { generateEnhancedScriptFromLayout } from "@/app/actions/event/enhanced-script-generation";
import {
  generateTTSForAllSegments,
  generateTTSForSegment,
  deleteScriptSegmentAudio,
  deleteAllEventAudio,
} from "@/app/actions/event/tts-generation";
import PresentationManager from "@/components/dashboard/PresentationManager";
import EventDashboard from "@/components/dashboard/EventDashboard";
import DeviceManager from "@/components/dashboard/DeviceManager";
import EventSettings from "@/components/dashboard/EventSettings";
import LayoutManager from "@/components/dashboard/LayoutManager";
import SimpleAudioPlayer from "@/components/dashboard/SimpleAudioPlayer";
import { useDevices } from "@/hooks/useDevices";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import { RealtimeAnalysis } from "@/components/dashboard/RealtimeAnalysis";
import { PostEventReport } from "@/components/dashboard/PostEventReport";

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
  const [eventLayout, setEventLayout] = useState<EventLayout | null>(null);
  const [isEventRunning, setIsEventRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAudioPreview, setSelectedAudioPreview] = useState<{
    audioUrl: string;
    title: string;
    scriptText: string;
    segmentId?: number; // Add segmentId for presigned URL
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Only log when there's a valid segmentId
  if (selectedAudioPreview && selectedAudioPreview.segmentId) {
    console.log(
      "Playing audio for segment ID:",
      selectedAudioPreview.segmentId
    );
  }

  // Load specific event data
  useEffect(() => {
    async function loadEventData() {
      try {
        setIsLoading(true);
        console.log("Loading event with ID:", eventId);

        // Use the new getEventById function to fetch only the specific event
        const result = await getEventById(eventId as string);
        console.log("Event data loaded:", result);

        if (result.success && result.event) {
          console.log("Event loaded successfully:", result.event);

          // Set the event data directly
          setEvent(result.event);
          calculateTotalDuration(result.event.scriptSegments);

          // If layout data is available in the event, set it
          if (result.event.layout) {
            setEventLayout(result.event.layout);
          }
        } else {
          console.error("Failed to load event:", result.error);
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

    if (eventId) {
      loadEventData();
    }
  }, [eventId, router, toast]);

  // Cleanup interval when component unmounts
  useEffect(() => {
    // Cleanup function to clear the interval when component unmounts
    return () => {
      console.log("Component unmounting, cleaning up interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Calculate total duration of script segments
  const calculateTotalDuration = (segments: ScriptSegment[] = []) => {
    if (!segments || !Array.isArray(segments)) {
      setTotalDuration(0);
      return;
    }

    // Sort segments by order before calculating total duration
    const orderedSegments = getSortedSegments(segments);

    const total = orderedSegments.reduce(
      (sum, segment) => sum + (segment.timing || 0),
      0
    );
    setTotalDuration(total);
  };

  // Use a ref to track the current segment index to avoid unnecessary updates
  const lastSegmentIndexRef = useRef<number>(-1);

  // Create a utility function to sort segments by order
  const getSortedSegments = useCallback((segments: ScriptSegment[]) => {
    return [...segments].sort((a, b) => {
      // Ensure we have valid order values (default to 0 if not present)
      const orderA = typeof a.order === "number" ? a.order : 0;
      const orderB = typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  }, []);

  // Toggle event running state
  const toggleEventRunning = () => {
    if (isEventRunning) {
      // Stop the event
      setIsEventRunning(false);
      setTimeElapsed(0);
      setCurrentSegmentIndex(0);
      lastSegmentIndexRef.current = -1;

      // Clear the interval if it exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start the event
      setIsEventRunning(true);

      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Create interval to increment time elapsed and manage current segment
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;

          // Check if we need to move to the next segment
          if (event) {
            let timeSum = 0;
            let newSegmentIndex = 0;

            // Sort segments by order property
            const orderedSegments = getSortedSegments(event.scriptSegments);

            // Find the segment that corresponds to the current time
            for (let i = 0; i < orderedSegments.length; i++) {
              timeSum += orderedSegments[i].timing || 0;

              if (newTime <= timeSum) {
                // Find the original index of this segment in the unsorted array
                newSegmentIndex = event.scriptSegments.findIndex(
                  (s) => s.id === orderedSegments[i].id
                );
                break;
              }
            }

            // Only update the segment index if it has changed
            if (newSegmentIndex !== lastSegmentIndexRef.current) {
              lastSegmentIndexRef.current = newSegmentIndex;
              setCurrentSegmentIndex(newSegmentIndex);
            }

            // Check if we've reached the end of the event
            if (newTime >= totalDuration) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setIsEventRunning(false);
              return totalDuration;
            }
          }

          return newTime;
        });
      }, 1000);
    }
  };

  // Handle regenerating the event layout
  const handleRegenerateLayout = async () => {
    if (!event || !eventId) return;

    try {
      setIsGeneratingLayout(true);
      const result = await generateEventLayout(eventId as string);

      if (result.success && result.layout) {
        setEventLayout(result.layout);
        toast({
          title: "Layout generated",
          description: "Event layout has been successfully generated.",
        });
      } else {
        toast({
          title: "Error generating layout",
          description: result.error || "Failed to generate layout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating layout:", error);
      toast({
        title: "Error",
        description: "Failed to generate layout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  // Handle layout segment updates
  const handleUpdateLayoutSegment = async (segment: LayoutSegment) => {
    if (!eventLayout) return;

    try {
      // Call the server action to update the segment
      // For now, just update the local state
      const updatedSegments = eventLayout.segments.map((s) =>
        s.id === segment.id ? segment : s
      );

      setEventLayout({
        ...eventLayout,
        segments: updatedSegments,
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment updated",
        description: "Layout segment has been updated.",
      });
    } catch (error) {
      console.error("Error updating segment:", error);
      toast({
        title: "Error",
        description: "Failed to update segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new layout segment
  const handleAddLayoutSegment = async (segment: Omit<LayoutSegment, "id">) => {
    if (!eventLayout) return;

    try {
      // Create a temporary ID for optimistic UI updates
      const tempSegment = {
        ...segment,
        id: `temp-${Date.now()}`,
      };

      // Update the local state
      setEventLayout({
        ...eventLayout,
        segments: [...eventLayout.segments, tempSegment],
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment added",
        description: "New layout segment has been added.",
      });
    } catch (error) {
      console.error("Error adding segment:", error);
      toast({
        title: "Error",
        description: "Failed to add segment. Please try again.",
      });
    }
  };

  // Handle deleting a layout segment
  const handleDeleteLayoutSegment = async (segmentId: string) => {
    if (!eventLayout) return;

    try {
      // Update the local state
      setEventLayout({
        ...eventLayout,
        segments: eventLayout.segments.filter((s) => s.id !== segmentId),
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Segment deleted",
        description: "Layout segment has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting segment:", error);
      toast({
        title: "Error",
        description: "Failed to delete segment. Please try again.",
        variant: "destructive",
      });
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
  const handleGenerateAudio = async (segmentId: number) => {
    if (!event) return;

    try {
      // Set status to generating in the UI
      setEvent({
        ...event,
        scriptSegments: event.scriptSegments.map((segment) =>
          segment.id === segmentId
            ? { ...segment, status: "generating" }
            : segment
        ),
      });

      // Call the server action to generate TTS
      const result = await generateTTSForSegment(segmentId);

      if (result.success) {
        // Update the UI with the new audio key and presigned URL
        setEvent({
          ...event,
          scriptSegments: event.scriptSegments.map((segment) =>
            segment.id === segmentId
              ? {
                  ...segment,
                  status: "generated",
                  audio_url: result.s3Key || null, // Store the S3 key
                  audio: result.audioUrl || null, // Store the presigned URL for immediate use
                }
              : segment
          ),
        });

        console.log(
          `Audio key updated for segment ${segmentId}: ${result.s3Key}`
        );
        console.log(`Presigned URL for immediate use: ${result.audioUrl}`);

        toast({
          title: "Audio generated",
          description: "Audio has been generated successfully",
        });
      } else {
        // Update the UI to show failure
        setEvent({
          ...event,
          scriptSegments: event.scriptSegments.map((segment) =>
            segment.id === segmentId
              ? { ...segment, status: "failed" }
              : segment
          ),
        });

        toast({
          title: "Error",
          description: result.error || "Failed to generate audio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error generating audio for segment ${segmentId}:`, error);

      // Update the UI to show failure
      setEvent({
        ...event,
        scriptSegments: event.scriptSegments.map((segment) =>
          segment.id === segmentId ? { ...segment, status: "failed" } : segment
        ),
      });

      toast({
        title: "Error",
        description: "Failed to generate audio",
        variant: "destructive",
      });
    }
  };

  // Handle playing audio for a script segment
  const handlePlayAudio = async (
    audioUrl: string,
    title?: string,
    scriptText?: string
  ) => {
    if (!audioUrl) {
      toast({
        title: "No audio available",
        description: "This segment doesn't have audio generated yet.",
        variant: "destructive",
      });
      return;
    }

    // Find the segment ID for the audio URL
    const segment = event?.scriptSegments.find((s) => s.audio_url === audioUrl);

    if (!segment) {
      toast({
        title: "Segment not found",
        description: "Could not find the segment for this audio.",
        variant: "destructive",
      });
      return;
    }

    console.log(
      `Playing audio for segment ${segment.id} with audio_url: ${segment.audio_url}`
    );

    // Set the audio preview with the segment ID
    // The SimpleAudioPlayer will handle getting a presigned URL
    setSelectedAudioPreview({
      audioUrl: segment.audio_url || "",
      title: title || "Audio Preview",
      scriptText: scriptText || "",
      segmentId: segment.id,
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

    // Sort segments by order
    const orderedSegments = getSortedSegments(event.scriptSegments);

    // Find the index of the segment in the ordered array
    const orderedIndex = orderedSegments.findIndex(
      (segment) => segment.id === event.scriptSegments[segmentIndex]?.id
    );

    // Calculate time elapsed until the beginning of this segment
    let timeSum = 0;
    for (let i = 0; i < orderedIndex; i++) {
      timeSum += orderedSegments[i]?.timing || 0;
    }

    setTimeElapsed(timeSum);
  };

  // Handle previous segment
  const handlePrevSegment = () => {
    if (!event) return;

    // Sort segments by order
    const orderedSegments = getSortedSegments(event.scriptSegments);

    // Find the current segment in the ordered array
    const currentSegment = event.scriptSegments[currentSegmentIndex];
    const orderedIndex = orderedSegments.findIndex(
      (segment) => segment.id === currentSegment?.id
    );

    // If we found the segment and it's not the first one, go to the previous one
    if (orderedIndex > 0) {
      // Find the index of the previous segment in the original array
      const prevSegmentId = orderedSegments[orderedIndex - 1].id;
      const prevSegmentIndex = event.scriptSegments.findIndex(
        (segment) => segment.id === prevSegmentId
      );

      if (prevSegmentIndex >= 0) {
        handleSeekToSegment(prevSegmentIndex);
      }
    }
  };

  // Handle next segment
  const handleNextSegment = () => {
    if (!event) return;

    // Sort segments by order
    const orderedSegments = getSortedSegments(event.scriptSegments);

    // Find the current segment in the ordered array
    const currentSegment = event.scriptSegments[currentSegmentIndex];
    const orderedIndex = orderedSegments.findIndex(
      (segment) => segment.id === currentSegment?.id
    );

    // If we found the segment and it's not the last one, go to the next one
    if (orderedIndex >= 0 && orderedIndex < orderedSegments.length - 1) {
      // Find the index of the next segment in the original array
      const nextSegmentId = orderedSegments[orderedIndex + 1].id;
      const nextSegmentIndex = event.scriptSegments.findIndex(
        (segment) => segment.id === nextSegmentId
      );

      if (nextSegmentIndex >= 0) {
        handleSeekToSegment(nextSegmentIndex);
      }
    }
  };

  // Create a memoized version of the handleNextSegment function for use in callbacks
  const memoizedHandleNextSegment = useCallback(() => {
    handleNextSegment();
  }, [event, currentSegmentIndex]);

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
      audio_url: null,
      presentationSlide: null,
    };

    setEvent({
      ...event,
      scriptSegments: [...event.scriptSegments, newSegment],
    });
  };

  // Handle delete segment
  const handleDeleteSegment = async (segmentId: number) => {
    if (!event) return;

    try {
      // First delete the audio file if it exists
      const segment = event.scriptSegments.find((s) => s.id === segmentId);
      if (segment?.audio_url) {
        // Delete the audio file from S3
        await deleteScriptSegmentAudio(segmentId);
      }

      // Then update the UI
      setEvent({
        ...event,
        scriptSegments: event.scriptSegments.filter(
          (segment) => segment.id !== segmentId
        ),
      });

      toast({
        title: "Segment deleted",
        description: "Script segment has been deleted",
      });
    } catch (error) {
      console.error(`Error deleting segment ${segmentId}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete segment",
        variant: "destructive",
      });
    }
  };

  // Handle regenerate all audio
  const handleRegenerateAll = async () => {
    if (!event) return;

    try {
      // First delete all existing audio files
      await deleteAllEventAudio(eventId as string);

      // Then generate new audio for all segments
      await handleGenerateAllTTS();

      toast({
        title: "Audio regeneration started",
        description: "All audio files will be regenerated",
      });
    } catch (error) {
      console.error("Error regenerating all audio:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate audio",
        variant: "destructive",
      });
    }
  };

  // Handle script generation
  const handleGenerateScript = async () => {
    if (!event) return;

    try {
      setIsGeneratingScript(true);

      // Call the server action to generate an enhanced script from the layout
      const result = await generateEnhancedScriptFromLayout(eventId as string);

      if (result.success) {
        toast({
          title: "Script generated",
          description: "Script has been generated successfully",
        });

        // Refresh the event data by reloading the page
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate script",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handle generating TTS for all script segments
  const handleGenerateAllTTS = async () => {
    try {
      const result = await generateTTSForAllSegments(eventId as string);

      if (result.success) {
        toast({
          title: "Audio generation",
          description: `Generated audio for ${result.successCount} segments`,
        });

        // Refresh the event data by reloading the page
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate audio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating audio for all segments:", error);
      toast({
        title: "Error",
        description: "Failed to generate audio",
        variant: "destructive",
      });
    }
  };

  // Handle generating TTS for a single script segment
  const handleGenerateSingleTTS = async (segmentId: number) => {
    try {
      const result = await generateTTSForSegment(segmentId);

      if (result.success) {
        toast({
          title: "Audio generated",
          description: "Audio has been generated successfully",
        });

        // Refresh the event data by reloading the page
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate audio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error generating audio for segment ${segmentId}:`, error);
      toast({
        title: "Error",
        description: "Failed to generate audio",
        variant: "destructive",
      });
    }
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
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <EventHeader
            eventName={event.name}
            eventDate={event.date}
            eventType={event.type}
            isRunning={isEventRunning}
            isReady={event.status === "ready"}
            status={event.status}
            onBack={() => router.push("/dashboard")}
            onToggleRunning={toggleEventRunning}
            onEdit={() => setActiveTab("settings")}
            onContinueSetup={() =>
              router.push(`/event/create?eventId=${event.id}`)
            }
            onGenerateLayout={() => {
              setActiveTab("layout");
              // Add logic to generate layout if needed
            }}
            onGenerateScript={() => {
              setActiveTab("script");
              // Add logic to generate script if needed
            }}
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
                value="layout"
                className="data-[state=active]:bg-background"
              >
                Layout
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

              <TabsTrigger
                value="postevent"
                className="data-[state=active]:bg-background"
              >
                Post Event Report
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <EventOverview
                event={event}
                totalDuration={totalDuration}
                onNavigateToTab={setActiveTab}
                onPlayAudio={(audioUrl) => {
                  // Find segment by audio_url property
                  const segment = event.scriptSegments.find(
                    (s) => s.audio_url === audioUrl
                  );

                  if (segment) {
                    console.log(
                      `Playing audio for segment: ${segment.id}, URL: ${audioUrl}`
                    );
                    handlePlayAudio(
                      segment.audio_url || "",
                      `${segment.type} Preview`,
                      segment.content
                    );
                  } else {
                    console.error(
                      `Segment not found for audio URL: ${audioUrl}`
                    );
                    toast({
                      title: "Audio not found",
                      description:
                        "The audio for this segment could not be found.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <LayoutManager
                eventId={parseInt(eventId as string)}
                layout={eventLayout}
                isGenerating={isGeneratingLayout}
                eventName={event.name}
                eventType={event.type}
                eventDate={event.date ? new Date(event.date) : undefined}
                eventStartTime={event.date ? new Date(event.date) : undefined}
                eventEndTime={event.date ? new Date(event.date) : undefined}
                onRegenerateLayout={handleRegenerateLayout}
                onUpdateSegment={handleUpdateLayoutSegment}
                onAddSegment={handleAddLayoutSegment}
                onDeleteSegment={handleDeleteLayoutSegment}
                onReorderSegments={(segments) => {
                  if (eventLayout) {
                    setEventLayout({
                      ...eventLayout,
                      segments,
                      lastUpdated: new Date().toISOString(),
                    });
                  }
                }}
              />
            </TabsContent>

            {/* Script Tab */}
            <TabsContent value="script" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <EnhancedScriptManager
                  eventId={parseInt(eventId as string)}
                  segments={event.scriptSegments || []}
                  onUpdateSegment={handleUpdateSegment}
                  onGenerateAudio={handleGenerateAudio}
                  onDeleteSegment={handleDeleteSegment}
                  onAddSegment={handleAddSegment}
                  onRegenerateAll={handleRegenerateAll}
                  onGenerateScript={handleGenerateScript}
                  onGenerateAllTTS={handleGenerateAllTTS}
                  onGenerateSingleTTS={handleGenerateSingleTTS}
                  isGeneratingScript={isGeneratingScript}
                  hasLayout={!!event.layout && event.layout.segments.length > 0}
                  eventName={event.name}
                  eventType={event.type}
                />
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
                  onNextSegment={memoizedHandleNextSegment}
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
              <div className="">
                <RealtimeAnalysis />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <EventSettings
                event={event}
                onSaveSettings={handleSaveSettings}
              />
            </TabsContent>

            <TabsContent value="postevent" className="space-y-4">
              <PostEventReport
                eventId="ev-12345"
                eventName="Product Launch Webinar"
                eventDate={new Date("2025-04-30")}
                duration={60}
                attendeeCount={250}
                averageEngagement={82}
                engagementTrend="up"
                emotionData={{
                  happy: 65,
                  neutral: 20,
                  surprised: 10,
                  angry: 5,
                }}
                timeSeriesData={[
                  // Time series data for the charts
                  {
                    time: "00:00",
                    engagement: 70,
                    happy: 60,
                    neutral: 30,
                    surprised: 5,
                    angry: 5,
                  },
                  {
                    time: "05:00",
                    engagement: 75,
                    happy: 65,
                    neutral: 25,
                    surprised: 8,
                    angry: 2,
                  },
                  // ...more data points
                ]}
                keyMoments={[
                  {
                    id: 1,
                    timestamp: "15:30",
                    title: "Product Demo",
                    description:
                      "Audience showed high engagement during live demonstration",
                    emotionChange: "Happy +20%",
                    engagementLevel: 92,
                  },
                  // ...more key moments
                ]}
                audienceSegmentation={[
                  { name: "First-time", value: 45, color: "#4CAF50" },
                  { name: "Returning", value: 30, color: "#2196F3" },
                  { name: "Premium", value: 25, color: "#9C27B0" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Audio Preview */}
        {selectedAudioPreview && (
          <div className="grid grid-cols-1 gap-6 stagger-animation mb-6">
            <Card
              className="animate-slide-up rhyme-card"
              style={{ animationDelay: "0.2s" }}
            >
              <SimpleAudioPlayer
                title={selectedAudioPreview.title}
                scriptText={selectedAudioPreview.scriptText}
                audioUrl={selectedAudioPreview.audioUrl}
                segmentId={selectedAudioPreview.segmentId}
              />
            </Card>
          </div>
        )}

        {/* AI Assistant */}
        <div className="grid grid-cols-1 gap-6 stagger-animation">
          <Card
            className="animate-slide-up rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <RhymeAIChat
              title="Event Assistant"
              initialMessage={`I'm your RhymeAI Event Assistant for '${
                event.name
              }'. This ${event.type} event is scheduled for ${new Date(
                event.date
              ).toLocaleDateString()}. The event is currently in '${
                event.status
              }' status with ${
                event.scriptSegments.length
              } script segments (${Math.floor(
                totalDuration / 60
              )} minutes total). How can I help you manage voices, adjust settings, or enhance content?`}
              placeholder="Ask about this event..."
              className="border-0 shadow-none"
              eventId={parseInt(eventId as string)}
              eventContext={{
                contextType: "event-assistance",
                purpose: "event-management",
                requiredFields: [],
                additionalInfo: {
                  eventId: parseInt(eventId as string),
                  eventName: event.name,
                  eventType: event.type,
                  eventDate: event.date,
                  eventStatus: event.status,
                  eventDescription: event.description || "",
                  location: event.location || "Not specified",
                  expectedAttendees: "Not specified",
                  segmentCount: event.scriptSegments?.length || 0,
                  hasScript: event.scriptSegments?.length > 0,
                  hasAudio:
                    event.scriptSegments?.some(
                      (segment) => segment.audio_url
                    ) || false,
                  hasLayout: eventLayout?.segments
                    ? eventLayout.segments.length > 0
                    : false,
                  totalDuration: totalDuration, // in seconds
                  layoutSegments:
                    eventLayout?.segments?.map((segment) => ({
                      id: segment.id,
                      title: segment.name,
                      description: segment.description,
                      duration: segment.duration,
                      type: segment.type,
                    })) || [],
                  scriptSegments:
                    event.scriptSegments?.map((segment) => ({
                      id: segment.id,
                      type: segment.type,
                      content: segment.content?.substring(0, 100) + "...", // Truncated for context
                      hasAudio: !!segment.audio_url,
                      timing: segment.timing,
                    })) || [],
                },
              }}
              preserveChat={true}
              chatSessionId={`event-assistant-${eventId}`}
              onScriptGenerated={(scriptData) => {
                // Handle script generation
                toast({
                  title: "Script update suggested",
                  description: "The AI has suggested changes to your script",
                });
              }}
              onVoiceSelected={(voiceData) => {
                // Handle voice selection
                toast({
                  title: "Voice settings updated",
                  description: "Voice settings have been updated",
                });
              }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
