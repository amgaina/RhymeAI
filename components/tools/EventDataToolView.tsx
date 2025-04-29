import { BaseToolView, ToolCall } from "./BaseToolView";

interface EventDataToolViewProps {
  tool: ToolCall;
}

export function EventDataToolView({ tool }: EventDataToolViewProps) {
  let eventName = "Not specified";

  try {
    const eventData =
      typeof tool.args === "string" ? JSON.parse(tool.args) : tool.args;

    if (typeof eventData?.eventName === "string") {
      eventName = eventData.eventName;
    }
  } catch (e) {
    console.error("Error parsing tool args:", e);
  }

  return (
    <BaseToolView tool={tool}>
      <div className="mt-1 overflow-hidden text-ellipsis">
        <div className="text-2xs text-muted-foreground">Event: {eventName}</div>
      </div>
    </BaseToolView>
  );
}
