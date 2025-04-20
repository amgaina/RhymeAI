"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Edit,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface ScriptSegment {
  id: number;
  type: string;
  content: string;
  audio?: string | null;
  status: "draft" | "editing" | "generating" | "generated" | "failed";
  timing?: number;
  presentationSlide?: string;
}

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
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  const handleEdit = (segment: ScriptSegment) => {
    setActiveSegment(segment.id);
    setEditingContent(segment.content);
  };

  const handleSave = (segmentId: number) => {
    onUpdateSegment(segmentId, editingContent);
    setActiveSegment(null);
  };

  const handleCancel = () => {
    setActiveSegment(null);
    setEditingContent("");
  };

  const getStatusIcon = (status: ScriptSegment["status"]) => {
    switch (status) {
      case "generated":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "generating":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: ScriptSegment["status"]) => {
    switch (status) {
      case "generated":
        return "Audio generated";
      case "generating":
        return "Generating audio...";
      case "failed":
        return "Audio generation failed";
      case "editing":
        return "Edited (needs regeneration)";
      default:
        return "Draft";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">MC Script Segments</CardTitle>
        <CardDescription>
          Edit script segments and generate audio for your event MC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {segments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No script segments yet. Start a conversation with the AI to
              generate your script, or upload an event structure.
            </p>
          </div>
        ) : (
          segments.map((segment) => (
            <div key={segment.id} className="border rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm capitalize">
                  {segment.type}
                </h3>
                <div className="flex gap-2">
                  {segment.audio && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 gap-1"
                      onClick={() => onPlayAudio(segment.audio!)}
                    >
                      <Play className="h-3 w-3" />
                      Play
                    </Button>
                  )}
                  {activeSegment !== segment.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => handleEdit(segment)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {activeSegment === segment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-h-[100px] text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2 gap-1"
                      onClick={() => handleSave(segment.id)}
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">{segment.content}</p>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {getStatusIcon(segment.status)}
                    <span
                      className={
                        segment.status === "generated"
                          ? "text-green-600"
                          : segment.status === "generating"
                          ? "text-amber-600"
                          : segment.status === "failed"
                          ? "text-red-600"
                          : "text-gray-500"
                      }
                    >
                      {getStatusText(segment.status)}
                    </span>

                    {segment.status === "editing" && (
                      <Button
                        size="sm"
                        variant="link"
                        className="h-5 px-1 text-xs"
                        onClick={() => onGenerateAudio(segment.id)}
                      >
                        Regenerate audio
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
