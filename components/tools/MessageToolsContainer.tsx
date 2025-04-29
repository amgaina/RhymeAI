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
        <div key={tool.toolCallId} className="tool-container">
          <ToolViewFactory tool={tool} eventId={eventId} />
        </div>
      ))}
    </div>
  );
}
