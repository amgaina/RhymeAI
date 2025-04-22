"use client";

import { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Clock, GripVertical, Plus, Trash2, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateEventLayoutSegment } from "@/app/actions/event/layout";

interface ChatLayoutEditorProps {
  layout: any;
  eventId?: number;
  onLayoutUpdated: (layout: any) => void;
  onGenerateScript: () => void;
}

export function ChatLayoutEditor({
  layout,
  eventId,
  onLayoutUpdated,
  onGenerateScript,
}: ChatLayoutEditorProps) {
  // Convert layout to a format we can work with
  const [segments, setSegments] = useState<any[]>(
    Array.isArray(layout) ? layout : layout?.layout || []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  
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
  
  // Handle adding a new segment
  const handleAddSegment = () => {
    const newSegment = {
      name: `New Segment ${segments.length + 1}`,
      type: "custom",
      description: "Description for the new segment",
      duration: 5,
      order: segments.length + 1,
    };
    
    setSegments([...segments, newSegment]);
    setActiveSegmentIndex(segments.length);
    setIsDirty(true);
  };
  
  // Handle removing a segment
  const handleRemoveSegment = (index: number) => {
    const updatedSegments = [...segments];
    updatedSegments.splice(index, 1);
    
    // Update order property
    const reorderedSegments = updatedSegments.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    
    setSegments(reorderedSegments);
    setActiveSegmentIndex(null);
    setIsDirty(true);
  };
  
  // Save layout changes to the database
  const saveLayoutChanges = async () => {
    if (!eventId) return;
    
    setIsSaving(true);
    
    try {
      // Save each segment
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        await updateEventLayoutSegment(
          eventId.toString(),
          i,
          {
            name: segment.name,
            type: segment.type,
            description: segment.description,
            duration: segment.duration,
            order: segment.order,
          }
        );
      }
      
      setIsDirty(false);
      onLayoutUpdated(segments);
    } catch (error) {
      console.error("Error saving layout changes:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Calculate total duration
  const totalDuration = segments.reduce((total, segment) => total + (segment.duration || 0), 0);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Event Layout</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Total Duration: {totalDuration} minutes
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSegment}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Segment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveLayoutChanges}
            disabled={!isDirty || isSaving}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onGenerateScript}
            className="gap-1"
          >
            <FileText className="h-4 w-4" />
            Generate Script
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Segments list */}
        <div className="col-span-1 border rounded-md p-2 bg-muted/20">
          <h4 className="text-sm font-medium mb-2">Segments</h4>
          
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
                      key={`segment-${index}`}
                      draggableId={`segment-${index}`}
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
                              {segment.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {segment.duration} min
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSegment(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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
              No segments yet. Click "Add Segment" to create one.
            </div>
          )}
        </div>
        
        {/* Segment editor */}
        <div className="col-span-2 border rounded-md p-4">
          {activeSegmentIndex !== null && segments[activeSegmentIndex] ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                Edit Segment: {segments[activeSegmentIndex].name}
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="segment-name">Segment Name</Label>
                <Input
                  id="segment-name"
                  value={segments[activeSegmentIndex].name}
                  onChange={(e) =>
                    handleSegmentUpdate(activeSegmentIndex, "name", e.target.value)
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segment-type">Segment Type</Label>
                  <Input
                    id="segment-type"
                    value={segments[activeSegmentIndex].type}
                    onChange={(e) =>
                      handleSegmentUpdate(activeSegmentIndex, "type", e.target.value)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="segment-duration">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="segment-duration"
                    type="number"
                    min="1"
                    value={segments[activeSegmentIndex].duration}
                    onChange={(e) =>
                      handleSegmentUpdate(
                        activeSegmentIndex,
                        "duration",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="segment-description">Description</Label>
                <Textarea
                  id="segment-description"
                  value={segments[activeSegmentIndex].description}
                  onChange={(e) =>
                    handleSegmentUpdate(
                      activeSegmentIndex,
                      "description",
                      e.target.value
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-muted-foreground mb-2">
                Select a segment to edit or add a new one
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSegment}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Segment
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
