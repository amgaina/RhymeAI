"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { ChatAudioElement } from "./ChatAudioElement";

interface ChatAudioLinkProps {
  audioUrl: string;
  segmentId?: string | number;
  segmentName?: string;
}

export function ChatAudioLink({ 
  audioUrl, 
  segmentId,
  segmentName 
}: ChatAudioLinkProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="my-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={toggleExpanded}
        >
          <Volume2 className="h-3 w-3 mr-1" />
          {isExpanded ? "Hide Player" : "Play Audio"}
        </Button>
        
        {segmentName && (
          <span className="text-sm text-muted-foreground">
            {segmentName}
          </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-2">
          <ChatAudioElement 
            audioUrl={audioUrl} 
            segmentId={segmentId} 
            compact={false} 
          />
        </div>
      )}
    </div>
  );
}
