import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { MicIcon, ArrowRightIcon, RefreshCw } from "lucide-react";

interface ChatFooterProps {
  eventContext?: {
    contextType?: string;
    requiredFields?: string[];
    [key: string]: any;
  };
  progressPercentage: number;
  collectedFields: Record<string, boolean>;
  isDataComplete: boolean;
  handleGenerateScript: () => void;
  eventId?: string;
  onContinue?: () => void;
  scriptData?: any;
  generateAudio?: () => Promise<void>;
}

export function ChatFooter({
  eventContext,
  progressPercentage,
  collectedFields,
  isDataComplete,
  handleGenerateScript,
  eventId,
  onContinue,
  scriptData,
  generateAudio,
}: ChatFooterProps) {
  return (
    <CardFooter className="flex justify-end border-t p-4">
      {/* Only show Generate Script button for event-creation context and when data is complete */}
      {eventContext?.contextType === "event-creation" && (
        <>
          {isDataComplete ? (
            <Button
              onClick={handleGenerateScript}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Generate Script
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground">
              {progressPercentage < 100
                ? `Complete information collection to generate a script (${progressPercentage}%)`
                : "Reviewing information..."}
            </div>
          )}
        </>
      )}

      {/* Audio generation button for script playback */}
      {scriptData && generateAudio && (
        <Button
          onClick={generateAudio}
          variant="outline"
          className="ml-2 flex items-center gap-1"
        >
          <MicIcon className="h-4 w-4" />
          Play Audio
        </Button>
      )}

      {/* Continue button for navigation flows */}
      {onContinue && (
        <Button onClick={onContinue} className="ml-2 flex items-center gap-1">
          Continue
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      )}
    </CardFooter>
  );
}
