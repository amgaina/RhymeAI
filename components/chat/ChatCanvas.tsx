"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Trash2, ArrowDown, ArrowUp, Clock, FileText } from "lucide-react";

interface CanvasItem {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  duration?: number;
  order?: number;
}

interface ChatCanvasProps {
  initialItems?: CanvasItem[];
  onSave?: (items: CanvasItem[]) => void;
  onGenerateScript?: (items: CanvasItem[]) => void;
}

export function ChatCanvas({
  initialItems = [],
  onSave,
  onGenerateScript,
}: ChatCanvasProps) {
  const [items, setItems] = useState<CanvasItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editDuration, setEditDuration] = useState<number>(5);
  const [editType, setEditType] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Initialize with some items if none provided
  useEffect(() => {
    if (initialItems.length === 0) {
      setItems([
        {
          id: "welcome",
          type: "introduction",
          content: "Welcome and introduction",
          position: { x: 100, y: 100 },
          duration: 5,
          order: 1,
        },
        {
          id: "main",
          type: "main_content",
          content: "Main presentation content",
          position: { x: 100, y: 200 },
          duration: 20,
          order: 2,
        },
        {
          id: "qa",
          type: "q_and_a",
          content: "Q&A session",
          position: { x: 100, y: 300 },
          duration: 10,
          order: 3,
        },
        {
          id: "closing",
          type: "conclusion",
          content: "Closing remarks",
          position: { x: 100, y: 400 },
          duration: 5,
          order: 4,
        },
      ]);
    } else {
      setItems(initialItems);
    }
  }, [initialItems]);
  
  // Handle item selection
  const handleSelectItem = (id: string) => {
    setSelectedItem(id);
    const item = items.find((item) => item.id === id);
    if (item) {
      setEditContent(item.content);
      setEditType(item.type);
      setEditDuration(item.duration || 5);
    }
  };
  
  // Handle item drag
  const handleDrag = (id: string, position: { x: number; y: number }) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, position } : item
      )
    );
  };
  
  // Add a new item
  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    const newItem: CanvasItem = {
      id: newId,
      type: "custom",
      content: "New segment",
      position: { x: 100, y: 100 + items.length * 100 },
      duration: 5,
      order: items.length + 1,
    };
    
    setItems([...items, newItem]);
    handleSelectItem(newId);
    setIsEditing(true);
  };
  
  // Delete an item
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    if (selectedItem === id) {
      setSelectedItem(null);
      setIsEditing(false);
    }
  };
  
  // Save item changes
  const handleSaveItem = () => {
    if (!selectedItem) return;
    
    setItems(
      items.map((item) =>
        item.id === selectedItem
          ? {
              ...item,
              content: editContent,
              type: editType,
              duration: editDuration,
            }
          : item
      )
    );
    
    setIsEditing(false);
  };
  
  // Move item up in order
  const handleMoveUp = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index <= 0) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    // Update order property
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    
    setItems(updatedItems);
  };
  
  // Move item down in order
  const handleMoveDown = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index >= items.length - 1) return;
    
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    // Update order property
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    
    setItems(updatedItems);
  };
  
  // Save all changes
  const handleSaveAll = () => {
    // Sort items by order
    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Update order property
    const updatedItems = sortedItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    
    setItems(updatedItems);
    
    if (onSave) {
      onSave(updatedItems);
    }
  };
  
  // Generate script from canvas items
  const handleGenerateScript = () => {
    // Sort items by order
    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (onGenerateScript) {
      onGenerateScript(sortedItems);
    }
  };
  
  // Calculate total duration
  const totalDuration = items.reduce((total, item) => total + (item.duration || 0), 0);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Event Canvas</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Total Duration: {totalDuration} minutes
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Segment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAll}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save Layout
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateScript}
            className="gap-1"
          >
            <FileText className="h-4 w-4" />
            Generate Script
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="col-span-2 border rounded-md bg-muted/20 relative overflow-auto"
          style={{ height: "400px" }}
        >
          {items.map((item) => (
            <CanvasItemComponent
              key={item.id}
              item={item}
              isSelected={selectedItem === item.id}
              onSelect={() => handleSelectItem(item.id)}
              onDrag={(position) => handleDrag(item.id, position)}
              onDelete={() => handleDeleteItem(item.id)}
              onMoveUp={() => handleMoveUp(item.id)}
              onMoveDown={() => handleMoveDown(item.id)}
            />
          ))}
        </div>
        
        {/* Properties panel */}
        <div className="col-span-1 border rounded-md p-4">
          {selectedItem ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {isEditing ? "Edit Segment" : "Segment Properties"}
              </h4>
              
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Segment Type</Label>
                    <Input
                      id="edit-type"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">
                      Duration (minutes)
                    </Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="1"
                      value={editDuration}
                      onChange={(e) =>
                        setEditDuration(parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveItem}
                    >
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm">
                        {items.find((item) => item.id === selectedItem)?.type}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Duration:</span>
                      <span className="text-sm">
                        {items.find((item) => item.id === selectedItem)?.duration || 0} minutes
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Order:</span>
                      <span className="text-sm">
                        {items.find((item) => item.id === selectedItem)?.order || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <Label className="text-sm font-medium">Content:</Label>
                    <p className="text-sm mt-1">
                      {items.find((item) => item.id === selectedItem)?.content}
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(selectedItem)}
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-muted-foreground mb-2">
                Select a segment to view or edit its properties
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
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

// Canvas Item Component
interface CanvasItemComponentProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function CanvasItemComponent({
  item,
  isSelected,
  onSelect,
  onDrag,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CanvasItemComponentProps) {
  const controls = useDragControls();
  
  return (
    <motion.div
      drag
      dragControls={controls}
      dragMomentum={false}
      initial={{ x: item.position.x, y: item.position.y }}
      animate={{ x: item.position.x, y: item.position.y }}
      onDrag={(_, info) => {
        onDrag({ x: info.point.x, y: info.point.y });
      }}
      className={`absolute cursor-move ${
        isSelected ? "z-10" : "z-0"
      }`}
      onClick={onSelect}
    >
      <Card
        className={`w-48 ${
          isSelected
            ? "border-primary shadow-md"
            : "border-muted shadow-sm"
        }`}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-sm truncate max-w-[120px]">
              {item.type}
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {item.duration} min
            <span className="mx-1">•</span>
            Order: {item.order}
          </div>
          
          <div className="text-xs truncate">{item.content}</div>
          
          {isSelected && (
            <div className="flex justify-end mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
