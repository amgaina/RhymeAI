import { MessageContentProps } from "@/types/chat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export function MessageContent({ message }: MessageContentProps) {
  // Handle tool response if available
  if (message.toolResponse) {
    return <MarkdownRenderer>{message.toolResponse}</MarkdownRenderer>;
  }

  // Display regular message content
  if (message.content) {
    return <MarkdownRenderer>{message.content}</MarkdownRenderer>;
  }

  // Handle message parts if available
  if (message.parts?.length) {
    return (
      <>
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <MarkdownRenderer key={`text-${index}`}>
                {part.text}
              </MarkdownRenderer>
            );
          }

          if (part.type === "reasoning") {
            return (
              <div
                key={`reasoning-${index}`}
                className="bg-secondary/50 p-2 rounded-md my-2 text-xs"
              >
                <div className="font-medium mb-1">Reasoning:</div>
                <MarkdownRenderer>{part.reasoning}</MarkdownRenderer>
              </div>
            );
          }

          return null;
        })}
      </>
    );
  }

  // Fallback for empty messages
  return <span className="text-muted-foreground italic">Empty message</span>;
}
