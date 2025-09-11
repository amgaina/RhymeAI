import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getEvents, deleteEvent, EventData } from "@/app/actions/event";

export function useEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getEvents();

      if (result.success && result.events) {
        // The server now returns properly formatted EventData objects
        const clientEvents: EventData[] = result.events;

        setEvents(clientEvents);
      } else {
        console.error("Failed to load events:", result.error);
        toast({
          title: "Error loading events",
          description: result.error || "Could not load your events",
          variant: "destructive",
        });

        // Fallback to mock data if needed
        setEvents([
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
            scriptSegments: [],
            createdAt: "2025-03-15T10:00:00Z",
            status: "ready",
            hasPresentation: false,
            playCount: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error loading events",
        description: "There was a problem connecting to the server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        // Set deleting state for this event
        setIsDeleting((prev) => ({ ...prev, [eventId]: true }));

        // Call the server action to delete the event
        const result = await deleteEvent(eventId);

        if (result.success) {
          // Remove the event from the local state
          setEvents((prev) => prev.filter((event) => event.id !== eventId));

          toast({
            title: "Event deleted",
            description:
              "The event and all its resources have been deleted successfully.",
          });
        } else {
          console.error("Failed to delete event:", result.error);
          toast({
            title: "Error deleting event",
            description: result.error || "Could not delete the event",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Error deleting event",
          description: "There was a problem deleting the event",
          variant: "destructive",
        });
      } finally {
        // Clear deleting state for this event
        setIsDeleting((prev) => ({ ...prev, [eventId]: false }));
      }
    },
    [toast]
  );

  return {
    events,
    setEvents,
    isLoading,
    isDeleting,
    deleteEvent: handleDeleteEvent,
    refreshEvents: loadEvents,
  };
}
