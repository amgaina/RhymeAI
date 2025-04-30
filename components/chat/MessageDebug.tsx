import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

interface MessageDebugProps {
  message: any;
}

export function MessageDebug({ message }: MessageDebugProps) {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs flex items-center gap-1"
      >
        <Bug className="h-3 w-3" />
        {showDebug ? "Hide Debug" : "Debug Message"}
      </Button>

      {showDebug && (
        <div className="mt-2 p-2 bg-black/10 rounded-md text-xs">
          <div className="font-mono overflow-x-auto">
            <div className="mb-2">
              <strong>Message ID:</strong> {message.id}
            </div>
            <div className="mb-2">
              <strong>Role:</strong> {message.role}
            </div>
            <div className="mb-2">
              <strong>Content Type:</strong> {typeof message.content}
            </div>
            <div className="mb-2">
              <strong>Content Length:</strong>{" "}
              {typeof message.content === "string"
                ? message.content.length
                : "N/A"}
            </div>
            <div className="mb-2">
              <strong>Content Preview:</strong>{" "}
              {typeof message.content === "string"
                ? message.content.substring(0, 100) + "..."
                : JSON.stringify(message.content).substring(0, 100) + "..."}
            </div>
            <div className="mb-2">
              <strong>Has Parts:</strong>{" "}
              {message.parts ? `Yes (${message.parts.length})` : "No"}
            </div>
            <div className="mb-2">
              <strong>Has Tool Calls:</strong>{" "}
              {message.toolCalls
                ? `Yes (${message.toolCalls.length})`
                : "No"}
            </div>
            <div className="mb-2">
              <strong>Has Tool Invocations:</strong>{" "}
              {message.toolInvocations
                ? `Yes (${message.toolInvocations.length})`
                : "No"}
            </div>
            <div className="mb-2">
              <strong>Created At:</strong> {message.createdAt}
            </div>
            <div className="mt-4">
              <strong>Full Content:</strong>
              <pre className="mt-2 p-2 bg-black/20 rounded-md overflow-x-auto whitespace-pre-wrap">
                {typeof message.content === "string"
                  ? message.content
                  : JSON.stringify(message.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
