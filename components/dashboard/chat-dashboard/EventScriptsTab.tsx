import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventData } from "@/app/actions/event";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, RefreshCw, PlayCircle } from "lucide-react";
import { updateScriptSegment } from "@/app/actions/event/script";
import { useToast } from "@/hooks/use-toast";

interface EventScriptsTabProps {
  selectedEvent: EventData;
  handleSuggestion: (suggestion: string) => void;
}

export function EventScriptsTab({
  selectedEvent,
  handleSuggestion,
}: EventScriptsTabProps) {
  const { toast } = useToast();
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start editing a segment
  const handleStartEdit = (segment: any) => {
    setEditingSegmentId(segment.id);
    setEditContent(segment.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSegmentId(null);
    setEditContent("");
  };

  // Save edited segment
  const handleSaveEdit = async (segmentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Script content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateScriptSegment(segmentId, {
        content: editContent.trim(),
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Script segment updated successfully",
        });

        // Reset edit state
        setEditingSegmentId(null);
        setEditContent("");

        // Suggest refreshing the event to see updated content
        handleSuggestion(`Refresh event "${selectedEvent.name}" details`);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update script segment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating script segment:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Script Segments</h3>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              {selectedEvent.scriptSegments?.length || 0} segments
            </Badge>
            {selectedEvent.scriptSegments?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  handleSuggestion(
                    `Regenerate script for "${selectedEvent.name}"`
                  )
                }
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {selectedEvent.scriptSegments?.length ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {selectedEvent.scriptSegments.map((segment, idx) => (
              <Card
                key={segment.id || idx}
                className={`bg-background/40 p-3 transition-all ${
                  editingSegmentId === segment.id ? "ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {segment.timing}s
                    </span>
                    {editingSegmentId !== segment.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleStartEdit(segment)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                  </div>
                </div>

                {editingSegmentId === segment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Enter script content..."
                      className="min-h-[100px] text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveEdit(segment.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <p className="text-xs text-muted-foreground">
                      {segment.content}
                    </p>
                    {segment.audio_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const audio = new Audio(segment.audio_url);
                          audio.play();
                        }}
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span className="sr-only">Play Audio</span>
                      </Button>
                    )}
                  </div>
                )}
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
                handleSuggestion(`Generate script for "${selectedEvent.name}"`)
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
