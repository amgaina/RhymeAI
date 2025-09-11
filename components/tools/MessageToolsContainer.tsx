import { ToolViewFactory } from "./ToolViewFactory";

interface MessageToolsContainerProps {
  tools: any[];
  eventId?: string | number;
}

export function MessageToolsContainer({
  tools,
  eventId,
}: MessageToolsContainerProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <div className="space-y-3">
      {tools.map((tool) => (
        <div key={tool.toolCallId} className="mb-2 last:mb-0">
          <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground">
            <span className="font-medium capitalize">
              {tool.toolName?.replace(/_/g, " ") || "Tool"}
            </span>
            {tool.state === "running" && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1 rounded">
                Running
              </span>
            )}
            {tool.state === "error" && (
              <span className="bg-red-100 text-red-700 text-[10px] px-1 rounded">
                Error
              </span>
            )}
            {tool.state === "result" && (
              <span className="bg-green-100 text-green-700 text-[10px] px-1 rounded">
                Complete
              </span>
            )}
          </div>

          <ToolViewFactory tool={tool} eventId={eventId} />
        </div>
      ))}
    </div>
  );
}
