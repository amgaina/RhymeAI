import { Button } from "@/components/ui/button";
import { EventData } from "@/app/actions/event";

interface ChatSuggestionsProps {
  selectedEvent: EventData | null | undefined;
  selectedSuggestion: string | null;
  handleSuggestion: (suggestion: string) => void;
}

export function ChatSuggestions({
  selectedEvent,
  selectedSuggestion,
  handleSuggestion,
}: ChatSuggestionsProps) {
  // Generate smart suggestions based on context
  const generateSuggestions = () => {
    if (selectedEvent) {
      const eventHasScript = selectedEvent.scriptSegments?.length > 0;
      const eventHasAudio = selectedEvent.scriptSegments?.some(
        (s) => s.audio_url
      );

      return [
        `Update "${selectedEvent.name}" details`,
        eventHasScript
          ? `Generate audio for event segments`
          : `Generate script for "${selectedEvent.name}"`,
        eventHasAudio ? `Play all audio segments` : `Create a new event layout`,
        `Set voice preferences for "${selectedEvent.name}"`,
        `View event timeline visualization`,
      ];
    }

    return [
      "Create a new conference event",
      "Create a webinar with Q&A session",
      "Create a podcast recording event",
      "Show my upcoming events this month",
      "What voice types are available?",
    ];
  };

  return (
    <div className="p-3 border-t border-border bg-card/30 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {generateSuggestions().map((suggestion, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className={`text-xs py-1 h-auto ${
              selectedSuggestion === suggestion
                ? "bg-accent/20 border-accent"
                : "bg-card/50 hover:bg-accent/10"
            }`}
            onClick={() => handleSuggestion(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
