"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EventLayout, LayoutSegment, SegmentType } from "@/types/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Info,
  MessageSquare,
} from "lucide-react";
import { SortableItem } from "./SortableItem";
import SafeAIChat from "../SafeAIChat";

interface EventLayoutEditorProps {
  layout: EventLayout;
  onUpdateSegment: (segment: LayoutSegment) => void;
  onAddSegment: (segment: Omit<LayoutSegment, "id">) => void;
  onDeleteSegment: (segmentId: string) => void;
}

export default function EventLayoutEditor({
  layout,
  onUpdateSegment,
  onAddSegment,
  onDeleteSegment,
}: EventLayoutEditorProps) {
  const [segments, setSegments] = useState<LayoutSegment[]>(layout.segments);
  const [editingSegment, setEditingSegment] = useState<LayoutSegment | null>(
    null
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // New segment form state
  const [newSegment, setNewSegment] = useState<Omit<LayoutSegment, "id">>({
    name: "",
    type: "introduction",
    description: "",
    duration: 5,
    order: segments.length + 1,
  });

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = segments.findIndex(
        (segment) => segment.id === active.id
      );
      const newIndex = segments.findIndex((segment) => segment.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSegments = arrayMove(segments, oldIndex, newIndex);

        // Update order property for each segment
        const updatedSegments = newSegments.map((segment, index) => ({
          ...segment,
          order: index + 1,
        }));

        setSegments(updatedSegments);

        // Update each segment on the server
        updatedSegments.forEach((segment) => {
          onUpdateSegment(segment);
        });
      }
    }
  };

  // Handle segment edit
  const handleEditSegment = (segment: LayoutSegment) => {
    setEditingSegment(segment);
    setIsEditDialogOpen(true);
  };

  // Handle segment update
  const handleUpdateSegment = () => {
    if (!editingSegment) return;

    onUpdateSegment(editingSegment);
    setIsEditDialogOpen(false);
  };

  // Handle segment delete
  const handleDeleteSegment = (segmentId: string) => {
    onDeleteSegment(segmentId);

    // Update local state
    const filteredSegments = segments.filter((s) => s.id !== segmentId);
    setSegments(filteredSegments);
  };

  // Handle adding a new segment
  const handleAddSegment = () => {
    onAddSegment(newSegment);

    // Reset form
    setNewSegment({
      name: "",
      type: "introduction",
      description: "",
      duration: 5,
      order: segments.length + 2, // +2 because we're adding after the current last item
    });

    setIsAddDialogOpen(false);
  };

  // Handle AI-generated layout suggestions
  const handleAILayoutSuggestion = (data: any) => {
    if (
      data &&
      data.layoutSuggestions &&
      Array.isArray(data.layoutSuggestions)
    ) {
      // Process the AI suggestions
      data.layoutSuggestions.forEach((suggestion: any) => {
        if (
          suggestion.type &&
          suggestion.name &&
          suggestion.description &&
          suggestion.duration
        ) {
          onAddSegment({
            name: suggestion.name,
            type: suggestion.type as SegmentType,
            description: suggestion.description,
            duration: parseInt(suggestion.duration) || 5,
            order: segments.length + 1,
          });
        }
      });

      setIsAIChatOpen(false);
    }
  };

  // Calculate total duration
  const totalDuration = segments.reduce(
    (total, segment) => total + segment.duration,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Event Layout</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder segments. Total duration: {totalDuration}{" "}
            minutes
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIChatOpen(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>

          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Segment
          </Button>
        </div>
      </div>

      {/* Segment list with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={segments.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {segments.map((segment) => (
              <SortableItem key={segment.id} id={segment.id}>
                <Card className="border shadow-sm">
                  <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div>
                        <CardTitle className="text-base">
                          {segment.name}
                        </CardTitle>
                        <CardDescription>{segment.type}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {segment.duration} min
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSegment(segment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSegment(segment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">{segment.description}</p>
                  </CardContent>
                </Card>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add segment dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Segment</DialogTitle>
            <DialogDescription>
              Create a new segment for your event layout.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Segment Name</Label>
              <Input
                id="name"
                value={newSegment.name}
                onChange={(e) =>
                  setNewSegment({ ...newSegment, name: e.target.value })
                }
                placeholder="e.g., Opening Remarks"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Segment Type</Label>
              <Select
                value={newSegment.type}
                onValueChange={(value) =>
                  setNewSegment({ ...newSegment, type: value as SegmentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a segment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="keynote">Keynote</SelectItem>
                  <SelectItem value="panel">Panel Discussion</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="q_and_a">Q&A Session</SelectItem>
                  <SelectItem value="conclusion">Conclusion</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSegment.description}
                onChange={(e) =>
                  setNewSegment({ ...newSegment, description: e.target.value })
                }
                placeholder="Brief description of this segment"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={newSegment.duration}
                onChange={(e) =>
                  setNewSegment({
                    ...newSegment,
                    duration: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSegment}>Add Segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit segment dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>
              Update the details of this segment.
            </DialogDescription>
          </DialogHeader>

          {editingSegment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Segment Name</Label>
                <Input
                  id="edit-name"
                  value={editingSegment.name}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-type">Segment Type</Label>
                <Select
                  value={editingSegment.type}
                  onValueChange={(value) =>
                    setEditingSegment({
                      ...editingSegment,
                      type: value as SegmentType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="introduction">Introduction</SelectItem>
                    <SelectItem value="keynote">Keynote</SelectItem>
                    <SelectItem value="panel">Panel Discussion</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="q_and_a">Q&A Session</SelectItem>
                    <SelectItem value="conclusion">Conclusion</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingSegment.description}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={1}
                  value={editingSegment.duration}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      duration:
                        parseInt(e.target.value) || editingSegment.duration,
                    })
                  }
                />
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
            <Button onClick={handleUpdateSegment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chat for layout suggestions */}
      <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Layout Suggestions</DialogTitle>
            <DialogDescription>
              Chat with our AI to get suggestions for your event layout.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[500px]">
            <SafeAIChat
              className="h-full border rounded-lg"
              title="Layout Assistant"
              description="I'll help you create a customized layout for your event."
              initialMessage={`I can help you create a layout for your event. I see you're planning a ${
                layout.segments[0]?.type || "event"
              }.

What specific segments would you like to include? I can suggest a structure based on best practices for this type of event.`}
              placeholder="Describe what kind of layout you need..."
              eventContext={{
                purpose: "To create a customized event layout",
                requiredFields: ["layoutSuggestions"],
                contextType: "event-layout",
                additionalInfo: {
                  currentEventType: layout.segments[0]?.type || "general",
                  currentDuration: layout.totalDuration,
                  existingSegments: layout.segments.map((s) => s.type),
                },
              }}
              onEventDataCollected={handleAILayoutSuggestion}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
