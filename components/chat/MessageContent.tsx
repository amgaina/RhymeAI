import { MessageContentProps } from "@/types/chat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { MessageDebug } from "./MessageDebug";

// Helper function to clean message content
function cleanMessageContent(content: string): string {
  if (!content) return "";

  // Remove metadata parts
  return content
    .replace(/e:\{.*$/, "")
    .replace(/d:\{.*$/, "")
    .replace(/\{\"finishReason.*$/, "")
    .replace(/\{\"usage.*$/, "")
    .replace(/\{\"promptTokens.*$/, "")
    .replace(/\{\"completionTokens.*$/, "");
}

export function MessageContent({ message }: MessageContentProps) {
  // Clean the message content if it's a string
  let cleanedContent = "";
  if (typeof message.content === "string") {
    cleanedContent = cleanMessageContent(message.content);
  }

  // Handle tool response if available
  if (message.toolResponse) {
    return (
      <>
        <MarkdownRenderer>{message.toolResponse}</MarkdownRenderer>
        {/* <MessageDebug message={message} /> */}
      </>
    );
  }

  // Display regular message content
  if (message.content) {
    return (
      <>
        <MarkdownRenderer>{cleanedContent}</MarkdownRenderer>
        {/* <MessageDebug message={message} /> */}
      </>
    );
  }

  // Handle message parts if available
  if (message.parts?.length) {
    return (
      <>
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            const cleanedText =
              typeof part.text === "string"
                ? cleanMessageContent(part.text)
                : JSON.stringify(part.text);

            return (
              <MarkdownRenderer key={`text-${index}`}>
                {cleanedText}
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
                <MarkdownRenderer>
                  {(part as any).reasoning || ""}
                </MarkdownRenderer>
              </div>
            );
          }

          return null;
        })}
        {/* <MessageDebug message={message} /> */}
      </>
    );
  }

  // Fallback for empty messages
  return (
    <>
      <span className="text-muted-foreground italic">Empty message</span>
      {/* <MessageDebug message={message} /> */}
    </>
  );
}
