import { BaseToolView, ToolCall } from "./BaseToolView";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Expand, MinusSquare, PlusSquare, Save } from "lucide-react";

interface LayoutGenerationToolViewProps {
  tool: ToolCall;
}

interface LayoutItem {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function LayoutGenerationToolView({
  tool,
}: LayoutGenerationToolViewProps) {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  // Parse layout data from tool args
  useEffect(() => {
    try {
      const layoutData =
        typeof tool.args === "string" ? JSON.parse(tool.args) : tool.args;

      if (layoutData?.items && Array.isArray(layoutData.items)) {
        setLayout(layoutData.items);
      }
    } catch (e) {
      console.error("Error parsing layout data:", e);
    }
  }, [tool.args]);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!isEditing) return;

    setActiveItemId(itemId);
    const item = layout.find((i) => i.id === itemId);
    if (!item) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    e.stopPropagation();
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditing || !activeItemId || !dragRef.current || !canvasRef.current)
      return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX =
      (e.clientX - canvasRect.left - dragRef.current.offsetX) / scale;
    const newY = (e.clientY - canvasRect.top - dragRef.current.offsetY) / scale;

    setLayout((prev) =>
      prev.map((item) =>
        item.id === activeItemId
          ? { ...item, position: { x: newX, y: newY } }
          : item
      )
    );

    e.preventDefault();
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setActiveItemId(null);
    dragRef.current = null;
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setActiveItemId(null);
  };

  // Adjust zoom level
  const adjustZoom = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  return (
    <BaseToolView tool={tool}>
      <div className="mt-2">
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xs text-muted-foreground">
            Layout: {layout.length} elements
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={toggleEditMode}
              title={isEditing ? "Exit edit mode" : "Edit layout"}
            >
              <Expand className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => adjustZoom(-0.1)}
              disabled={!isEditing}
              title="Zoom out"
            >
              <MinusSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => adjustZoom(0.1)}
              disabled={!isEditing}
              title="Zoom in"
            >
              <PlusSquare className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => console.log("Save layout", layout)}
              disabled={!isEditing}
              title="Save layout"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className={`relative border rounded-md overflow-hidden bg-gray-50 transition-all duration-200 ${
            isEditing ? "cursor-move h-60" : "h-40"
          }`}
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {layout.map((item) => (
            <div
              key={item.id}
              className={`absolute p-1 border rounded select-none ${
                activeItemId === item.id ? "border-primary" : "border-gray-300"
              } ${isEditing ? "cursor-grab" : ""}`}
              style={{
                left: `${item.position.x}px`,
                top: `${item.position.y}px`,
                width: `${item.size.width}px`,
                height: `${item.size.height}px`,
                backgroundColor: isEditing
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(255, 255, 255, 0.5)",
                zIndex: activeItemId === item.id ? 10 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
            >
              <div className="text-2xs overflow-hidden text-ellipsis">
                {item.type}: {item.content}
              </div>
            </div>
          ))}

          {layout.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-2xs">
              {isEditing
                ? "No layout elements available. Try generating a new layout."
                : "Layout preview not available"}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-2 text-2xs text-muted-foreground">
            Drag elements to rearrange. Use zoom controls to adjust view.
          </div>
        )}
      </div>
    </BaseToolView>
  );
}
