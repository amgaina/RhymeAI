import { Bot, Loader2, ArrowUp } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { ChatMessagesProps } from "@/types/chat";
import { Button } from "@/components/ui/button";

export function ChatMessages({
  messages,
  isLoading,
  error,
  messagesEndRef,
  chatContainerRef,
  initialMessage,
  handleScroll,
  loadMoreMessages,
  hasMoreMessages,
  isLoadingHistory,
}: ChatMessagesProps) {
  return (
    <div
      className="flex-1 space-y-4 p-4 min-h-[400px] max-h-[600px] overflow-y-auto"
      onScroll={handleScroll}
      ref={chatContainerRef}
    >
      {/* Load More Messages Button */}
      {messages.length > 0 && hasMoreMessages && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMoreMessages}
            disabled={isLoadingHistory}
            className="text-xs flex items-center gap-1"
          >
            {isLoadingHistory ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ArrowUp className="h-3 w-3 mr-1" />
            )}
            {isLoadingHistory ? "Loading..." : "Load older messages"}
          </Button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-center p-8">
          <Bot className="h-12 w-12 text-primary/60 mb-4" />
          <p className="text-muted-foreground text-sm max-w-md">
            {initialMessage}
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))
      )}

      {/* Display error message if there is one */}
      {error && (
        <div className="flex items-center justify-center py-2">
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm flex items-center">
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
              className="mr-2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              RhymeAI is thinking...
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
