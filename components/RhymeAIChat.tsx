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
  CircleCheck,
  CircleDot,
  Wrench,
  RotateCw,
  ArrowDownCircle,
  Mic2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { convertToSSML, TTSVoiceParams } from "@/lib/tts-utils";
import { saveChatMessage } from "@/app/actions/chat/save";
import { syncChatMessages } from "@/app/actions/chat/sync";
import { loadEventChatHistory } from "@/app/actions/chat/load-event-chat";
import { PreviousConversations } from "@/components/PreviousConversations";

interface RhymeAIChatProps {
  title?: string;
  description?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  eventId?: number; // Add eventId prop to associate chat with an event
  chatSessionId?: string; // Add chatSessionId prop to maintain chat continuity
  preserveChat?: boolean; // Whether to preserve chat messages between sessions
  eventContext?: {
    purpose: string;
    requiredFields: string[];
    contextType: "event-creation" | "script-generation" | "general-assistant";
    additionalInfo?: Record<string, any>;
  };
  onEventDataCollected?: (data: any) => void;
  onScriptGenerated?: (script: any) => void;
  onVoiceSelected?: (voiceParams: TTSVoiceParams) => void;
  onContinue?: () => void; // Add onContinue prop to handle navigation to next step
}

export function RhymeAIChat({
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script.",
  placeholder = "Tell me about your event...",
  className = "",
  eventId, // This might be undefined if we're creating a new event
  chatSessionId, // Unique ID for this chat session to maintain continuity
  preserveChat = false, // Whether to preserve chat messages between sessions
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
  onScriptGenerated,
  onVoiceSelected,
  onContinue, // Function to navigate to the next step
}: RhymeAIChatProps) {
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >({});
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [voiceParams, setVoiceParams] = useState<Partial<TTSVoiceParams>>({});
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<number | undefined>(
    eventId
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPreviousConversations, setShowPreviousConversations] =
    useState(false);

  // Create a stable body object that doesn't change on every render
  const chatBody = useMemo(() => ({ eventContext }), [eventContext]);

  // Create a stable initial message that doesn't change on every render
  const initialChatMessage = useMemo(() => {
    // Only use initial message if we don't have an eventId
    // For events, we'll load messages from the database
    if (initialMessage && !eventId) {
      return [
        {
          id: `initial-message-${Date.now()}`,
          role: "assistant",
          content: initialMessage,
          parts: [{ type: "text", text: initialMessage }],
        },
      ];
    }
    return undefined;
  }, [initialMessage, eventId]);

  // Generate a stable chat ID for this event
  const chatId = useMemo(() => {
    // If a specific chatSessionId is provided, use it
    if (chatSessionId) return chatSessionId;

    // Otherwise, create an ID based on the event ID
    const currentEventId = eventId || createdEventId;
    const id = currentEventId
      ? `event-${currentEventId}`
      : `new-event-${Date.now()}`;
    console.log(`Generated chat ID: ${id} for event ID: ${currentEventId}`);
    return id;
  }, [chatSessionId, eventId, createdEventId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: chatBody,
    id: chatId, // Use the stable chat ID
    initialMessages: initialChatMessage,
    // Always preserve messages to ensure continuity
    preserve: preserveChat,
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

      // Extract sync token from response headers for component coordination
      const token = response.headers.get("X-RhymeAI-Sync-Token");
      if (token) {
        setSyncToken(token);
      }

      // Log the event ID for debugging
      console.log(
        `Chat response for event ID: ${
          eventId || createdEventId
        }, chat ID: ${chatId}`
      );
    },
    onFinish: (message) => {
      // Process the completed message to extract fields
      if (message.content) {
        extractFieldInfo(message.content);
      }

      // Try to parse tool calls from the message
      try {
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          message.toolInvocations.forEach((toolCall) => {
            if (
              toolCall.toolName === "store_event_data" &&
              onEventDataCollected
            ) {
              const eventData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;

              // Call the callback with the data if it's valid
              if (
                eventData &&
                typeof eventData === "object" &&
                Object.keys(eventData).length > 0
              ) {
                // Make sure we include the eventId in the data we pass to the parent
                if (eventData.eventId) {
                  console.log(
                    "AI tool created event with ID:",
                    eventData.eventId
                  );
                  // Pass the eventId to the parent component
                  onEventDataCollected(eventData);
                } else {
                  // No eventId in the data, just pass it as is
                  onEventDataCollected(eventData);
                }
              } else {
                console.error(
                  "Invalid event data received from tool call:",
                  eventData
                );
              }

              // If the eventData has an ID and we don't have an eventId yet, store it
              if (eventData.eventId && !createdEventId) {
                console.log("Setting createdEventId to:", eventData.eventId);
                setCreatedEventId(eventData.eventId);
              }

              // Extract voice parameters if available
              if (eventData.voicePreference) {
                setVoiceParams(eventData.voicePreference);
                onVoiceSelected?.(eventData.voicePreference);
              }
            }

            if (toolCall.toolName === "generate_script" && onScriptGenerated) {
              const scriptData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;
              setScriptData(scriptData);
              onScriptGenerated(scriptData);
            }
          });
        }

        // Try to extract data from content if no tool calls
        if (
          !message.toolInvocations &&
          eventContext?.contextType === "script-generation"
        ) {
          const content = message.content;
          // Look for JSON format in the response
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const scriptData = JSON.parse(jsonMatch[1]);
              setScriptData(scriptData);
              onScriptGenerated?.(scriptData);
            } catch (e) {
              console.error("Failed to parse script JSON:", e);
            }
          }
        }

        // Use either the provided eventId or the createdEventId
        const currentEventId = eventId || createdEventId;

        // Save the assistant message to database if we have an eventId
        if (currentEventId) {
          console.log(
            `Saving assistant message for event ${currentEventId}, message ID: ${message.id}`
          );

          saveChatMessage({
            eventId: currentEventId,
            messageId: message.id,
            role: "assistant",
            content: message.content,
            toolCalls: message.toolInvocations || undefined,
          })
            .then(() => {
              console.log(
                `Successfully saved assistant message for event ${currentEventId}`
              );
            })
            .catch((error) => {
              console.error(
                `Failed to save assistant message for event ${currentEventId}:`,
                error
              );
            });
        } else {
          console.warn(
            "No event ID available, assistant message not saved to database"
          );
        }
      } catch (e) {
        console.error("Error processing AI response:", e);
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

    try {
      // Use either the provided eventId or the createdEventId
      const currentEventId = eventId || createdEventId;

      // Save the user message to database if we have an eventId
      if (currentEventId && input.trim()) {
        // Generate a temporary ID for the message
        const messageId = `user-${Date.now()}`;

        console.log(
          `Saving user message for event ${currentEventId}, content: "${input.substring(
            0,
            30
          )}..."`
        );

        // Save the message to the database
        try {
          await saveChatMessage({
            eventId: currentEventId,
            messageId: messageId,
            role: "user",
            content: input,
          });
          console.log(
            `Successfully saved user message for event ${currentEventId}`
          );
        } catch (saveError) {
          console.error(
            `Failed to save user message for event ${currentEventId}:`,
            saveError
          );
          // Continue with submission even if saving fails
        }
      } else if (!currentEventId) {
        console.warn(
          "No event ID available, user message not saved to database"
        );
      }

      // Submit the message to the AI
      await handleSubmit(e);
    } catch (err) {
      console.error("Error submitting message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  // Update createdEventId whenever eventId prop changes
  useEffect(() => {
    if (eventId && !createdEventId) {
      setCreatedEventId(eventId);
    }
  }, [eventId, createdEventId]);

  // Save initial message to database if we have an eventId
  useEffect(() => {
    // Use either the provided eventId or the createdEventId
    const currentEventId = eventId || createdEventId;

    // Only run this once when we have both an event ID and an initial message
    if (currentEventId && initialMessage && !isLoadingHistory) {
      // We'll use a ref to track if we've already saved the initial message
      const hasInitialMessage = messages.some(
        (msg) =>
          msg.role === "assistant" &&
          (msg.id.startsWith("initial-message") ||
            msg.content === initialMessage)
      );

      if (hasInitialMessage) {
        console.log(`Saving initial message for event ${currentEventId}`);

        // Use a consistent ID for the initial message in the database
        // This ensures we don't create duplicate initial messages
        saveChatMessage({
          eventId: currentEventId,
          messageId: "initial-message-db", // Use a fixed ID for database storage
          role: "assistant",
          content: initialMessage,
        }).catch((error) => {
          console.error("Failed to save initial message:", error);
        });
      }
    }
  }, [eventId, createdEventId, initialMessage, isLoadingHistory]);

  // Handle selecting a previous message
  const handleSelectPreviousMessage = (message: string) => {
    // Set the input field to the selected message
    handleInputChange({
      target: { value: message },
    } as React.ChangeEvent<HTMLInputElement>);
    // Hide the previous conversations panel
    setShowPreviousConversations(false);
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

      // Make sure we have at least some data before calling the callback
      if (Object.keys(eventData).length > 0) {
        onEventDataCollected(eventData);
      } else {
        console.error("No event data could be extracted from conversation");
        return;
      }

      // Add a message to transition to script generation
      // Use a unique ID by adding a timestamp
      const uniqueTransitionId = `transition-message-${Date.now()}`;
      setMessages([
        ...messages,
        {
          id: uniqueTransitionId,
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

  // Generate SSML when script data changes
  useEffect(() => {
    if (scriptData && eventContext?.contextType === "script-generation") {
      try {
        const ssml = convertToSSML(scriptData);
        console.log("Generated SSML for TTS:", ssml);
        // You would typically send this SSML to your TTS API here
      } catch (e) {
        console.error("Failed to generate SSML:", e);
      }
    }
  }, [scriptData, eventContext?.contextType]);

  // Function to generate audio from the script
  const generateAudio = async () => {
    if (!scriptData) return;

    try {
      const ssml = convertToSSML(scriptData);

      // Example API call to a TTS service (implementation depends on your TTS provider)
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ssml,
          voiceParams,
          syncToken,
        }),
      });

      if (!response.ok) {
        throw new Error("TTS generation failed");
      }

      const audioData = await response.blob();

      // Create an audio element to play the generated speech
      const audioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);
      audio.play();

      // Clean up URL object after audio finishes playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Failed to generate TTS audio:", error);
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

  // Load chat history if an eventId is provided
  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;

    async function fetchChatHistory() {
      // Always try to load messages from the database first
      if (!eventId) {
        console.log("No eventId provided, skipping chat history load");
        return;
      }

      console.log(`Attempting to load chat history for event ${eventId}`);
      setIsLoadingHistory(true);

      try {
        // Use the loadEventChatHistory function directly
        const response = await loadEventChatHistory(eventId);

        // Only proceed if the component is still mounted
        if (!isMounted) {
          console.log("Component unmounted, skipping state update");
          return;
        }

        if (
          response.success &&
          response.messages &&
          response.messages.length > 0
        ) {
          console.log(
            `Successfully loaded ${response.messages.length} chat messages for event ${eventId}`
          );

          // Always use the messages from the database for the current event
          // This ensures we have the complete conversation history
          setMessages(response.messages);

          // Log the first few messages for debugging
          response.messages.slice(0, 3).forEach((msg, i) => {
            console.log(
              `Message ${i}: ${msg.role} - ${msg.content.substring(0, 50)}...`
            );
          });
        } else {
          console.log(
            `No chat history found for event ${eventId} or failed to load: ${
              response.error || "Unknown error"
            }`
          );

          // If we have no chat history, set the initial welcome message
          if (initialMessage) {
            console.log("Setting initial welcome message");
            const initialMsg = {
              id: `initial-message-${Date.now()}`,
              role: "assistant" as const,
              content: initialMessage,
              parts: [{ type: "text", text: initialMessage }],
            };
            setMessages([initialMsg]);

            // Also save this initial message to the database
            if (eventId) {
              console.log("Saving initial message to database");
              saveChatMessage({
                eventId,
                messageId: `initial-message-db-${Date.now()}`,
                role: "assistant",
                content: initialMessage,
              }).catch((e) =>
                console.error("Failed to save initial message:", e)
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);

        // Set initial message as fallback
        if (initialMessage && isMounted) {
          console.log("Setting initial message as fallback after error");
          setMessages([
            {
              id: `initial-message-${Date.now()}`,
              role: "assistant",
              content: initialMessage,
              parts: [{ type: "text", text: initialMessage }],
            },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    // Execute immediately to load chat history as soon as possible
    fetchChatHistory();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [eventId, initialMessage]); // Remove messages.length to prevent re-fetching when messages change

  // Sync chat messages to the database periodically or when component unmounts
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    let isMounted = true;

    // Function to sync all messages that might not be in the database
    const syncAllMessages = async () => {
      // Use either the provided eventId or the createdEventId
      const currentEventId = eventId || createdEventId;

      if (!currentEventId || messages.length === 0 || !isMounted) return;

      // Log sync operations for debugging
      console.log(
        `Syncing ${messages.length} messages for event ${currentEventId}`
      );

      // Filter and convert messages to the format expected by syncChatMessages
      const chatMessagesToSync = messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .filter((msg) => !msg.id.startsWith("initial-message")) // Skip any initial welcome messages
        .map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant", // Cast to the expected type
          content: msg.content,
          toolCalls: msg.toolInvocations || undefined,
        }));

      if (chatMessagesToSync.length > 0) {
        try {
          const result = await syncChatMessages(
            currentEventId,
            chatMessagesToSync
          );
          if (result.success && isMounted) {
            // Only log on successful sync
            console.log(
              `Successfully synced ${chatMessagesToSync.length} messages for event ${currentEventId}`
            );
          } else if (!result.success && isMounted) {
            console.error(
              `Failed to sync messages for event ${currentEventId}:`,
              result.error
            );
          }
        } catch (error) {
          if (isMounted) {
            console.error(
              `Error during message sync for event ${currentEventId}:`,
              error
            );
          }
        }
      }
    };

    // Set up periodic sync (every 30 seconds)
    const currentEventId = eventId || createdEventId;
    if (currentEventId) {
      // Initial sync with a small delay to avoid race conditions
      const initialSyncTimeout = setTimeout(() => {
        if (isMounted) {
          syncAllMessages();
        }
      }, 1000);

      // Periodic sync
      syncInterval = setInterval(() => {
        if (isMounted) {
          syncAllMessages();
        }
      }, 30000);

      // Cleanup function
      return () => {
        isMounted = false;
        clearTimeout(initialSyncTimeout);
        clearInterval(syncInterval);

        // Final sync attempt when component unmounts
        syncAllMessages().catch((e) =>
          console.error(`Final sync error for event ${currentEventId}:`, e)
        );
      };
    }

    return () => {
      isMounted = false;
    };
  }, [eventId, createdEventId, messages]); // Add messages to dependencies to ensure syncing when messages change

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
                  <div className="markdown-content w-full">
                    <div className="font-medium text-sm mb-1 flex justify-between items-center">
                      <span>{message.role === "user" ? "You" : "RhymeAI"}</span>

                      {/* Tool usage indicator */}
                      {message.toolInvocations &&
                        message.toolInvocations.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                                  <Wrench className="h-3 w-3" />
                                  <span>Tools used</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  {message.toolInvocations.map((tool) => (
                                    <div
                                      key={tool.toolCallId}
                                      className="flex items-center gap-1 mb-1"
                                    >
                                      <CircleCheck className="h-3 w-3 text-green-500" />
                                      <span>
                                        {tool.toolName.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                    </div>

                    {/* Message content */}
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

                    {/* Tool calls visualization */}
                    {message.toolInvocations &&
                      message.toolInvocations.length > 0 && (
                        <div className="mt-3 border-t border-muted-foreground/20 pt-2">
                          <div className="text-xs font-medium mb-1 text-muted-foreground">
                            Actions taken:
                          </div>
                          {message.toolInvocations.map((tool) => (
                            <div
                              key={tool.toolCallId}
                              className="mb-2 text-xs bg-background/50 rounded p-2"
                            >
                              <div className="flex items-center gap-1 mb-1 font-medium">
                                <Wrench className="h-3 w-3" />
                                <span className="capitalize">
                                  {tool.toolName.replace(/_/g, " ")}
                                </span>
                              </div>
                              {tool.state === "result" ? (
                                <div className="flex items-center gap-1 text-green-500">
                                  <CircleCheck className="h-3 w-3" />
                                  <span>Successfully processed</span>
                                </div>
                              ) : tool.state === "partial-call" ||
                                tool.state === "call" ? (
                                <div className="flex items-center gap-1 text-amber-500">
                                  <RotateCw className="h-3 w-3 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-500">
                                  <CircleDot className="h-3 w-3" />
                                  <span>
                                    Error:{" "}
                                    {typeof tool.args === "string"
                                      ? tool.args
                                      : tool.args
                                      ? JSON.stringify(tool.args)
                                      : "Unknown error"}
                                  </span>
                                </div>
                              )}
                              {/* Show a preview of the tool args if available */}
                              {tool.toolName === "store_event_data" && (
                                <div className="mt-1 overflow-hidden text-ellipsis">
                                  <div className="text-2xs text-muted-foreground">
                                    Event:{" "}
                                    {(() => {
                                      try {
                                        const eventData =
                                          typeof tool.args === "string"
                                            ? JSON.parse(tool.args)
                                            : tool.args;
                                        // Convert the event name to a string
                                        return typeof eventData?.eventName ===
                                          "string"
                                          ? eventData.eventName
                                          : "Not specified";
                                      } catch (e) {
                                        console.error(
                                          "Error parsing tool args:",
                                          e
                                        );
                                        return "Not specified";
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                              {tool.toolName === "generate_script" && (
                                <div className="mt-1 overflow-hidden text-ellipsis">
                                  <div className="text-2xs text-muted-foreground">
                                    Sections:{" "}
                                    {(() => {
                                      try {
                                        const eventData =
                                          typeof tool.args === "string"
                                            ? JSON.parse(tool.args)
                                            : tool.args;
                                        return eventData?.sections?.length || 0;
                                      } catch (e) {
                                        console.error(
                                          "Error parsing tool args:",
                                          e
                                        );
                                        return 0;
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Source attribution code remains the same */}
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

        <div className="p-4 border-t">
          {/* Previous conversations panel */}
          {showPreviousConversations && eventId && (
            <div className="mb-4">
              <PreviousConversations
                eventId={eventId}
                onSelectMessage={handleSelectPreviousMessage}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviousConversations(false)}
                className="mt-2 text-xs w-full"
              >
                Hide Previous Conversations
              </Button>
            </div>
          )}

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
            {eventId && !showPreviousConversations && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setShowPreviousConversations(true)}
                className="shrink-0"
                title="Show previous conversations"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90 shrink-0"
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
        <CardFooter className="flex justify-between border-t p-4 bg-primary/5">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 text-sm text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              <span>Information collection progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 ease-in-out",
                    progressPercentage === 100
                      ? "bg-green-500"
                      : progressPercentage > 50
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Object.values(collectedFields).filter(Boolean).length}/
                {eventContext.requiredFields.length} fields
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Show "Next Step" button if we have an eventId */}
            {eventId && onContinue && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onContinue}
                      className="gap-2"
                      size="sm"
                      variant="default"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Next Step
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Continue to the next step in event creation
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGenerateScript}
                    disabled={!isDataComplete}
                    className="gap-2"
                    size="sm"
                    variant={isDataComplete ? "default" : "outline"}
                  >
                    {isDataComplete ? (
                      <ArrowDownCircle className="h-4 w-4" />
                    ) : (
                      <ListChecks className="h-4 w-4" />
                    )}
                    {isDataComplete ? "Generate Script" : "Collecting Info..."}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isDataComplete
                    ? "All required information collected! Click to generate script."
                    : `Still need ${
                        eventContext.requiredFields.length -
                        Object.values(collectedFields).filter(Boolean).length
                      } more fields`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      )}

      {eventContext?.contextType === "script-generation" && scriptData && (
        <CardFooter className="flex justify-between border-t p-4 bg-primary/5">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>
                Script generated with{" "}
                {scriptData.sections?.length ||
                  scriptData.segments?.length ||
                  0}{" "}
                segments
              </span>
            </div>
          </div>

          <Button
            onClick={generateAudio}
            className="gap-2"
            size="sm"
            variant="default"
          >
            <Mic2 className="h-4 w-4" />
            Generate Audio
          </Button>
        </CardFooter>
      )}

      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-primary/90 text-primary-foreground shadow-md hover:bg-primary/100 rounded-full z-10 animate-bounce-subtle"
          size="icon"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </Card>
  );
}
