"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@ai-sdk/react";

interface UseRhymeChatProps {
  eventId?: string | number;
  chatSessionId?: string;
  initialMessage?: string;
  eventContext: any;
  preserveChat?: boolean;
}

/**
 * Custom hook for RhymeAI chat functionality built on top of the AI SDK's useChat
 */
export function useRhymeChat({
  eventId,
  chatSessionId,
  initialMessage,
  eventContext,
  preserveChat = false,
}: UseRhymeChatProps) {
  const { toast } = useToast();

  // Script data state (not managed by useChat)
  const [scriptData, setScriptData] = useState<any>(null);

  // Pagination and history
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPreviousConversations, setShowPreviousConversations] =
    useState(false);

  // Refs for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Use the AI SDK's useChat hook for core chat functionality
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading,
    error,
    append,
    reload,
    setMessages,
    setInput,
    data,
    addToolResult,
  } = useChat({
    api: "/api/chat", // Your chat API endpoint
    id: chatSessionId || `event-${eventId}-${Date.now()}`,
    initialMessages: initialMessage
      ? [{ id: "welcome", role: "assistant", content: initialMessage }]
      : [],
    body: {
      eventId,
      eventContext,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {
      // Extract script data if available in the message data
      if (message.data?.scriptData) {
        setScriptData(message.data.scriptData);
      }
    },
  });

  // Extract tool calls from messages
  const toolCalls = messages.flatMap((message) =>
    message.role === "assistant" && message.toolCalls
      ? message.toolCalls.map((tool) => ({
          ...tool,
          messageId: message.id,
        }))
      : []
  );

  // Initialize chat by fetching existing messages
  useEffect(() => {
    if (eventId) {
      fetchEventMessages();
    }
  }, [eventId]);

  // Fetch existing messages for an event
  const fetchEventMessages = async () => {
    if (!eventId) return;

    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/events/${eventId}/messages`);

      if (!response.ok) {
        throw new Error("Failed to fetch event messages");
      }

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages as any);
        setHasMoreMessages(data.hasMore || false);
      }

      // Also fetch script data if available
      if (data.scriptData) {
        setScriptData(data.scriptData);
      }
    } catch (error) {
      console.error("Error fetching event messages:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    aiHandleSubmit(e);
    // After submission, scroll to bottom
    setTimeout(scrollToBottom, 100);
  };

  // Custom submit handler with error recovery
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    try {
      await aiHandleSubmit();
      // After submission, scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle selection of previous message
  const handleSelectPreviousMessage = (message: string) => {
    setInput(message);
    setShowPreviousConversations(false);
  };

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef]);

  // Handle scroll events
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!chatContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;

      // Show scroll button if not at bottom
      setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);

      // Load more messages if scrolled to top
      if (scrollTop === 0 && hasMoreMessages && !isLoadingHistory) {
        loadMoreMessages();
      }
    },
    [hasMoreMessages, isLoadingHistory]
  );

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!eventId || !hasMoreMessages || isLoadingHistory) return;

    try {
      setIsLoadingHistory(true);

      // Get the oldest message ID for pagination
      const oldestMessageId = messages.length > 0 ? messages[0].id : null;

      const response = await fetch(
        `/api/events/${eventId}/messages?before=${oldestMessageId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load more messages");
      }

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast({
        title: "Error",
        description: "Failed to load more messages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Generate audio for script segments
  const generateAudio = async (segmentId?: number) => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/audio/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          segmentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const data = await response.json();

      toast({
        title: "Audio Generation",
        description: segmentId
          ? `Audio generated for segment #${segmentId}`
          : "Audio generation started for all segments",
      });

      // Update script data with new audio URLs
      if (data.scriptData) {
        setScriptData(data.scriptData);
      }

      return data;
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Audio Generation Failed",
        description: "Could not generate audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle tool response
  const handleToolResponse = async (toolCallId: string, response: any) => {
    // Use the AI SDK's addToolResult method
    addToolResult({
      toolCallId,
      result: response,
    });

    // Scroll to bottom after tool response is processed
    setTimeout(scrollToBottom, 100);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: error ? String(error) : null,
    setError: (errorMsg: string | null) => {
      // This is a stub - AI SDK doesn't expose setError directly
      console.error("Error set:", errorMsg);
    },
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
    toolCalls,
    handleToolResponse,
  };
}
