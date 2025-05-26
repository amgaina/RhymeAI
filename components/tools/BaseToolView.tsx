import { ToolCall as AIToolCall } from "ai";
import Link from "next/link";

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
      <div className="mt-4 flex justify-end">
        <Link
          href={`/event/${2}`}
          className="inline-flex items-center gap-2 bg-[#A69B7B]/90 hover:bg-[#A69B7B] text-white text-sm font-medium px-3 py-1.5 rounded transition-all duration-200 group"
        >
          <span>View Event Details</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:translate-x-0.5 transition-transform"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
}
