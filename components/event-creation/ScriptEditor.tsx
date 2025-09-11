"use client";
import { useState } from "react";
import { ScriptSegment } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Play,
  Pause,
  Volume2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import SafeAIChat from "../SafeAIChat";

interface ScriptEditorProps {
  segments: ScriptSegment[];
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => void;
  onPlayAudio: (audioUrl: string) => void;
}

export default function ScriptEditor({
  segments,
  onUpdateSegment,
  onGenerateAudio,
  onPlayAudio,
}: ScriptEditorProps) {
  const [editingSegment, setEditingSegment] = useState<ScriptSegment | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentAISegment, setCurrentAISegment] =
    useState<ScriptSegment | null>(null);

  // Handle opening the edit dialog
  const handleEditSegment = (segment: ScriptSegment) => {
    setEditingSegment(segment);
    setIsEditDialogOpen(true);
  };

  // Handle saving the edited segment
  const handleSaveSegment = () => {
    if (!editingSegment) return;

    onUpdateSegment(editingSegment.id, editingSegment.content);
    setIsEditDialogOpen(false);
  };

  // Handle opening the AI chat for a specific segment
  const handleOpenAIChat = (segment: ScriptSegment) => {
    setCurrentAISegment(segment);
    setIsAIChatOpen(true);
  };

  // Handle AI suggestions for script content
  const handleAISuggestion = (data: any) => {
    if (!currentAISegment) return;

    if (data && data.scriptContent) {
      onUpdateSegment(currentAISegment.id, data.scriptContent);
      setIsAIChatOpen(false);
    }
  };

  // Get status badge for a segment
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "editing":
        return <Badge variant="secondary">Editing</Badge>;
      case "generating":
        return <Badge className="bg-amber-500">Generating</Badge>;
      case "generated":
        return <Badge className="bg-green-500">Generated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon for a segment
  const getStatusIcon = (segment: ScriptSegment) => {
    switch (segment.status) {
      case "draft":
        return <Edit className="h-4 w-4" />;
      case "editing":
        return <Edit className="h-4 w-4" />;
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "generated":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Script Segments</h3>

        <div className="text-sm text-muted-foreground">
          {segments.filter((s) => s.status === "generated").length} of{" "}
          {segments.length} segments with audio
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        {segments.map((segment) => (
          <AccordionItem key={segment.id} value={segment.id.toString()}>
            <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-t-md">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(segment)}
                  <span className="font-medium">{segment.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(segment.status)}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {segment.timing}s
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t pt-4">
              <div className="space-y-4 px-4">
                <div className="prose prose-sm max-w-none">
                  <p>{segment.content}</p>
                </div>

                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSegment(segment)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAIChat(segment)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      AI Assist
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {segment.audio ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          segment.audio && onPlayAudio(segment.audio)
                        }
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play Audio
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onGenerateAudio(segment.id)}
                        disabled={segment.status === "generating"}
                      >
                        {segment.status === "generating" ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Generate Audio
                          </>
                        )}
                      </Button>
                    )}

                    {segment.audio && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerateAudio(segment.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Script Segment</DialogTitle>
            <DialogDescription>
              Edit the content for this {editingSegment?.type} segment.
            </DialogDescription>
          </DialogHeader>

          {editingSegment && (
            <div className="space-y-4 py-4">
              <Textarea
                value={editingSegment.content}
                onChange={(e) =>
                  setEditingSegment({
                    ...editingSegment,
                    content: e.target.value,
                  })
                }
                rows={10}
                className="font-mono text-sm"
              />

              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Estimated duration: {editingSegment.timing} seconds
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSegment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chat dialog */}
      <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Script Assistant</DialogTitle>
            <DialogDescription>
              Get AI help with writing your script segment.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[500px]">
            <SafeAIChat
              className="h-full border rounded-lg"
              title="Script Assistant"
              description="I'll help you write or improve your script segment."
              initialMessage={`I can help you write or improve the script for your ${currentAISegment?.type} segment.

Here's the current content:

"${currentAISegment?.content}"

How would you like me to help? I can:
1. Rewrite it completely
2. Make it more engaging
3. Make it more formal/professional
4. Make it shorter or longer
5. Add specific information or details`}
              placeholder="Tell me how you want to improve this script..."
              eventContext={{
                purpose: "To improve script content",
                requiredFields: ["scriptContent"],
                contextType: "script-generation",
                additionalInfo: {
                  segmentType: currentAISegment?.type,
                  currentContent: currentAISegment?.content,
                  duration: currentAISegment?.timing,
                },
              }}
              onEventDataCollected={handleAISuggestion}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
