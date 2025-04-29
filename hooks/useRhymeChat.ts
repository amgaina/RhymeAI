"use client";

import { useChat } from "@ai-sdk/react";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  RefObject,
  UIEvent,
  FormEvent,
  ChangeEvent,
} from "react";
import { saveChatMessage } from "@/app/actions/chat/save";
import { loadEventChatHistory } from "@/app/actions/chat/load-event-chat";
import { syncChatMessages } from "@/app/actions/chat/sync";
import {
  UseRhymeChatProps,
  UseRhymeChatReturn,
  Message,
  ScriptData,
} from "@/types/chat";

/**
 * Custom hook for managing RhymeAI chat functionality
 */
export function useRhymeChat({
  eventId,
  chatSessionId,
  initialMessage,
  eventContext,
  preserveChat = false,
}: UseRhymeChatProps): UseRhymeChatReturn {
  // State management
  const [createdEventId, setCreatedEventId] = useState<
    string | number | undefined
  >(eventId);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [showPreviousConversations, setShowPreviousConversations] =
    useState<boolean>(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [voiceParams, setVoiceParams] = useState<any>(null); // Add proper typing if available

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Create a stable chat ID
  const chatId = useMemo(() => {
    if (chatSessionId) return chatSessionId;
    const currentEventId = eventId || createdEventId;
    return currentEventId
      ? `event-${currentEventId}`
      : `new-event-${Date.now()}`;
  }, [chatSessionId, eventId, createdEventId]);

  // Create stable initial message
  const initialChatMessage = useMemo(() => {
    if (initialMessage && !eventId) {
      return [
        {
          id: `initial-message-${Date.now()}`,
          role: "assistant" as const,
          content: initialMessage,
          parts: [{ type: "text" as const, text: initialMessage }],
        },
      ];
    }
    return undefined;
  }, [initialMessage, eventId]);

  // Create stable body object
  const chatBody = useMemo(() => ({ eventContext }), [eventContext]);

  // Response handler
  function handleChatResponse(response: Response): void {
    setError(null);
    if (!response.ok) {
      console.error(
        "API response not OK:",
        response.status,
        response.statusText
      );
      setError(`API error: ${response.status} ${response.statusText}`);
    }

    const token = response.headers.get("X-RhymeAI-Sync-Token");
    if (token) setSyncToken(token);
  }

  // Chat finish handler
  async function handleChatFinish(message: Message): Promise<void> {
    try {
      // Process tool calls with proper error handling
      await processToolCalls(message);

      // Save message to database
      const currentEventId = eventId || createdEventId;
      if (currentEventId) {
        await saveChatMessage({
          eventId: Number(currentEventId),
          messageId: message.id,
          role: "assistant",
          content: message.content,
          toolCalls: message.toolCalls || message.toolInvocations || undefined,
        });
      }
    } catch (e) {
      console.error("Error processing AI response:", e);
    }
  }

  // Error handler
  function handleChatError(err: Error): void {
    console.error("Chat API error:", err);

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

      // Add a recovery message
      const recoveryMessage: Message = {
        id: `recovery-${Date.now()}`,
        role: "assistant",
        content:
          "I encountered an issue processing your request. Let me try a simpler approach. What would you like to know?",
        parts: [
          {
            type: "text",
            text: "I encountered an issue processing your request. Let me try a simpler approach. What would you like to know?",
          },
        ],
      };

      setMessages((prev) => [...prev, recoveryMessage]);
      return; // Skip setting error
    }

    setError(errorMessage);
  }

  // Setup chat hook
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
    id: chatId,
    initialMessages: initialChatMessage,
    onResponse: handleChatResponse,
    onFinish: handleChatFinish,
    onError: handleChatError,
  });

  // Process tool calls
  async function processToolCalls(message: Message): Promise<void> {
    const toolCalls = message.toolCalls || message.toolInvocations;

    if (toolCalls?.length > 0) {
      await Promise.all(
        toolCalls.map(async (toolCall) => {
          const toolName = toolCall.toolName || toolCall.name || "unknown";

          if (toolName === "get_event_details") {
            try {
              const targetEventId =
                toolCall.args?.eventId || eventId || createdEventId;
              if (targetEventId) {
                const response = await fetch(`/api/events/${targetEventId}`);
                if (!response.ok)
                  throw new Error(`Failed to fetch event: ${response.status}`);

                const eventData = await response.json();
                if (eventData) {
                  const toolResponse = formatEventDetailsResponse(eventData);

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === message.id ? { ...msg, toolResponse } : msg
                    )
                  );
                }
              }
            } catch (error) {
              console.error("Error fetching event details:", error);
            }
          }

          return toolCall;
        })
      );
    }
  }

  // Format event details response
  function formatEventDetailsResponse(eventData: any): string {
    return `## Event Details for "${eventData.name}"
- **Type:** ${eventData.type || "Not specified"}
- **Date:** ${new Date(eventData.date).toLocaleDateString() || "Not specified"}
- **Location:** ${eventData.location || "Not specified"}
- **Expected Attendees:** ${eventData.expectedAttendees || "Not specified"}
- **Status:** ${eventData.status || "Not specified"}

### Description
${eventData.description || "No description available."}

${
  eventData.layout
    ? `This event has ${
        eventData.layout.segments?.length || 0
      } segments in its layout.`
    : "No layout has been created for this event yet."
}
${
  eventData.scriptSegments
    ? `This event has ${eventData.scriptSegments.length || 0} script segments.`
    : "No script has been created for this event yet."
}`;
  }

  // Convert script data to SSML for text-to-speech
  function convertToSSML(data: ScriptData): string {
    // Implement your SSML conversion logic here
    return `<speak>${data.title || "Script"}</speak>`;
  }

  // Scroll to bottom function
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll events
  const handleScroll = (e: UIEvent<HTMLDivElement>): void => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Custom submit handler
  const handleFormSubmit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError(null);

    try {
      const currentEventId = eventId || createdEventId;

      if (currentEventId && input.trim()) {
        const messageId = `user-${Date.now()}`;

        try {
          await saveChatMessage({
            eventId: Number(currentEventId),
            messageId,
            role: "user",
            content: input,
          });
        } catch (saveError) {
          console.error(`Failed to save user message:`, saveError);
        }
      }

      await handleSubmit(e);
    } catch (err) {
      console.error("Error submitting message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  // Handle selecting previous message
  const handleSelectPreviousMessage = (message: string): void => {
    handleInputChange({
      target: { value: message },
    } as ChangeEvent<HTMLInputElement>);
    setShowPreviousConversations(false);
  };

  // Generate audio function
  const generateAudio = async (): Promise<void> => {
    if (!scriptData) return;

    try {
      const ssml = convertToSSML(scriptData);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssml,
          voiceParams,
          syncToken,
        }),
      });

      if (!response.ok) throw new Error("TTS generation failed");

      const audioData = await response.blob();
      const audioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);

      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error("Failed to generate TTS audio:", error);
    }
  };

  // State for pagination
  const [page, setPage] = useState<number>(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const messageLimit = 10; // Limit to 10 messages per page

  // Load chat history with pagination
  useEffect(() => {
    let isMounted = true;

    async function fetchChatHistory() {
      if (!eventId) return;

      setIsLoadingHistory(true);

      try {
        // Load only the most recent messages (last 10 by default)
        const response = await loadEventChatHistory(
          Number(eventId),
          messageLimit,
          page
        );

        if (!isMounted) return;

        if (
          response.success &&
          response.messages &&
          response.messages.length > 0
        ) {
          // If this is the first page (most recent messages), replace the current messages
          // Otherwise, prepend the older messages to the existing ones
          if (page === 0) {
            setMessages(response.messages as any);
          } else {
            setMessages((prevMessages) => [
              ...(response.messages as any),
              ...prevMessages,
            ]);
          }

          // Update pagination state
          if (response.pagination) {
            setHasMoreMessages(response.pagination.hasMore);
            setTotalMessages(response.pagination.total);
          }
        } else if (initialMessage && page === 0) {
          // Only set initial message if we're on the first page and no messages were found
          const initialMsg: Message = {
            id: `initial-message-${Date.now()}`,
            role: "assistant",
            content: initialMessage,
            parts: [{ type: "text", text: initialMessage }],
          };

          setMessages([initialMsg]);

          if (eventId) {
            saveChatMessage({
              eventId: Number(eventId),
              messageId: `initial-message-db-${Date.now()}`,
              role: "assistant",
              content: initialMessage,
            }).catch((e) =>
              console.error("Failed to save initial message:", e)
            );
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);

        if (initialMessage && isMounted && page === 0) {
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

    fetchChatHistory();

    return () => {
      isMounted = false;
    };
  }, [eventId, initialMessage, setMessages, page]);

  // Function to load more messages (older messages)
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !isLoadingHistory) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [hasMoreMessages, isLoadingHistory]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update createdEventId when eventId changes
  useEffect(() => {
    if (eventId && !createdEventId) {
      setCreatedEventId(eventId);
    }
  }, [eventId, createdEventId]);

  // Sync chat messages
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    let isMounted = true;

    const syncAllMessages = async () => {
      const currentEventId = eventId || createdEventId;
      if (!currentEventId || messages.length === 0 || !isMounted) return;

      const chatMessagesToSync = messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .filter((msg) => !msg.id.startsWith("initial-message"))
        .map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant", // Ensure only user or assistant roles
          content: msg.content,
          toolCalls: msg.toolCalls || (msg as any).toolInvocations || undefined,
          parts: msg.parts
            ? msg.parts.map((part) => {
                if (part.type === "text") {
                  return { type: "text", text: part.text };
                }
                return { type: "text", text: "" };
              })
            : undefined,
        }));

      if (chatMessagesToSync.length > 0) {
        try {
          await syncChatMessages(Number(currentEventId), chatMessagesToSync);
        } catch (error) {
          if (isMounted) {
            console.error(`Error during message sync:`, error);
          }
        }
      }
    };

    const currentEventId = eventId || createdEventId;
    if (currentEventId) {
      const initialSyncTimeout = setTimeout(() => {
        if (isMounted) {
          syncAllMessages();
        }
      }, 1000);

      syncInterval = setInterval(() => {
        if (isMounted) {
          syncAllMessages();
        }
      }, 30000);

      return () => {
        isMounted = false;
        clearTimeout(initialSyncTimeout);
        clearInterval(syncInterval);
        syncAllMessages().catch((e) => console.error(`Final sync error:`, e));
      };
    }

    return () => {
      isMounted = false;
    };
  }, [eventId, createdEventId, messages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setError,
    showPreviousConversations,
    setShowPreviousConversations,
    handleSelectPreviousMessage,
    handleFormSubmit,
    scriptData,
    generateAudio,
    chatContainerRef,
    messagesEndRef,
    showScrollButton,
    scrollToBottom,
    handleScroll,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingHistory,
  };
}
