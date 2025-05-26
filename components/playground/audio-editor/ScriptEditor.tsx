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
        className="min-h-[200px] font-medium resize-y"
        placeholder="Enter your script here..."
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-sm text-muted-foreground w-full sm:w-auto overflow-hidden text-ellipsis">
          <span className="whitespace-nowrap">
            {content.split(/\s+/).filter(Boolean).length} words
          </span>
          <span className="mx-1">|</span>
          <span className="whitespace-nowrap">
            Approximately{" "}
            {Math.round(content.split(/\s+/).filter(Boolean).length / 3)}{" "}
            seconds
          </span>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {onPlay && hasAudio && (
            <Button
              variant="outline"
              className="flex items-center gap-1 whitespace-nowrap"
              onClick={onPlay}
              disabled={isGenerating}
              size="sm"
            >
              <Play className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Play</span>
            </Button>
          )}

          <Button
            variant="outline"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={onSave}
            disabled={isGenerating || !content.trim()}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="text-xs sm:text-sm">Save</span>
          </Button>

          <Button
            variant="default"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={onGenerate}
            disabled={isGenerating || !content.trim()}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            <span className="text-xs sm:text-sm">Generate</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
