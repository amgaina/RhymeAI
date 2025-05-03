"use client";
import { useState, useEffect } from "react";
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
  PlusCircle,
  RefreshCcw,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  Volume2,
} from "lucide-react";
import DOMBasedAudioPlayer from "./DOMBasedAudioPlayer";
import { ScriptSegment } from "@/types/event";

interface ScriptManagerProps {
  segments: ScriptSegment[];
  onUpdateSegment: (segmentId: number, content: string) => void;
  onGenerateAudio: (segmentId: number) => Promise<void>;
  onDeleteSegment?: (segmentId: number) => void;
  onAddSegment?: () => void;
  onRegenerateAll?: () => void;
  onGenerateScript?: () => void; // Script generation based on event layout
  isGeneratingScript?: boolean;
  hasLayout?: boolean; // New prop to indicate if the event has a layout
}

export default function ScriptManager({
  segments,
  onUpdateSegment,
  onGenerateAudio,
  onDeleteSegment,
  onAddSegment,
  onRegenerateAll,
  onGenerateScript,
  isGeneratingScript = false,
  hasLayout = true, // Default to true for backward compatibility
}: ScriptManagerProps) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [selectedSegmentForPreview, setSelectedSegmentForPreview] =
    useState<ScriptSegment | null>(null);

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

  const handlePreviewAudio = (segment: ScriptSegment) => {
    setSelectedSegmentForPreview(segment);
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

  // Format time to MM:SS
  const formatTime = (time?: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Find segment index for navigation
  const findSegmentIndex = (segmentId: number) => {
    return segments.findIndex((s) => s.id === segmentId);
  };

  // Handle next segment for audio preview
  const handleNextSegment = () => {
    if (!selectedSegmentForPreview) return;

    const currentIndex = findSegmentIndex(selectedSegmentForPreview.id);
    if (currentIndex < segments.length - 1) {
      setSelectedSegmentForPreview(segments[currentIndex + 1]);
    }
  };

  // Handle previous segment for audio preview
  const handlePrevSegment = () => {
    if (!selectedSegmentForPreview) return;

    const currentIndex = findSegmentIndex(selectedSegmentForPreview.id);
    if (currentIndex > 0) {
      setSelectedSegmentForPreview(segments[currentIndex - 1]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">MC Script Segments</CardTitle>
              <CardDescription>
                Edit script segments and generate audio for your event MC
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onAddSegment && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddSegment}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Segment
                </Button>
              )}
              {onGenerateScript && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onGenerateScript}
                  disabled={isGeneratingScript || !hasLayout}
                  title={
                    !hasLayout
                      ? "Create a layout first to generate a script"
                      : "Generate script based on your event layout"
                  }
                  className="flex items-center gap-1"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating from Layout...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate from Layout
                    </>
                  )}
                </Button>
              )}

              {onRegenerateAll && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRegenerateAll}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Regenerate All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {segments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {hasLayout
                  ? "No script segments yet. Generate a script based on your event layout."
                  : "No script segments yet. Create an event layout first, then generate a script."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {onGenerateScript && (
                  <Button
                    variant="default"
                    className="flex items-center gap-1"
                    onClick={onGenerateScript}
                    disabled={isGeneratingScript || !hasLayout}
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Script...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {hasLayout ? "Generate from Layout" : "Layout Required"}
                      </>
                    )}
                  </Button>
                )}
                {!hasLayout && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => (window.location.href = "#layout")} // This should navigate to the layout tab
                  >
                    Create Layout First
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Import Script
                </Button>
              </div>
            </div>
          ) : (
            segments.map((segment) => (
              <div key={segment.id} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm capitalize flex items-center gap-2">
                    {segment.type}
                    {segment.timing && (
                      <span className="text-xs text-gray-500 font-normal">
                        {formatTime(segment.timing)}
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    {segment.audio_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 gap-1"
                        onClick={() => handlePreviewAudio(segment)}
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </Button>
                    )}
                    {activeSegment !== segment.id && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => handleEdit(segment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {onDeleteSegment && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-red-500 hover:text-red-700"
                            onClick={() => onDeleteSegment(segment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </>
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

                      {segment.status !== "generated" &&
                        segment.status !== "generating" && (
                          <Button
                            size="sm"
                            variant="link"
                            className="h-5 px-1 text-xs"
                            onClick={async () =>
                              await onGenerateAudio(segment.id)
                            }
                          >
                            Generate audio
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

      {/* Audio Preview */}
      {selectedSegmentForPreview && (
        <DOMBasedAudioPlayer
          title={`Preview: ${selectedSegmentForPreview.type}`}
          scriptText={selectedSegmentForPreview.content}
          audioS3key={selectedSegmentForPreview.audio_url}
          audioUrl={selectedSegmentForPreview.audio}
          segmentId={selectedSegmentForPreview.id} // Pass the segment ID for presigned URL
          segmentIndex={findSegmentIndex(selectedSegmentForPreview.id)}
          totalSegments={segments.length}
          onNextSegment={handleNextSegment}
          onPrevSegment={handlePrevSegment}
        />
      )}
    </div>
  );
}
