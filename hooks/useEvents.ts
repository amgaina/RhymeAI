import { useState, useEffect } from "react";
import { EventData, getEvents } from "@/app/actions/event";
import { useToast } from "@/components/ui/use-toast";

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
          // Transform the server response to match client-side needs
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
