"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EventData } from "@/app/actions/event";
import { Sidebar } from "./Sidebar";
import { ChatHeader } from "./ChatHeader";
import { ChatArea } from "./ChatArea";
import { EventDetailsPanel } from "./EventDetailsPanel";

interface ChatDashboardProps {
  events: EventData[];
  isLoading: boolean;
  isDeleting: Record<string, boolean>;
  selectedEventId?: string | null;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onSelectEvent?: (eventId: string) => void;
  onContinueEvent?: (eventId: string) => void;
  onCreateEvent?: (eventData: any) => Promise<any>;
  onUpdateEvent?: (eventId: string, updateData: any) => Promise<any>;
  createEventLink?: string;
}

export default function ChatDashboard({
  events,
  isLoading,
  isDeleting,
  selectedEventId: propSelectedEventId,
  onDeleteEvent,
  onSelectEvent,
  onContinueEvent,
  onCreateEvent,
  onUpdateEvent,
  createEventLink = "/create-event",
}: ChatDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Layout and view options
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("overview");

  // Get eventId from URL query param if available
  const eventIdFromUrl = searchParams.get("eventId");

  // Use URL parameter if available, otherwise use prop
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    eventIdFromUrl || propSelectedEventId || null
  );

  // Chat and interaction states
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const [chatKey, setChatKey] = useState<string>(`chat-${Date.now()}`);

  // Get the selected event details
  const selectedEvent = selectedEventId
    ? events.find((e) => e.id === selectedEventId)
    : null;

  // Combined effect to handle URL and state synchronizatio
  useEffect(() => {
    // Get current URL event ID
    const urlEventId = searchParams.get("eventId");

    // Check if we need to update the URL (only if selectedEventId is different from URL)
    if (selectedEventId !== urlEventId) {
      // Prevent infinite loop by using a ref to track if we're already updating
      const params = new URLSearchParams(searchParams.toString());

      if (selectedEventId) {
        // Update URL with selectedEventId
        params.set("eventId", selectedEventId);
      } else {
        // Remove eventId from URL
        params.delete("eventId");
      }

      // Update URL without refreshing page
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // We're intentionally NOT including searchParams in the dependency array
    // to prevent the infinite loop
  }, [selectedEventId, pathname, router]);

  // Update from props if changed
  useEffect(() => {
    if (
      propSelectedEventId !== selectedEventId &&
      propSelectedEventId !== null
    ) {
      setSelectedEventId(propSelectedEventId || null);
    }
  }, [propSelectedEventId, selectedEventId]);

  // Calculate total duration of script segments for the selected event
  const calculateTotalDuration = (segments: any[] = []) => {
    if (!segments || !Array.isArray(segments)) {
      return 0;
    }
    return segments.reduce((sum, segment) => sum + (segment.timing || 0), 0);
  };

  const totalDuration = selectedEvent
    ? calculateTotalDuration(selectedEvent.scriptSegments)
    : 0;

  // Calculate total duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get stats for the sidebar
  const totalEvents = events.length;
  const activeVoices = events.filter((e) => e.status === "ready").length;
  const scriptSegments = events.reduce(
    (sum, event) => sum + (event.scriptSegments?.length || 0),
    0
  );
  const contentMinutes = Math.round(
    events.reduce(
      (sum, event) =>
        sum +
        (event.scriptSegments || []).reduce(
          (segSum, segment) => segSum + (segment.timing || 0),
          0
        ),
      0
    ) / 60
  );

  // Generate initial message based on selected event
  const getInitialMessage = () => {
    if (selectedEvent) {
      return `Welcome to RhymeAI! I'm your event assistant.

I can see you're looking at "${selectedEvent.name}", a ${
        selectedEvent.type
      } scheduled for ${new Date(selectedEvent.date).toLocaleDateString()}.

This event has:
- ${selectedEvent.scriptSegments?.length || 0} script segments
- ${
        selectedEvent.status === "ready"
          ? "Ready to run"
          : "Status: " + selectedEvent.status
      }
${
  selectedEvent.scriptSegments?.some((s) => s.audio_url)
    ? "- Audio generated for some segments"
    : ""
}

How would you like to work with this event? You can:
- Update event details
- Generate or modify script content
- Manage voice settings
- Generate or play audio`;
    }

    return `Welcome to RhymeAI! I'm your event assistant.

I can help you:
- Create new events for conferences, webinars, workshops, etc.
- Manage your existing events and their scripts
- Generate and customize AI voice narration
- Design event layouts and program flows

How can I help you today?`;
  };

  // Handle event selection
  const handleSelectEvent = (eventId: string) => {
    // If selecting the same event, deselect it
    if (eventId === selectedEventId) {
      setSelectedEventId(null);
      // URL will be updated by the useEffect
    } else {
      setSelectedEventId(eventId);
      // URL will be updated by the useEffect
    }

    // Also call the parent handler if provided
    if (onSelectEvent) {
      onSelectEvent(eventId);
    }

    // Reset selected suggestion when switching events
    setSelectedSuggestion(null);

    // Regenerate chat key to reset chat state
    setChatKey(`chat-${Date.now()}-${eventId}`);

    // Expand the sidebar if it was collapsed
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }

    // Open details panel for the selected event
    setIsDetailsOpen(true);

    // Reset to overview tab
    setSelectedTab("overview");
  };

  // Handle creating a new event via chat
  const handleCreateNewEvent = () => {
    // Clear selected event
    setSelectedEventId(null);
    // URL will be updated by the useEffect

    // Regenerate chat key to reset chat state with a special prefix to trigger auto-submit
    setChatKey(`chat-new-event-${Date.now()}`);

    // Expand the sidebar if it was collapsed
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }

    // Close details panel
    setIsDetailsOpen(false);

    // The ChatArea component will detect the special chat key prefix
    // and automatically submit "create new event" to the chat

    // Scroll to bottom to show the new message
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 300);
    }
  };

  // Custom props for effective chatting
  const customChatProps = {
    title: "",
    initialMessage: getInitialMessage(),
    placeholder: selectedEvent
      ? `Ask about "${selectedEvent.name}" or type a command...`
      : "Ask about events or type 'create new event'...",
    className: "border-0 shadow-none h-full flex flex-col",
    messageContainerClassName: "flex-1 overflow-y-auto px-4 py-6 space-y-6",
    inputContainerClassName:
      "p-4 border-t border-border bg-card/50 backdrop-blur-sm",
    userMessageClassName:
      "bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto",
    assistantMessageClassName:
      "bg-muted p-3 rounded-2xl rounded-tl-sm max-w-[80%]",
    onTypingStart: () => setIsTyping(true),
    onTypingEnd: () => setIsTyping(false),
    eventId: selectedEvent ? parseInt(selectedEvent.id) : undefined,
    eventContext: {
      contextType: selectedEvent ? "event-assistance" : "dashboard-assistant",
      purpose: selectedEvent
        ? "event-management"
        : "event-creation-and-management",
      requiredFields: selectedEvent
        ? []
        : ["eventName", "eventType", "eventDate"],
      additionalInfo: selectedEvent
        ? {
            eventId: selectedEventId ? parseInt(selectedEventId) : undefined,
            eventName: selectedEvent.name,
            eventType: selectedEvent.type,
            eventDate: selectedEvent.date,
            eventStatus: selectedEvent.status,
            eventDescription: selectedEvent.description || "",
            location: selectedEvent.location || "Not specified",
            expectedAttendees: "Not specified",
            segmentCount: selectedEvent.scriptSegments?.length || 0,
            hasScript: selectedEvent.scriptSegments?.length > 0,
            hasAudio:
              selectedEvent.scriptSegments?.some(
                (segment) => segment.audio_url
              ) || false,
            hasLayout: selectedEvent.layout
              ? selectedEvent.layout.segments?.length > 0
              : false,
            totalDuration: totalDuration, // in seconds
            layoutSegments:
              selectedEvent.layout?.segments?.map((segment: any) => ({
                id: segment.id,
                title: segment.name,
                description: segment.description,
                duration: segment.duration,
                type: segment.type,
              })) || [],
            scriptSegments:
              selectedEvent.scriptSegments?.map((segment: any) => ({
                id: segment.id,
                type: segment.type,
                content: segment.content?.substring(0, 100) + "...", // Truncated for context
                hasAudio: !!(segment.audio || segment.audio_url),
                timing: segment.timing,
              })) || [],
          }
        : {
            purpose: "event-creation-and-management",
            totalEvents,
            activeEvents: activeVoices,
            scriptSegments,
            allEvents: events.map((event) => ({
              id: event.id,
              name: event.name,
              type: event.type,
              date: event.date,
              status: event.status,
              segmentCount: event.scriptSegments?.length || 0,
              hasAudio: event.scriptSegments?.some((s) => s.audio_url) || false,
            })),
          },
    },
    onEventDataCollected: (eventData: any) => {
      // This will be called when event data is collected through chat
      console.log("Event data collected from chat:", eventData);

      if (selectedEventId && onUpdateEvent) {
        // If we have a selected event, we're updating it
        onUpdateEvent(selectedEventId, eventData);
      } else if (onCreateEvent) {
        // Otherwise we're creating a new event
        onCreateEvent(eventData);
      }
    },
    onLayoutGenerated: (layoutData: any) => {
      // Handle layout generation
      console.log("Layout generated:", layoutData);
      if (layoutData.eventId) {
        router.push(`/event/${layoutData.eventId}/layout`);
      }
    },
    onScriptGenerated: (scriptData: any) => {
      // Handle script generation
      console.log("Script generated:", scriptData);
      if (scriptData.eventId) {
        router.push(`/event/${scriptData.eventId}/script`);
      }
    },
    preserveChat: true,
    chatSessionId: `dashboard-chat-${selectedEventId || "main"}`,
  };

  // Handle suggestions
  const handleSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    // In a real implementation, you'd pass this to the chat input
    // or simulate a message from the user
    console.log(`Suggestion clicked: ${suggestion}`);
  };

  // Get event progress completion percentage
  const getEventProgress = (event: EventData) => {
    const totalSegments = event.scriptSegments?.length || 0;
    if (totalSegments === 0) return 0;

    const completedSegments =
      event.scriptSegments?.filter((segment) => segment.audio_url).length || 0;

    return Math.round((completedSegments / totalSegments) * 100);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setSidebarCollapsed(true);
      setIsDetailsOpen(false);
    } else {
      setSidebarCollapsed(false);
      setIsDetailsOpen(true);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Scroll to bottom when new messages arrive or selected event changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    // Reset selected suggestion when event changes
    setSelectedSuggestion(null);
  }, [selectedEventId, isTyping]);

  return (
    <div
      className={`flex h-screen bg-secondary overflow-hidden ${
        isFullscreen ? "fullscreen-mode" : ""
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        events={events}
        isLoading={isLoading}
        isDeleting={isDeleting}
        selectedEventId={selectedEventId}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onSelectEvent={handleSelectEvent}
        onContinueEvent={onContinueEvent}
        onCreateNewEvent={handleCreateNewEvent}
        createEventLink={createEventLink}
        formatDate={formatDate}
        getEventProgress={getEventProgress}
        totalEvents={totalEvents}
        activeVoices={activeVoices}
        scriptSegments={scriptSegments}
        contentMinutes={contentMinutes}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <ChatHeader
          selectedEvent={selectedEvent}
          isTyping={isTyping}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          setSelectedEventId={setSelectedEventId}
          formatDate={formatDate}
        />

        {/* Main Layout - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div
            className={`${
              isDetailsOpen && selectedEvent ? "w-2/3" : "w-full"
            } flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out`}
          >
            {/* Chat Messages Area */}
            <ChatArea
              selectedEvent={selectedEvent}
              selectedEventId={selectedEventId}
              isTyping={isTyping}
              chatContainerRef={chatContainerRef}
              selectedSuggestion={selectedSuggestion}
              setSelectedSuggestion={setSelectedSuggestion}
              handleSuggestion={handleSuggestion}
              chatKey={chatKey}
              customChatProps={customChatProps}
            />
          </div>

          {/* Event Details Panel */}
          {selectedEvent && (
            <EventDetailsPanel
              selectedEvent={selectedEvent}
              isDetailsOpen={isDetailsOpen}
              setIsDetailsOpen={setIsDetailsOpen}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              formatDate={formatDate}
              formatDuration={formatDuration}
              totalDuration={totalDuration}
              getEventProgress={getEventProgress}
              onContinueEvent={onContinueEvent}
              handleSuggestion={handleSuggestion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
