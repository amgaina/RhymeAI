import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  MessageSquare,
  Clock,
  ArrowDownUp,
  Calendar,
} from "lucide-react";
import { EventLayout, LayoutSegment, SegmentType } from "@/types/layout";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface LayoutManagerProps {
  eventId: number;
  layout: EventLayout | null;
  isGenerating: boolean;
  eventName?: string;
  eventDate?: Date;
  eventStartTime?: Date;
  eventEndTime?: Date;
  eventType?: string;
  onRegenerateLayout: () => void;
  onUpdateSegment: (segment: LayoutSegment) => void;
  onAddSegment: (segment: Omit<LayoutSegment, "id">) => void;
  onDeleteSegment: (segmentId: string) => void;
  onReorderSegments?: (segments: LayoutSegment[]) => void;
}

export default function LayoutManager({
  eventId,
  layout,
  isGenerating,
  eventName = "Event",
  eventDate,
  eventStartTime,
  eventEndTime,
  eventType = "conference",
  onRegenerateLayout,
  onUpdateSegment,
  onAddSegment,
  onDeleteSegment,
  onReorderSegments,
}: LayoutManagerProps) {
  const [editingSegment, setEditingSegment] = useState<LayoutSegment | null>(
    null
  );
  const [newSegment, setNewSegment] = useState<Omit<LayoutSegment, "id">>({
    name: "",
    type: "break" as SegmentType,
    description: "",
    duration: 5,
    order: layout?.segments.length ? layout.segments.length + 1 : 1,
    startTime: "",
    endTime: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [recalculateTimes, setRecalculateTimes] = useState(false);
  // Define segment types
  console.log("Event Layout:", layout);
  const segmentTypes = [
    { value: "introduction", label: "Introduction" },
    { value: "agenda", label: "Agenda" },
    { value: "keynote", label: "Keynote" },
    { value: "presentation", label: "Presentation" },
    { value: "q_and_a", label: "Q&A" },
    { value: "break", label: "Break" },
    { value: "discussion", label: "Discussion" },
    { value: "demo", label: "Demo" },
    { value: "conclusion", label: "Conclusion" },
    { value: "segment", label: "General Segment" },
  ];

  const handleSaveNewSegment = () => {
    onAddSegment(newSegment);
    setNewSegment({
      name: "",
      type: "break",
      description: "",
      duration: 5,
      order: layout?.segments.length ? layout.segments.length + 2 : 1,
      startTime: "",
      endTime: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleSaveEditedSegment = () => {
    if (editingSegment) {
      onUpdateSegment(editingSegment);
      setEditingSegment(null);
      setIsEditDialogOpen(false);
    }
  };

  const startEditSegment = (segment: LayoutSegment) => {
    setEditingSegment({ ...segment });
    setIsEditDialogOpen(true);
  };

  const getTotalDuration = () => {
    if (!layout || !layout.segments) return 0;
    return layout.segments.reduce(
      (total, segment) => total + segment.duration,
      0
    );
  };

  // Calculate start and end times for all segments based on event start time
  useEffect(() => {
    if (!layout || !layout.segments || !recalculateTimes) return;

    // Only recalculate if we have an event start time
    if (!eventStartTime) return;

    const sortedSegments = [...layout.segments].sort(
      (a, b) => a.order - b.order
    );
    let currentTime = new Date(eventStartTime);

    // Format time function
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    // Calculate times for each segment
    const updatedSegments = sortedSegments.map((segment) => {
      const startTime = formatTime(currentTime);

      // Calculate end time
      const endTimeDate = new Date(currentTime);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + segment.duration);
      const endTime = formatTime(endTimeDate);

      // Update current time for next segment
      currentTime = new Date(endTimeDate);

      return {
        ...segment,
        startTime,
        endTime,
      };
    });

    // Update all segments with new times
    updatedSegments.forEach((segment) => {
      onUpdateSegment(segment);
    });

    // Reset the recalculate flag
    setRecalculateTimes(false);
  }, [layout, eventStartTime, recalculateTimes, onUpdateSegment]);

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    setIsDragging(false);

    // Dropped outside the list
    if (!result.destination || !layout) return;

    const items = Array.from(layout.segments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    // Call the reorder callback if provided
    if (onReorderSegments) {
      onReorderSegments(updatedItems);
      // Trigger time recalculation
      setRecalculateTimes(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Layout</h2>
          <p className="text-muted-foreground">
            {layout
              ? `${
                  layout.segments.length
                } segments, ${getTotalDuration()} minutes total`
              : "No layout available"}
          </p>
          {eventDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {eventDate.toLocaleDateString()}
              {eventStartTime &&
                ` • ${eventStartTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              {eventEndTime &&
                ` - ${eventEndTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAIChat(!showAIChat)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {showAIChat ? "Hide AI Chat" : "AI Assistant"}
          </Button>
          <Button
            onClick={() => setRecalculateTimes(true)}
            variant="outline"
            className="flex items-center gap-2"
            title="Recalculate all segment times based on event start time"
          >
            <Clock className="h-4 w-4" />
            Update Times
          </Button>
          <Button
            onClick={onRegenerateLayout}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate Layout
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Segment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Segment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="new-name"
                    value={newSegment.name}
                    onChange={(e) =>
                      setNewSegment({ ...newSegment, name: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newSegment.type}
                    onValueChange={(value) =>
                      setNewSegment({
                        ...newSegment,
                        type: value as LayoutSegment["type"],
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3" id="new-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {segmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-duration" className="text-right">
                    Duration (min)
                  </Label>
                  <Input
                    id="new-duration"
                    type="number"
                    value={newSegment.duration}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        duration: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-order" className="text-right">
                    Order
                  </Label>
                  <Input
                    id="new-order"
                    type="number"
                    value={newSegment.order}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-start-time" className="text-right">
                    Start Time
                  </Label>
                  <Input
                    id="new-start-time"
                    placeholder="e.g., 9:00 AM"
                    value={newSegment.startTime}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        startTime: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-end-time" className="text-right">
                    End Time
                  </Label>
                  <Input
                    id="new-end-time"
                    placeholder="e.g., 9:30 AM"
                    value={newSegment.endTime}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        endTime: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="new-description"
                    value={newSegment.description}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        description: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveNewSegment}>Add Segment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Chat Assistant */}
      {showAIChat && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <RhymeAIChat
              eventId={eventId}
              title="Layout Assistant"
              initialMessage={`I'm here to help you with the layout for "${
                eventName || "your event"
              }". You can ask me to suggest segments, adjust timings, or provide ideas for your ${
                eventType || "event"
              }.`}
              placeholder="Ask about event layout..."
              eventContext={{
                purpose: "layout-assistance",
                contextType: "event-layout",
                additionalInfo: {
                  eventName: eventName || "",
                  eventType: eventType || "",
                  eventDate: eventDate ? eventDate.toISOString() : "",
                  layoutSegments: layout?.segments || [],
                  totalDuration: getTotalDuration(),
                },
              }}
              preserveChat={true}
            />
          </CardContent>
        </Card>
      )}

      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Generating layout for your event...</p>
          </div>
        </Card>
      ) : layout ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              Event Structure
              <span className="text-xs font-normal text-muted-foreground ml-2">
                (Drag to reorder segments)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration (min)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="segments">
                  {(provided) => (
                    <TableBody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {layout.segments
                        .sort((a, b) => a.order - b.order)
                        .map((segment, index) => (
                          <Draggable
                            key={segment.id}
                            draggableId={segment.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={
                                  snapshot.isDragging ? "bg-accent/50" : ""
                                }
                              >
                                <TableCell>{segment.order}</TableCell>
                                <TableCell>
                                  {segment.startTime || "-"}
                                </TableCell>
                                <TableCell>{segment.endTime || "-"}</TableCell>
                                <TableCell>{segment.name}</TableCell>
                                <TableCell>
                                  {
                                    segmentTypes.find(
                                      (type) => type.value === segment.type
                                    )?.label
                                  }
                                </TableCell>
                                <TableCell>{segment.duration}</TableCell>
                                <TableCell className="max-w-md truncate">
                                  {segment.description}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditSegment(segment)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      onClick={() =>
                                        onDeleteSegment(segment.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </DragDropContext>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Drag segments to reorder them. Times will automatically update
                based on the event start time.
              </p>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <p className="mb-4">No layout available for this event</p>
            <Button onClick={onRegenerateLayout}>Generate Layout</Button>
          </div>
        </Card>
      )}

      {/* Edit Segment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
          </DialogHeader>
          {editingSegment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingSegment.name}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingSegment.type}
                  onValueChange={(value) =>
                    setEditingSegment({
                      ...editingSegment,
                      type: value as LayoutSegment["type"],
                    })
                  }
                >
                  <SelectTrigger className="col-span-3" id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {segmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duration" className="text-right">
                  Duration (min)
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editingSegment.duration}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      duration: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-order" className="text-right">
                  Order
                </Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editingSegment.order}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start-time" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="edit-start-time"
                  placeholder="e.g., 9:00 AM"
                  value={editingSegment.startTime || ""}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      startTime: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end-time" className="text-right">
                  End Time
                </Label>
                <Input
                  id="edit-end-time"
                  placeholder="e.g., 9:30 AM"
                  value={editingSegment.endTime || ""}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      endTime: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingSegment.description}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
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
            <Button onClick={handleSaveEditedSegment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
