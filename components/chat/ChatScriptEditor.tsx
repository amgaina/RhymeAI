"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Clock, GripVertical, Plus, Trash2, Save, Mic, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateScriptSegment } from "@/app/actions/event/script";

interface ChatScriptEditorProps {
  script: any;
  eventId?: number;
  audioUrls: Record<string, string>;
  onScriptUpdated: (script: any) => void;
  onGenerateAudio: (segmentId: string) => void;
}

export function ChatScriptEditor({
  script,
  eventId,
  audioUrls,
  onScriptUpdated,
  onGenerateAudio,
}: ChatScriptEditorProps) {
  // Convert script to a format we can work with
  const [segments, setSegments] = useState<any[]>(
    script.segments || script.sections || []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  
  // Audio element ref
  const audioRef = useState<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef[1](new Audio());
    
    return () => {
      if (audioRef[0]) {
        audioRef[0].pause();
        audioRef[0].src = "";
      }
    };
  }, []);
  
  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(segments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    
    setSegments(updatedItems);
    setIsDirty(true);
  };
  
  // Handle segment update
  const handleSegmentUpdate = (index: number, field: string, value: any) => {
    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...updatedSegments[index],
      [field]: value,
    };
    
    setSegments(updatedSegments);
    setIsDirty(true);
  };
  
  // Save script changes to the database
  const saveScriptChanges = async () => {
    if (!eventId) return;
    
    setIsSaving(true);
    
    try {
      // Save each segment
      for (const segment of segments) {
        if (!segment.id) continue;
        
        await updateScriptSegment(segment.id, {
          content: segment.content,
          type: segment.type || segment.segment_type,
          status: segment.status || "edited",
          order: segment.order,
        });
      }
      
      setIsDirty(false);
      onScriptUpdated(segments);
    } catch (error) {
      console.error("Error saving script changes:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Play audio for a segment
  const playAudio = (segmentId: string) => {
    const audioUrl = audioUrls[segmentId];
    
    if (!audioUrl) {
      onGenerateAudio(segmentId);
      return;
    }
    
    if (audioRef[0]) {
      // Stop any currently playing audio
      audioRef[0].pause();
      
      // Play the new audio
      audioRef[0].src = audioUrl;
      audioRef[0].play();
      setAudioPlaying(segmentId);
      
      // Handle audio ended
      audioRef[0].onended = () => {
        setAudioPlaying(null);
      };
    }
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (audioRef[0]) {
      audioRef[0].pause();
      setAudioPlaying(null);
    }
  };
  
  // Get segment status badge
  const getStatusBadge = (segment: any) => {
    const status = segment.status || "draft";
    
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "edited":
        return <Badge variant="secondary">Edited</Badge>;
      case "generated":
        return <Badge variant="success">Generated</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Calculate total duration
  const totalDuration = segments.reduce(
    (total, segment) => total + (segment.timing ? segment.timing / 1000 : 0),
    0
  );
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Event Script</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Total Duration: {Math.round(totalDuration)} seconds
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={saveScriptChanges}
            disabled={!isDirty || isSaving}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Segments list */}
        <div className="col-span-1 border rounded-md p-2 bg-muted/20">
          <h4 className="text-sm font-medium mb-2">Script Segments</h4>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="segments">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {segments.map((segment, index) => (
                    <Draggable
                      key={`segment-${segment.id || index}`}
                      draggableId={`segment-${segment.id || index}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-2 rounded-md border ${
                            activeSegmentIndex === index
                              ? "bg-primary/10 border-primary"
                              : "bg-background hover:bg-muted/50"
                          }`}
                          onClick={() => setActiveSegmentIndex(index)}
                        >
                          <div {...provided.dragHandleProps} className="mr-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {segment.type || segment.segment_type || `Segment ${index + 1}`}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {segment.timing ? Math.round(segment.timing / 1000) : "?"} sec
                              <span className="ml-2">{getStatusBadge(segment)}</span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${
                              audioPlaying === segment.id ? "text-green-500" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (audioPlaying === segment.id) {
                                stopAudio();
                              } else {
                                playAudio(segment.id);
                              }
                            }}
                          >
                            {audioPlaying === segment.id ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : audioUrls[segment.id] ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          {segments.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No script segments available.
            </div>
          )}
        </div>
        
        {/* Segment editor */}
        <div className="col-span-2 border rounded-md p-4">
          {activeSegmentIndex !== null && segments[activeSegmentIndex] ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Edit Segment: {segments[activeSegmentIndex].type || segments[activeSegmentIndex].segment_type || `Segment ${activeSegmentIndex + 1}`}
                </h4>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(segments[activeSegmentIndex])}
                  
                  <Button
                    variant={audioUrls[segments[activeSegmentIndex].id] ? "default" : "outline"}
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      if (audioPlaying === segments[activeSegmentIndex].id) {
                        stopAudio();
                      } else {
                        playAudio(segments[activeSegmentIndex].id);
                      }
                    }}
                  >
                    {audioPlaying === segments[activeSegmentIndex].id ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Playing
                      </>
                    ) : audioUrls[segments[activeSegmentIndex].id] ? (
                      <>
                        <Play className="h-4 w-4" />
                        Play Audio
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Generate Audio
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="segment-content">Script Content</Label>
                <Textarea
                  id="segment-content"
                  value={segments[activeSegmentIndex].content}
                  onChange={(e) =>
                    handleSegmentUpdate(
                      activeSegmentIndex,
                      "content",
                      e.target.value
                    )
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
                
                <div className="text-xs text-muted-foreground">
                  <p>Use the following markers to enhance TTS quality:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>[PAUSE=500] - Add a pause of 500ms</li>
                    <li>[EMPHASIS]important text[/EMPHASIS] - Emphasize text</li>
                    <li>[BREATHE] - Add a natural breathing point</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-muted-foreground mb-2">
                Select a segment to edit
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
