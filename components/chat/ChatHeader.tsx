import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string;
  description?: string;
  progressPercentage: number;
  collectedFields: Record<string, any>;
  eventContext: any;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export function ChatHeader({
  title,
  description,
  progressPercentage,
  collectedFields,
  eventContext,
  isFullScreen = false,
  onToggleFullScreen,
}: ChatHeaderProps) {
  return (
    <div className="px-4 py-3 border-b flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {progressPercentage > 0 && progressPercentage < 100 && (
          <div className="w-full mt-2">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(collectedFields).length} of{" "}
              {eventContext.requiredFields.length} fields collected
            </div>
          </div>
        )}
      </div>

      {onToggleFullScreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullScreen}
          className="ml-auto h-8 w-8"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
