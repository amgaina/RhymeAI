import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventData } from "@/app/actions/event";

interface EventScriptsTabProps {
  selectedEvent: EventData;
  handleSuggestion: (suggestion: string) => void;
}

export function EventScriptsTab({
  selectedEvent,
  handleSuggestion,
}: EventScriptsTabProps) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Script Segments</h3>
          <Badge variant="outline" className="text-xs">
            {selectedEvent.scriptSegments?.length || 0} segments
          </Badge>
        </div>

        {selectedEvent.scriptSegments?.length ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {selectedEvent.scriptSegments.map((segment, idx) => (
              <Card
                key={idx}
                className="bg-background/40 p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="capitalize"
                    >
                      {segment.type}
                    </Badge>
                    {segment.audio || segment.audio_url ? (
                      <Badge className="bg-green-500/20 text-green-500 text-xs hover:bg-green-500/20">
                        Audio Ready
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/20 text-orange-500 text-xs hover:bg-orange-500/20">
                        No Audio
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {segment.timing}s
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {segment.content}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground text-sm">
            No script segments yet.
            <Button
              variant="link"
              className="block mx-auto mt-2"
              onClick={() =>
                handleSuggestion(
                  `Generate script for "${selectedEvent.name}"`
                )
              }
            >
              Generate a script
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
