import { ToolCall as AIToolCall } from "ai";

// Define our custom ToolCall interface that includes all the properties we need
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args?: Record<string, any>;
  result?: any;
  isError?: boolean;
}

interface BaseToolViewProps {
  tool: ToolCall;
}

export function BaseToolView({ tool }: BaseToolViewProps) {
  if (!tool || !tool.result) {
    return (
      <div className="mt-2 text-sm text-muted-foreground">
        No result available
      </div>
    );
  }

  return (
    <div className="mt-2 text-sm">
      <div className="font-medium">Result:</div>
      {typeof tool.result === "object" ? (
        <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
          {JSON.stringify(tool.result, null, 2)}
        </pre>
      ) : (
        <div className="text-xs mt-1">{String(tool.result)}</div>
      )}
    </div>
  );
}
