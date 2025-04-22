"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, ArrowDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TTSVoiceParams } from "@/lib/tts-utils";
import { saveChatMessage } from "@/app/actions/chat/save";
import { loadChatHistory, syncChatMessages } from "@/app/actions/chat/sync";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatProgress } from "./ChatProgress";
import { ChatScriptEditor } from "./ChatScriptEditor";
import { ChatLayoutEditor } from "./ChatLayoutEditor";
import { ChatAudioPlayer } from "./ChatAudioPlayer";
import { cn } from "@/lib/utils";

export interface ChatInterfaceProps {
  title?: string;
  description?: string;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  eventId?: number;
  eventContext?: {
    purpose: string;
    requiredFields: string[];
    contextType:
      | "event-creation"
      | "event-layout"
      | "script-generation"
      | "audio-generation"
      | "presentation";
    additionalInfo?: Record<string, any>;
  };
  onEventDataCollected?: (data: any) => void;
  onLayoutGenerated?: (layout: any) => void;
  onScriptGenerated?: (script: any) => void;
  onVoiceSelected?: (voiceParams: TTSVoiceParams) => void;
  onAudioGenerated?: (audioUrl: string, segmentId: string) => void;
}

export function ChatInterface({
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script.",
  placeholder = "Tell me about your event...",
  className = "",
  eventId,
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
  onLayoutGenerated,
  onScriptGenerated,
  onVoiceSelected,
  onAudioGenerated,
}: ChatInterfaceProps) {
  // State management
  // Initialize collectedFields with all required fields set to false
  const [collectedFields, setCollectedFields] = useState<
    Record<string, boolean>
  >(() => {
    const fields: Record<string, boolean> = {};
    if (eventContext?.requiredFields) {
      eventContext.requiredFields.forEach((field) => {
        fields[field] = false;
      });
    }
    return fields;
  });
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [voiceParams, setVoiceParams] = useState<Partial<TTSVoiceParams>>({});
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<number | undefined>(
    eventId
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "layout" | "script">(
    "chat"
  );
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [currentContextType, setCurrentContextType] = useState<string>(
    eventContext?.contextType || "event-creation"
  );

  // Chat hook
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
      eventContext: {
        ...eventContext,
        contextType: currentContextType,
      },
      eventId: createdEventId,
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

      // Extract sync token from response headers for component coordination
      const token = response.headers.get("X-RhymeAI-Sync-Token");
      if (token) {
        setSyncToken(token);
      }
    },
    onFinish: (message) => {
      // Process the completed message to extract fields
      if (
        message.content &&
        typeof message.content === "string" &&
        !processedMessagesRef.current.has(message.id)
      ) {
        extractFieldInfo(message.content);
        processedMessagesRef.current.add(message.id);
      }

      // Also process all previous messages to ensure we've captured all fields
      // This helps when reloading the chat or when fields are mentioned in earlier messages
      if (currentContextType === "event-creation") {
        messages.forEach((msg) => {
          if (msg.content && typeof msg.content === "string") {
            extractFieldInfo(msg.content);
          }
        });
      }

      // Try to parse tool calls from the message
      try {
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          message.toolInvocations.forEach((toolCall) => {
            // Handle event data collection
            if (
              toolCall.toolName === "storeEventDataTool" &&
              onEventDataCollected
            ) {
              const eventData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;
              onEventDataCollected(eventData);

              // If the eventData has an ID and we don't have an eventId yet, store it
              if (eventData.eventId && !createdEventId) {
                setCreatedEventId(eventData.eventId);
              }

              // Extract voice parameters if available
              if (eventData.voicePreference) {
                setVoiceParams(eventData.voicePreference);
                onVoiceSelected?.(eventData.voicePreference);
              }

              // Mark all fields in the event data as collected
              const newCollectedFields = { ...collectedFields };
              if (eventData.eventName) newCollectedFields.eventName = true;
              if (eventData.eventType) newCollectedFields.eventType = true;
              if (eventData.eventDate) newCollectedFields.eventDate = true;
              if (eventData.eventLocation)
                newCollectedFields.eventLocation = true;
              if (eventData.audienceSize)
                newCollectedFields.expectedAttendees = true;
              if (eventData.eventDescription)
                newCollectedFields.eventDescription = true;
              if (eventData.voicePreference)
                newCollectedFields.voicePreferences = true;
              if (eventData.language)
                newCollectedFields.languagePreferences = true;

              setCollectedFields(newCollectedFields);
              console.log("Updated fields from tool call:", newCollectedFields);
            }

            // Handle layout generation
            if (
              toolCall.toolName === "generateEventLayoutTool" &&
              onLayoutGenerated
            ) {
              const layoutData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;
              setLayoutData(layoutData);
              onLayoutGenerated(layoutData);
              // Switch to layout view when layout is generated
              setActiveView("layout");
            }

            // Handle script generation
            if (
              (toolCall.toolName === "generateScriptTool" ||
                toolCall.toolName === "generateScriptFromLayoutTool") &&
              onScriptGenerated
            ) {
              const scriptData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;
              setScriptData(scriptData);
              onScriptGenerated(scriptData);
              // Switch to script view when script is generated
              setActiveView("script");
            }

            // Handle audio generation
            if (toolCall.toolName === "generateAudioTool" && onAudioGenerated) {
              const audioData =
                typeof toolCall.args === "string"
                  ? JSON.parse(toolCall.args)
                  : toolCall.args;
              if (audioData.audioUrl && audioData.segmentId) {
                setAudioUrls((prev) => ({
                  ...prev,
                  [audioData.segmentId]: audioData.audioUrl,
                }));
                onAudioGenerated(audioData.audioUrl, audioData.segmentId);
              }
            }
          });
        }

        // Save the assistant message to database if we have an eventId
        if (createdEventId) {
          saveChatMessage({
            eventId: createdEventId,
            messageId: message.id,
            role: "assistant",
            content: message.content,
            toolCalls: message.toolInvocations || undefined,
          });
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

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const previousCollectedFieldsRef =
    useRef<Record<string, boolean>>(collectedFields);
  const previousContextTypeRef = useRef<string>(currentContextType);
  const contentRef = useRef<string>("");
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

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

  // Extract field information from messages
  const extractFieldInfo = useCallback(
    (content: string | any) => {
      // Skip if content is not a string
      if (typeof content !== "string") return;

      // Use functional update pattern to avoid dependency cycle
      setCollectedFields((prevFields) => {
        // Skip update if content hasn't changed to avoid loops
        if (contentRef.current === content) {
          return prevFields;
        }

        // Create a new object with the current collected fields
        const newCollectedFields = { ...prevFields };

        // Store current content in ref to prevent repeated processing
        contentRef.current = content;

        // Create regex patterns for each required field
        const fieldPatterns =
          eventContext?.requiredFields?.map((field) => {
            // Convert camelCase to normal text for matching
            const fieldText = field.replace(/([A-Z])/g, " $1").toLowerCase();
            return {
              field,
              regex: new RegExp(`${fieldText}[:\\s]+(.*?)(?=\\n|$)`, "i"),
              altRegex: new RegExp(
                `${field.toLowerCase()}[:\\s]+(.*?)(?=\\n|$)`,
                "i"
              ),
            };
          }) || [];

        // Check each field pattern against the content
        fieldPatterns.forEach(({ field, regex, altRegex }) => {
          // Check if the content contains the field name (with spaces or as is)
          const fieldText = field.replace(/([A-Z])/g, " $1").toLowerCase();

          // Create common variations of field names
          const variations = [
            fieldText,
            field.toLowerCase(),
            fieldText.replace(/\s+/g, ""),
            field === "eventName" ? "name" : "",
            field === "eventType" ? "type" : "",
            field === "eventDate" ? "date" : "",
            field === "eventLocation" ? "location" : "",
            field === "expectedAttendees" ? "attendees" : "",
            field === "eventDescription" ? "description" : "",
            field === "voicePreferences" ? "voice" : "",
            field === "languagePreferences" ? "language" : "",
          ].filter(Boolean);

          // Check for any variation in the content
          const foundVariation = variations.some((variation) =>
            content.toLowerCase().includes(variation)
          );

          if (foundVariation) {
            newCollectedFields[field] = true;
          }

          // Also check for specific patterns
          const match = regex.exec(content) || altRegex.exec(content);
          if (match && match[1] && match[1].trim()) {
            newCollectedFields[field] = true;
          }

          // Additional patterns for common field formats
          const commonPatterns = [
            new RegExp(`name[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`type[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`date[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`location[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`attendees[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`description[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`voice[:\s]+(.*?)(?=\\n|$)`, "i"),
            new RegExp(`language[:\s]+(.*?)(?=\\n|$)`, "i"),
          ];

          // Map patterns to field names
          const patternFieldMap = {
            0: "eventName",
            1: "eventType",
            2: "eventDate",
            3: "eventLocation",
            4: "expectedAttendees",
            5: "eventDescription",
            6: "voicePreferences",
            7: "languagePreferences",
          };

          // Check each common pattern
          commonPatterns.forEach((pattern, index) => {
            const commonMatch = pattern.exec(content);
            if (commonMatch && commonMatch[1] && commonMatch[1].trim()) {
              const mappedField =
                patternFieldMap[index as keyof typeof patternFieldMap];
              newCollectedFields[mappedField] = true;
            }
          });
        });

        // Only return new fields if they're different from prev
        if (JSON.stringify(newCollectedFields) !== JSON.stringify(prevFields)) {
          return newCollectedFields;
        }
        return prevFields;
      });
    },
    [eventContext?.requiredFields] // Remove collectedFields from dependencies
  );

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();

    // Process all messages to extract fields when messages change
    if (currentContextType === "event-creation" && messages.length > 0) {
      messages.forEach((msg) => {
        if (msg.content && typeof msg.content === "string") {
          // Only process messages we haven't processed yet
          if (!processedMessagesRef.current.has(msg.id)) {
            extractFieldInfo(msg.content);
            processedMessagesRef.current.add(msg.id);
          }
        }
      });
    }
  }, [messages.length, currentContextType, extractFieldInfo]);

  // Process all messages on initial mount and initialize fields
  useEffect(() => {
    // Only initialize once per context type change
    if (currentContextType === "event-creation" && !initializedRef.current) {
      initializedRef.current = true;

      // Force update the collected fields to ensure they're properly initialized
      const initialFields: Record<string, boolean> = {};
      if (eventContext?.requiredFields) {
        eventContext.requiredFields.forEach((field) => {
          initialFields[field] = false;
        });
      }
      setCollectedFields(initialFields);

      // Process messages if available
      if (messages.length > 0) {
        processedMessagesRef.current.clear(); // Reset processed message tracking
        messages.forEach((msg) => {
          if (msg.content && typeof msg.content === "string") {
            extractFieldInfo(msg.content);
            processedMessagesRef.current.add(msg.id);
          }
        });
      }
    }
  }, [currentContextType, extractFieldInfo, eventContext?.requiredFields]);

  // Track collected information
  useEffect(() => {
    const prevCollectedFields = previousCollectedFieldsRef.current;
    const allRequiredFields = eventContext?.requiredFields || [];
    const requiredFieldsCollected = allRequiredFields.every(
      (field) => collectedFields[field]
    );

    if (
      JSON.stringify(prevCollectedFields) !== JSON.stringify(collectedFields)
    ) {
      setIsDataComplete(
        requiredFieldsCollected && allRequiredFields.length > 0
      );
      previousCollectedFieldsRef.current = collectedFields;

      // Log the current state of all fields for debugging
      console.log("Required fields:", allRequiredFields);
      console.log("Collected fields:", collectedFields);
      console.log(
        "Is data complete:",
        requiredFieldsCollected && allRequiredFields.length > 0
      );
    }
  }, [collectedFields, eventContext?.requiredFields]);

  // Custom submit handler with error handling and retry logic
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any existing errors

    try {
      // Save the user message to database if we have an eventId
      if (createdEventId && input.trim()) {
        // Generate a temporary ID for the message
        const messageId = `user-${Date.now()}`;

        // Save the message to the database
        await saveChatMessage({
          eventId: createdEventId,
          messageId: messageId,
          role: "user",
          content: input,
        });
      }

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

  // Update currentContextType whenever eventContext prop changes
  useEffect(() => {
    const prevContextType = previousContextTypeRef.current;

    if (
      eventContext?.contextType &&
      prevContextType !== eventContext.contextType
    ) {
      setCurrentContextType(eventContext.contextType);
      previousContextTypeRef.current = eventContext.contextType;

      // If switching to event-creation context, process all messages to extract fields
      if (
        eventContext.contextType === "event-creation" &&
        messages.length > 0
      ) {
        messages.forEach((msg) => {
          if (msg.content && typeof msg.content === "string") {
            extractFieldInfo(msg.content);
          }
        });
      }
    }
  }, [eventContext?.contextType, messages, extractFieldInfo]);

  // Save initial message to database if we have an eventId
  useEffect(() => {
    if (createdEventId && initialMessage && messages.length === 1) {
      saveChatMessage({
        eventId: createdEventId,
        messageId: messages[0].id,
        role: "assistant",
        content: initialMessage,
      });
    }
  }, [createdEventId, initialMessage, messages]);

  // Load chat history if an eventId is provided
  useEffect(() => {
    async function fetchChatHistory() {
      if (eventId) {
        setIsLoadingHistory(true);
        try {
          const response = await loadChatHistory(eventId);
          if (response.success && response.messages.length > 0) {
            // Only set messages if we got a successful response with messages
            setMessages(response.messages);
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
        } finally {
          setIsLoadingHistory(false);
        }
      }
    }

    fetchChatHistory();
  }, [eventId, setMessages]);

  // Sync chat messages to the database periodically or when component unmounts
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;

    // Function to sync all messages that might not be in the database
    const syncAllMessages = async () => {
      if (createdEventId && messages.length > 0) {
        // Filter and convert messages to the format expected by syncChatMessages
        const chatMessagesToSync = messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            toolCalls: msg.toolInvocations || undefined,
          }));

        await syncChatMessages(createdEventId, chatMessagesToSync);
      }
    };

    // Set up periodic sync (every 30 seconds)
    if (createdEventId) {
      syncInterval = setInterval(syncAllMessages, 30000);
    }

    // Sync when component unmounts
    return () => {
      clearInterval(syncInterval);
      syncAllMessages();
    };
  }, [createdEventId, messages]);

  // Calculate progress percentage
  const progressPercentage = eventContext?.requiredFields?.length
    ? Math.round(
        (Object.values(collectedFields).filter(Boolean).length /
          eventContext.requiredFields.length) *
          100
      )
    : 0;

  // Generate script when all data is collected
  const handleGenerateScript = () => {
    if (isDataComplete) {
      // Change context type to event-layout
      setCurrentContextType("event-layout");

      // Add a message to transition to script generation
      const uniqueTransitionId = `transition-message-${Date.now()}`;
      setMessages([
        ...messages,
        {
          id: uniqueTransitionId,
          role: "assistant",
          content:
            "Great! I've collected all the necessary information. Now let's create an event layout and script.",
          parts: [
            {
              type: "text",
              text: "Great! I've collected all the necessary information. Now let's create an event layout and script.",
            },
          ],
        },
      ]);

      // Send a message to generate the layout
      const generateLayoutMessage =
        "Please generate an event layout based on the information I've provided.";
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: generateLayoutMessage,
          parts: [{ type: "text", text: generateLayoutMessage }],
        },
      ]);

      // The context type has been updated via state, which will be used in the next API call

      // Submit the message programmatically
      const event = new Event("submit", { cancelable: true, bubbles: true });
      handleSubmit(event as any);
    }
  };

  // Switch between views (chat, layout, script)
  const switchView = (view: "chat" | "layout" | "script") => {
    setActiveView(view);
  };

  return (
    <Card className={`w-full border shadow-md ${className}`}>
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}

        {/* View switcher tabs */}
        {(layoutData || scriptData) && (
          <div className="flex space-x-1 mt-4 border-b">
            <Button
              variant={activeView === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => switchView("chat")}
              className="rounded-b-none"
            >
              Chat
            </Button>
            {layoutData && (
              <Button
                variant={activeView === "layout" ? "default" : "ghost"}
                size="sm"
                onClick={() => switchView("layout")}
                className="rounded-b-none"
              >
                Layout
              </Button>
            )}
            {scriptData && (
              <Button
                variant={activeView === "script" ? "default" : "ghost"}
                size="sm"
                onClick={() => switchView("script")}
                className="rounded-b-none"
              >
                Script
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Chat View */}
        {activeView === "chat" && (
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
                <ChatMessage
                  key={message.id}
                  message={message}
                  eventId={createdEventId}
                />
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
                  <div className="h-5 w-5 animate-spin text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    RhymeAI is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Layout Editor View */}
        {activeView === "layout" && layoutData && (
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4">
            <ChatLayoutEditor
              layout={layoutData}
              eventId={createdEventId}
              onLayoutUpdated={(updatedLayout) => setLayoutData(updatedLayout)}
              onGenerateScript={() => {
                // Change context type to script-generation
                setCurrentContextType("script-generation");

                // Send a message to generate the script from layout
                const generateScriptMessage =
                  "Please generate a script based on this layout.";
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `user-${Date.now()}`,
                    role: "user",
                    content: generateScriptMessage,
                    parts: [{ type: "text", text: generateScriptMessage }],
                  },
                ]);

                // Switch back to chat view
                setActiveView("chat");

                // Submit the message programmatically
                const event = new Event("submit", {
                  cancelable: true,
                  bubbles: true,
                });
                handleSubmit(event as any);
              }}
            />
          </div>
        )}

        {/* Script Editor View */}
        {activeView === "script" && scriptData && (
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4">
            <ChatScriptEditor
              script={scriptData}
              eventId={createdEventId}
              audioUrls={audioUrls}
              onScriptUpdated={(updatedScript) => setScriptData(updatedScript)}
              onGenerateAudio={(segmentId) => {
                // Change context type to audio-generation
                setCurrentContextType("audio-generation");

                // Send a message to generate audio for this segment
                const generateAudioMessage = `Please generate audio for script segment ${segmentId}.`;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `user-${Date.now()}`,
                    role: "user",
                    content: generateAudioMessage,
                    parts: [{ type: "text", text: generateAudioMessage }],
                  },
                ]);

                // Switch back to chat view
                setActiveView("chat");

                // Submit the message programmatically
                const event = new Event("submit", {
                  cancelable: true,
                  bubbles: true,
                });
                handleSubmit(event as any);
              }}
            />
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading}
            placeholder={placeholder}
            error={error}
          />
        </div>
      </CardContent>

      {/* Progress Footer for Event Creation */}
      {eventContext?.contextType === "event-creation" && (
        <CardFooter className="flex justify-between border-t p-4 bg-primary/5">
          <ChatProgress
            progressPercentage={progressPercentage}
            collectedFields={collectedFields}
            requiredFields={eventContext.requiredFields}
            isDataComplete={isDataComplete}
            onGenerateScript={handleGenerateScript}
          />

          {/* Debug buttons - only visible in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Manual field extraction triggered");
                  messages.forEach((msg) => {
                    if (msg.content && typeof msg.content === "string") {
                      extractFieldInfo(msg.content);
                    }
                  });
                }}
              >
                Refresh Fields
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force all fields to be marked as collected (for testing)
                  const allFields: Record<string, boolean> = {};
                  if (eventContext?.requiredFields) {
                    eventContext.requiredFields.forEach((field) => {
                      allFields[field] = true;
                    });
                  }
                  setCollectedFields(allFields);
                  console.log("All fields marked as collected:", allFields);
                }}
              >
                Mark All Complete
              </Button>
            </div>
          )}
        </CardFooter>
      )}

      {/* Audio Player Footer for Script Generation */}
      {eventContext?.contextType === "script-generation" && scriptData && (
        <CardFooter className="flex justify-between border-t p-4 bg-primary/5">
          <ChatAudioPlayer
            scriptData={scriptData}
            audioUrls={audioUrls}
            onGenerateAudio={(segmentId) => {
              // Change context type to audio-generation
              setCurrentContextType("audio-generation");

              // Send a message to generate audio for this segment
              const generateAudioMessage = `Please generate audio for script segment ${segmentId}.`;
              setMessages((prev) => [
                ...prev,
                {
                  id: `user-${Date.now()}`,
                  role: "user",
                  content: generateAudioMessage,
                  parts: [{ type: "text", text: generateAudioMessage }],
                },
              ]);

              // Submit the message programmatically
              const event = new Event("submit", {
                cancelable: true,
                bubbles: true,
              });
              handleSubmit(event as any);
            }}
          />
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
