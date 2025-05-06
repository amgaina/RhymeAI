"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Wand2, Play } from "lucide-react";

interface ScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onGenerate: () => void;
  onPlay?: () => void;
  isGenerating: boolean;
  hasAudio?: boolean;
}

export default function ScriptEditor({
  content,
  onChange,
  onSave,
  onGenerate,
  onPlay,
  isGenerating,
  hasAudio = false,
}: ScriptEditorProps) {
  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] font-medium"
        placeholder="Enter your script here..."
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {content.split(/\s+/).filter(Boolean).length} words | Approximately{" "}
          {Math.round(content.split(/\s+/).filter(Boolean).length / 3)} seconds
        </div>

        <div className="flex gap-2">
          {onPlay && hasAudio && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={onPlay}
              disabled={isGenerating}
            >
              <Play className="h-4 w-4" />
              Play
            </Button>
          )}

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={onSave}
            disabled={isGenerating || !content.trim()}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>

          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={onGenerate}
            disabled={isGenerating || !content.trim()}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Generate Audio
          </Button>
        </div>
      </div>
    </div>
  );
}
