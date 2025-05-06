import { ArrowLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventData } from "@/app/actions/event";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ChatHeaderProps {
  selectedEvent: EventData | null | undefined;
  isTyping: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setSelectedEventId: (id: string | null) => void;
  formatDate: (dateString: string) => string;
}

export function ChatHeader({
  selectedEvent,
  isTyping,
  isFullscreen,
  toggleFullscreen,
  setSelectedEventId,
  formatDate,
}: ChatHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="border-b border-border p-4 bg-card/50 backdrop-blur-sm z-10 flex items-center justify-between">
      <div className="flex items-center">
        {selectedEvent ? (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => {
                setSelectedEventId(null);
                const params = new URLSearchParams(searchParams.toString());
                params.delete("eventId");
                router.replace(`${pathname}?${params.toString()}`, {
                  scroll: false,
                });
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{selectedEvent.name}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedEvent.type} • {formatDate(selectedEvent.date)}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold">RhymeAI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Your AI-powered event management assistant
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm bg-accent/10 px-3 py-1 rounded-full">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-accent rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-accent rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-accent rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <span>Thinking...</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
