import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getEvents, EventData } from "@/app/actions/event";

export function useEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
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
    }

    loadEvents();
  }, [toast]);

  return { events, setEvents, isLoading };
}
