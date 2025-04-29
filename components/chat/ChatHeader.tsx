import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { ChatHeaderProps } from "@/types/chat";

export function ChatHeader({
  title,
  description,
  progressPercentage,
  collectedFields,
  eventContext,
}: ChatHeaderProps) {
  return (
    <CardHeader className="bg-primary/5 border-b">
      <CardTitle className="text-primary flex items-center gap-2">
        <Bot className="h-5 w-5" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}

      {/* Progress indicator */}
      {eventContext?.contextType === "event-creation" &&
        eventContext.requiredFields && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Information collection: {progressPercentage}%</span>
              <span>
                {Object.values(collectedFields).filter(Boolean).length}/
                {eventContext.requiredFields.length} fields
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
    </CardHeader>
  );
}
