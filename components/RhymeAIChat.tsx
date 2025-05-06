"use client";

import { useEventData } from "@/hooks/useEventData";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { Card, CardContent } from "@/components/ui/card";
import { ChatFooter } from "./chat/ChatFooter";
import { ScrollToBottomButton } from "./chat/ScrollToBottomButton";
import { RhymeAIChatProps } from "@/types/chat";
import { useRef, useState, useEffect } from "react";
import { ScriptEditorPanel } from "./script/ScriptEditorPanel";
import { VoiceSettingsPanel } from "./voice/VoiceSettingsPanel";
import { useChat } from "@ai-sdk/react";

export function RhymeAIChat({
  title = "RhymeAI Assistant",
  description,
  initialMessage = "I'm your RhymeAI Assistant, ready to help collect all the information needed for your event's emcee script.",
  placeholder = "Tell me about your event...",
  className = "",
  eventId,
  chatSessionId,
  preserveChat = false,
  eventContext = {
    contextType: "event-creation",
    requiredFields: [
      "name",
      "date",
      "location",
      "type",
      "expectedAttendees",
      "description",
    ],
  },
  onEventDataCollected,
  onScriptGenerated,
  onVoiceSelected,
  onContinue,
  formRef,
}: RhymeAIChatProps & { formRef?: React.RefObject<HTMLFormElement> }) {
  // Create refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State for UI
  const [scriptData, setScriptData] = useState<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showPreviousConversations, setShowPreviousConversations] =
    useState(false);

  // Track active tool panels
  const [activeToolPanels, setActiveToolPanels] = useState<{
    scriptEditor?: {
      segmentId?: number;
      content?: string;
      toolCallId?: string;
    };
    voiceSettings?: {
      voiceId?: string;
      toolCallId?: string;
    };
    activeToolCall?: string;
  }>({});

  // Use the AI SDK's useChat hook for core chat functionality
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    setMessages,
    setInput,
    status,
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
    onFinish: (message) => {
      // If the API returns script data in the message data
      if (message.data?.scriptData) {
        setScriptData(message.data.scriptData);
      }
    },
  });

  // Track event data collection separately
  const {
    collectedFields,
    progressPercentage,
    isDataComplete,
    handleGenerateScript,
  } = useEventData({
    messages,
    eventContext,
    onEventDataCollected,
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

  // Initialize by fetching existing messages
  useEffect(() => {
    if (eventId) {
      fetchEventMessages();
    }
  }, [eventId]);

  // Fetch existing messages for an event
  const fetchEventMessages = async () => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/events/${eventId}/messages`);

      if (!response.ok) {
        throw new Error("Failed to fetch event messages");
      }

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }

      // Also fetch script data if available
      if (data.scriptData) {
        setScriptData(data.scriptData);
      }
    } catch (error) {
      console.error("Error fetching event messages:", error);
    }
  };

  // Monitor tool calls and update active panels
  useEffect(() => {
    if (!toolCalls || toolCalls.length === 0) return;

    // Check for script editing tool calls
    const scriptEditCall = toolCalls.find(
      (tool) => tool.toolName === "update_script_segment" && !tool.result
    );

    // Check for voice settings tool calls
    const voiceSettingsCall = toolCalls.find(
      (tool) => tool.toolName === "update_voice_settings" && !tool.result
    );

    // Update active panels based on tool calls
    if (scriptEditCall) {
      setActiveToolPanels((prev) => ({
        ...prev,
        scriptEditor: {
          segmentId: scriptEditCall.args?.segmentId,
          content: scriptEditCall.args?.content,
          toolCallId: scriptEditCall.toolCallId,
        },
        activeToolCall: scriptEditCall.toolCallId,
      }));
    } else if (voiceSettingsCall) {
      setActiveToolPanels((prev) => ({
        ...prev,
        voiceSettings: {
          voiceId: voiceSettingsCall.args?.voiceId,
          toolCallId: voiceSettingsCall.toolCallId,
        },
        activeToolCall: voiceSettingsCall.toolCallId,
      }));
    }
  }, [toolCalls]);

  // Handle script editor submit - use AI SDK's addToolResult
  const handleScriptEditorSubmit = (content: string) => {
    if (activeToolPanels.scriptEditor?.toolCallId) {
      // Use the AI SDK's addToolResult method
      addToolResult({
        toolCallId: activeToolPanels.scriptEditor.toolCallId,
        result: {
          success: true,
          content,
          segmentId: activeToolPanels.scriptEditor.segmentId,
        },
      });

      // Close the panel
      setActiveToolPanels((prev) => ({
        ...prev,
        scriptEditor: undefined,
        activeToolCall: undefined,
      }));

      // Notify parent if callback provided
      if (onScriptGenerated) {
        onScriptGenerated({
          segmentId: activeToolPanels.scriptEditor.segmentId,
          content,
        });
      }
    }
  };

  // Handle voice settings submit
  const handleVoiceSettingsSubmit = (settings: any) => {
    if (activeToolPanels.voiceSettings?.toolCallId) {
      // Use the AI SDK's addToolResult method
      addToolResult({
        toolCallId: activeToolPanels.voiceSettings.toolCallId,
        result: {
          success: true,
          settings,
        },
      });

      // Close the panel
      setActiveToolPanels((prev) => ({
        ...prev,
        voiceSettings: undefined,
        activeToolCall: undefined,
      }));

      // Notify parent if callback provided
      if (onVoiceSelected) {
        onVoiceSelected(settings);
      }
    }
  };

  // Cancel any active tool panels
  const handleCancelToolPanel = () => {
    if (activeToolPanels.activeToolCall) {
      // Use the AI SDK's addToolResult method
      addToolResult({
        toolCallId: activeToolPanels.activeToolCall,
        result: {
          success: false,
          error: "User cancelled the operation",
        },
      });
    }

    setActiveToolPanels({});
  };

  // Custom scroll handling function
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // Show scroll button if not at bottom
    setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Load more messages (pagination) - implement as needed
  const loadMoreMessages = async () => {
    console.log("Loading more messages for event:", eventId);
    // This would be implemented based on your pagination needs
  };

  // Handle selection of previous message
  const handleSelectPreviousMessage = (message: string) => {
    setInput(message);
    setShowPreviousConversations(false);
  };

  // Generate audio function
  const generateAudio = async (segmentId?: number) => {
    try {
      const response = await fetch(`/api/audio/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, segmentId }),
      });

      if (!response.ok) throw new Error("Failed to generate audio");

      const data = await response.json();
      if (data.scriptData) setScriptData(data.scriptData);

      return data;
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    // Scroll to bottom after submission
    setTimeout(scrollToBottom, 100);
    return Promise.resolve(); // Make this function return a Promise to match the expected type
  };

  // Use the provided formRef if available
  const internalFormRef = useRef<HTMLFormElement>(null);
  const actualFormRef = formRef || internalFormRef;

  return (
    <Card className={`w-full border shadow-md ${className}`}>
      <ChatHeader
        title={title}
        description={description}
        progressPercentage={progressPercentage}
        collectedFields={collectedFields}
        eventContext={eventContext}
      />

      <CardContent className="p-0">
        {/* Render active tool panels when needed */}
        {activeToolPanels.scriptEditor && (
          <ScriptEditorPanel
            initialContent={activeToolPanels.scriptEditor.content || ""}
            segmentId={activeToolPanels.scriptEditor.segmentId}
            onSubmit={handleScriptEditorSubmit}
            onCancel={handleCancelToolPanel}
          />
        )}

        {activeToolPanels.voiceSettings && (
          <VoiceSettingsPanel
            voiceId={activeToolPanels.voiceSettings.voiceId}
            onSubmit={handleVoiceSettingsSubmit}
            onCancel={handleCancelToolPanel}
          />
        )}

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error ? String(error) : null}
          messagesEndRef={messagesEndRef}
          chatContainerRef={chatContainerRef}
          initialMessage={initialMessage}
          handleScroll={handleScroll}
          loadMoreMessages={loadMoreMessages}
          hasMoreMessages={false} // Implement logic for pagination
          isLoadingHistory={false} // Implement logic for loading history
          eventId={eventId}
        />

        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleFormSubmit}
          placeholder={placeholder}
          isLoading={isLoading || !!activeToolPanels.activeToolCall}
          error={error ? String(error) : null}
          eventId={eventId}
          showPreviousConversations={showPreviousConversations}
          setShowPreviousConversations={setShowPreviousConversations}
          handleSelectPreviousMessage={handleSelectPreviousMessage}
          disabled={!!activeToolPanels.activeToolCall}
          formRef={actualFormRef}
        />
      </CardContent>

      <ChatFooter
        eventContext={eventContext}
        progressPercentage={progressPercentage}
        collectedFields={collectedFields}
        isDataComplete={isDataComplete}
        handleGenerateScript={handleGenerateScript}
        eventId={eventId?.toString()}
        onContinue={onContinue}
        scriptData={scriptData}
        generateAudio={generateAudio}
      />

      {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}
    </Card>
  );
}
