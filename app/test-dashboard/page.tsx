"use client";

import { useState, useCallback, Suspense } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useChatEventCreation } from "@/hooks/useChatEventCreation";
import ChatDashboard from "@/components/dashboard/chat-dashboard/ChatDashboard";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function ChatBasedDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { events, isLoading, isDeleting, deleteEvent, refreshEvents } =
    useEvents();
  const { createEventFromChat, updateEventFromChat, isProcessing } =
    useChatEventCreation();

  // State for managing the selected event and dashboard UI
  const [isDashboardUpdating, setIsDashboardUpdating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Handle event selection
  const handleSelectEvent = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId === selectedEventId ? null : eventId);
    },
    [selectedEventId]
  );

  // Handle event creation via chat
  const handleCreateEvent = async (eventData: any) => {
    try {
      setIsDashboardUpdating(true);
      const result = await createEventFromChat(eventData);
      if (result.success) {
        // Refresh events to include the newly created one
        await refreshEvents();

        // Select the newly created event if it was successfully created
        if (result.eventId) {
          setSelectedEventId(result.eventId.toString());
          toast({
            title: "Event created",
            description: `"${
              eventData.eventName || "New event"
            }" has been created successfully.`,
          });
        }
      }
      return result;
    } finally {
      setIsDashboardUpdating(false);
    }
  };

  // Handle event update via chat
  const handleUpdateEvent = async (eventId: string, updateData: any) => {
    try {
      setIsDashboardUpdating(true);
      const result = await updateEventFromChat(eventId, updateData);
      if (result.success) {
        // Refresh events to include the updated one
        await refreshEvents();
        toast({
          title: "Event updated",
          description: `Event has been updated successfully.`,
        });
      }
      return result;
    } finally {
      setIsDashboardUpdating(false);
    }
  };

  // Handle navigation to event details page
  const handleContinueEvent = useCallback(
    (eventId: string) => {
      router.push(`/event/${eventId}`);
    },
    [router]
  );

  // Handle deleting an event
  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      // If the event being deleted is currently selected, clear the selection
      if (eventId === selectedEventId) {
        setSelectedEventId(null);
      }

      // Delete the event
      await deleteEvent(eventId);
    },
    [deleteEvent, selectedEventId]
  );

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatDashboard
          events={events}
          isLoading={isLoading || isDashboardUpdating || isProcessing}
          isDeleting={isDeleting}
          onDeleteEvent={handleDeleteEvent}
          onSelectEvent={handleSelectEvent}
          onContinueEvent={handleContinueEvent}
          selectedEventId={selectedEventId}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          createEventLink="/create-event"
        />
      </Suspense>
    </div>
  );
}
