"use client";

import React, { useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { ListChecks, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Create a memoized version of the component to prevent unnecessary re-renders
interface ChatProgressProps {
  requiredFields: string[];
  collectedFields: Record<string, any>;
  onGenerateScript: () => void;
}

// Create a memoized version of the component
export const ChatProgress = memo(function ChatProgress({
  requiredFields,
  collectedFields,
  onGenerateScript,
}: ChatProgressProps) {
  // Use refs to track state without causing re-renders
  const isProcessingRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Calculate progress
  const progressCount = Object.values(collectedFields).filter(Boolean).length;
  const totalFields = requiredFields.length || 1; // Prevent division by zero
  const progressPercentage = Math.round((progressCount / totalFields) * 100);
  const isComplete = progressCount >= totalFields;

  // Handle click - simplified to avoid state changes
  const handleClick = () => {
    if (isComplete && !isProcessingRef.current) {
      isProcessingRef.current = true;

      // Immediately update button UI to show processing
      if (btnRef.current) {
        btnRef.current.disabled = true;
        btnRef.current.innerHTML = `
          <svg class="h-4 w-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        `;
      }

      // Call the script generation function after a brief delay
      setTimeout(onGenerateScript, 10);
    }
  };

  // Reset processing state when fields change
  useEffect(() => {
    if (!isComplete) {
      isProcessingRef.current = false;
    }
  }, [collectedFields, isComplete]);

  return (
    <div className="flex justify-between items-center border-t p-4 bg-primary/5">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          <span>Information collection progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-in-out",
                progressPercentage === 100
                  ? "bg-green-500"
                  : progressPercentage > 50
                  ? "bg-amber-500"
                  : "bg-primary"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {progressCount}/{totalFields} fields
          </span>
        </div>
      </div>

      {/* Simplified button with no tooltip to avoid infinite loop */}
      <Button
        ref={btnRef}
        onClick={handleClick}
        disabled={!isComplete || isProcessingRef.current}
        className="gap-2"
        size="sm"
        variant={isComplete ? "default" : "outline"}
        type="button"
      >
        {isComplete ? (
          <ArrowDownCircle className="h-4 w-4" />
        ) : (
          <ListChecks className="h-4 w-4" />
        )}
        {isComplete ? "Generate Script" : "Collecting Info..."}
      </Button>
    </div>
  );
});

export default ChatProgress;
