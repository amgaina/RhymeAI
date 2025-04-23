import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, RefreshCw, Trash2, Edit } from "lucide-react";
import { EventLayout, LayoutSegment, SegmentType } from "@/types/layout";

interface LayoutManagerProps {
  eventId: number;
  layout: EventLayout | null;
  isGenerating: boolean;
  onRegenerateLayout: () => void;
  onUpdateSegment: (segment: LayoutSegment) => void;
  onAddSegment: (segment: Omit<LayoutSegment, "id">) => void;
  onDeleteSegment: (segmentId: string) => void;
}

export default function LayoutManager({
  eventId,
  layout,
  isGenerating,
  onRegenerateLayout,
  onUpdateSegment,
  onAddSegment,
  onDeleteSegment,
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
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
        </div>
        <div className="flex gap-2">
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
            <CardTitle>Event Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration (min)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layout.segments
                  .sort((a, b) => a.order - b.order)
                  .map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell>{segment.order}</TableCell>
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
                            onClick={() => onDeleteSegment(segment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
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
