import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Check, X } from "lucide-react";

interface ScriptEditorPanelProps {
  initialContent: string;
  segmentId?: number;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function ScriptEditorPanel({
  initialContent,
  segmentId,
  onSubmit,
  onCancel,
}: ScriptEditorPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(true);

  const handleSubmit = () => {
    onSubmit(content);
  };

  return (
    <Card className="border-primary/20 mb-4 animate-in fade-in-50 slide-in-from-top-5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Edit Script Segment {segmentId ? `#${segmentId}` : ""}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter script content..."
          className="min-h-[200px] resize-none focus-visible:ring-primary"
          disabled={!isEditing}
        />
        {content.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>Content cannot be empty</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={content.length === 0}
          className="gap-1"
        >
          <Check className="h-4 w-4" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
