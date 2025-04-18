"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Bot,
  User,
  CheckCircle2,
  ListChecks,
  ArrowDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RhymeAIChatProps {
  title?: string;
  description?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  eventContext?: {
    purpose: string;
    requiredFields: string[];
    contextType: "event-creation" | "script-generation" | "general-assistant";
    additionalInfo?: Record<string, any>;
  };
  onEventDataCollected?: (data: any) => void;
}

export function RhymeAIChat({
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script.",
  placeholder = "Tell me about your event...",
  className = "",
  eventContext = {
    purpose: "event-creation",
    requiredFields: [
      "eventName",
      "eventType",
      "eventDate",
      "eventLocation",
      "expectedAttendees",
      "eventDescription",
      "voicePreferences",
      "languagePreferences",
    ],
    contextType: "event-creation",
  },
  onEventDataCollected,
}: RhymeAIChatProps) {
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >({});
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      eventContext,
    },
    initialMessages: initialMessage
      ? [
          {
            id: "initial-message",
            role: "assistant",
            content: initialMessage,
            parts: [{ type: "text", text: initialMessage }],
          },
        ]
      : undefined,
    onResponse: (response) => {
      // Clear any previous errors
      setError(null);

      // Check if the response has any error status
      if (!response.ok) {
        console.error(
          "API response not OK:",
          response.status,
          response.statusText
        );
        setError(`API error: ${response.status} ${response.statusText}`);
      }
    },
    onFinish: (message) => {
      // Process the completed message to extract fields
      if (message.content) {
        extractFieldInfo(message.content);
      }
    },
    onError: (err) => {
      console.error("Chat API error:", err);

      // Create a more specific error message based on the error type
      let errorMessage =
        "Sorry, there was an error communicating with the AI assistant.";

      if (err instanceof TypeError && err.message.includes("ReadableStream")) {
        errorMessage =
          "There was an issue with the response stream. Please try again.";
      } else if (
        err.message.includes("NetworkError") ||
        err.message.includes("network")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (
        err.message.includes("timeout") ||
        err.message.includes("Timeout")
      ) {
        errorMessage = "The request timed out. Please try again.";
      } else if (err.message === "An error occurred.") {
        errorMessage =
          "The AI service encountered an error. This might be temporary - please try again in a moment.";
      }

      setError(errorMessage);
    },
  });

  // Proper refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle scroll events to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Show button when not at bottom (with a small threshold for better UX)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track collected information
  useEffect(() => {
    const allRequiredFields = eventContext?.requiredFields || [];
    const requiredFieldsCollected = allRequiredFields.every(
      (field) => collectedFields[field]
    );
    setIsDataComplete(requiredFieldsCollected && allRequiredFields.length > 0);
  }, [collectedFields, eventContext?.requiredFields]);

  // Extract field information from messages
  const extractFieldInfo = (content: string) => {
    const newCollectedFields = { ...collectedFields };
    const fieldPatterns =
      eventContext?.requiredFields?.map((field) => ({
        field,
        regex: new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i"),
      })) || [];

    fieldPatterns.forEach(({ field, regex }) => {
      if (content.toLowerCase().includes(field.toLowerCase())) {
        newCollectedFields[field] = true;
      }
    });

    setCollectedFields(newCollectedFields);
  };

  // Custom submit handler with error handling and retry logic
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any existing errors

    // Save the current input value before submission
    const currentInput = input;

    try {
      await handleSubmit(e);
    } catch (err) {
      console.error("Error submitting message:", err);
      setError("Failed to send message. Please try again.");

      // Add retry button functionality by keeping the input value
      // The retry will happen when the user clicks submit again with the same input
    }
  };

  // Generate script when all data is collected
  const handleGenerateScript = () => {
    if (isDataComplete && onEventDataCollected) {
      // Extract event data from conversation
      const eventData: Record<string, string> = {};
      eventContext?.requiredFields?.forEach((field) => {
        messages.forEach((msg) => {
          if (
            msg.content &&
            msg.content.toLowerCase().includes(field.toLowerCase())
          ) {
            const match = msg.content.match(
              new RegExp(`${field}[:\\s]+(.*?)(?=\\n|$)`, "i")
            );
            if (match && match[1]) {
              eventData[field] = match[1].trim();
            }
          }
        });
      });

      onEventDataCollected(eventData);

      // Add a message to transition to script generation
      setMessages([
        ...messages,
        {
          id: "transition-message",
          role: "assistant",
          content:
            "Great! I've collected all the necessary information. Now let's create an emcee script for your event.",
          parts: [
            {
              type: "text",
              text: "Great! I've collected all the necessary information. Now let's create an emcee script for your event.",
            },
          ],
        },
      ]);
    }
  };

  // Calculate progress percentage
  const progressPercentage = eventContext?.requiredFields?.length
    ? Math.round(
        (Object.values(collectedFields).filter(Boolean).length /
          eventContext.requiredFields.length) *
          100
      )
    : 0;

  // Custom styles for markdown components
  const markdownStyles = {
    p: "my-2",
    h1: "text-2xl font-bold my-4",
    h2: "text-xl font-bold my-3",
    h3: "text-lg font-bold my-2",
    h4: "text-base font-bold my-2",
    h5: "text-sm font-bold my-1",
    h6: "text-xs font-bold my-1",
    ul: "list-disc pl-5 my-2",
    ol: "list-decimal pl-5 my-2",
    li: "my-1",
    a: "text-blue-500 hover:underline",
    blockquote: "border-l-4 border-gray-300 pl-4 italic my-2",
    code: "font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5",
    pre: "bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-3 font-mono text-sm",
    hr: "border-t my-4",
    table: "min-w-full divide-y divide-gray-200 my-4",
    th: "px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
    td: "px-3 py-1 whitespace-nowrap",
    img: "max-w-full h-auto my-3 rounded-md",
    strong: "font-bold",
    em: "italic",
  };

  return (
    <Card className={`w-full border shadow-md ${className}`}>
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Progress indicator */}
        {eventContext?.contextType === "event-creation" && (
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

      <CardContent className="p-0">
        <div
          className="flex-1 space-y-4 p-4 min-h-[400px] max-h-[600px] overflow-y-auto"
          onScroll={handleScroll}
          ref={chatContainerRef}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-center p-8">
              <Bot className="h-12 w-12 text-primary/60 mb-4" />
              <p className="text-muted-foreground text-sm max-w-md">
                {initialMessage}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className="markdown-content">
                    <div className="font-medium text-sm mb-1">
                      {message.role === "user" ? "You" : "RhymeAI"}
                    </div>
                    {message.parts
                      ?.filter((part) => part.type !== "source")
                      .map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <div
                              key={index}
                              className="whitespace-pre-wrap text-sm"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ node, ...props }) => (
                                    <p
                                      className={markdownStyles.p}
                                      {...props}
                                    />
                                  ),
                                  h1: ({ node, ...props }) => (
                                    <h1
                                      className={markdownStyles.h1}
                                      {...props}
                                    />
                                  ),
                                  h2: ({ node, ...props }) => (
                                    <h2
                                      className={markdownStyles.h2}
                                      {...props}
                                    />
                                  ),
                                  h3: ({ node, ...props }) => (
                                    <h3
                                      className={markdownStyles.h3}
                                      {...props}
                                    />
                                  ),
                                  h4: ({ node, ...props }) => (
                                    <h4
                                      className={markdownStyles.h4}
                                      {...props}
                                    />
                                  ),
                                  h5: ({ node, ...props }) => (
                                    <h5
                                      className={markdownStyles.h5}
                                      {...props}
                                    />
                                  ),
                                  h6: ({ node, ...props }) => (
                                    <h6
                                      className={markdownStyles.h6}
                                      {...props}
                                    />
                                  ),
                                  ul: ({ node, ...props }) => (
                                    <ul
                                      className={markdownStyles.ul}
                                      {...props}
                                    />
                                  ),
                                  ol: ({ node, ...props }) => (
                                    <ol
                                      className={markdownStyles.ol}
                                      {...props}
                                    />
                                  ),
                                  li: ({ node, ...props }) => (
                                    <li
                                      className={markdownStyles.li}
                                      {...props}
                                    />
                                  ),
                                  a: ({ node, ...props }) => (
                                    <a
                                      className={markdownStyles.a}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      {...props}
                                    />
                                  ),
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote
                                      className={markdownStyles.blockquote}
                                      {...props}
                                    />
                                  ),
                                  code: ({
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }: any) =>
                                    inline ? (
                                      <code
                                        className={markdownStyles.code}
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    ) : (
                                      <code
                                        className={markdownStyles.code}
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    ),
                                  pre: ({ node, ...props }) => (
                                    <pre
                                      className={markdownStyles.pre}
                                      {...props}
                                    />
                                  ),
                                  hr: ({ node, ...props }) => (
                                    <hr
                                      className={markdownStyles.hr}
                                      {...props}
                                    />
                                  ),
                                  table: ({ node, ...props }) => (
                                    <table
                                      className={markdownStyles.table}
                                      {...props}
                                    />
                                  ),
                                  th: ({ node, ...props }) => (
                                    <th
                                      className={markdownStyles.th}
                                      {...props}
                                    />
                                  ),
                                  td: ({ node, ...props }) => (
                                    <td
                                      className={markdownStyles.td}
                                      {...props}
                                    />
                                  ),
                                  img: ({ node, ...props }) => (
                                    <img
                                      className={markdownStyles.img}
                                      {...props}
                                    />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong
                                      className={markdownStyles.strong}
                                      {...props}
                                    />
                                  ),
                                  em: ({ node, ...props }) => (
                                    <em
                                      className={markdownStyles.em}
                                      {...props}
                                    />
                                  ),
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        return null;
                      })}
                  </div>
                </div>

                {message.parts
                  ?.filter((part) => part.type === "source")
                  .map((part) => (
                    <div
                      key={`source-${part.source.id}`}
                      className="text-xs text-muted-foreground mt-1"
                    >
                      Source: [
                      <a
                        href={part.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        {part.source.title ?? new URL(part.source.url).hostname}
                      </a>
                      ]
                    </div>
                  ))}
              </div>
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
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center space-x-2"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Add a retry button when there's an error */}
          {error && (
            <div className="mt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFormSubmit}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {eventContext?.contextType === "event-creation" && (
        <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            <span>
              Fields remaining:{" "}
              {eventContext.requiredFields.length -
                Object.values(collectedFields).filter(Boolean).length}
            </span>
          </div>

          <Button
            onClick={handleGenerateScript}
            disabled={!isDataComplete}
            className="gap-2"
            size="sm"
            variant={isDataComplete ? "default" : "outline"}
          >
            <CheckCircle2 className="h-4 w-4" />
            Generate Script
          </Button>
        </CardFooter>
      )}

      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 rounded-full z-10"
          size="icon"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </Card>
  );
}
