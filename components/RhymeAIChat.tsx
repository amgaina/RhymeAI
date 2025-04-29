"use client";

import { useRhymeChat } from "@/hooks/useRhymeChat";
import { useEventData } from "@/hooks/useEventData";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";
import { Card, CardContent } from "@/components/ui/card";
import { ChatFooter } from "./chat/ChatFooter";
import { ScrollToBottomButton } from "./chat/ScrollToBottomButton";
import { RhymeAIChatProps } from "@/types/chat";
import { useRef, FormEvent } from "react";

/**
 * RhymeAIChat - Intelligent chat interface for collecting event information and generating scripts
 *
 * @param title - The title displayed in the chat header
 * @param description - Optional description text shown under the title
 * @param initialMessage - Initial AI message shown when chat starts
 * @param placeholder - Placeholder text for the chat input
 * @param className - Additional CSS classes for styling
 * @param eventId - Optional ID of an existing event
 * @param chatSessionId - Optional ID to maintain chat state across sessions
 * @param preserveChat - Whether to preserve chat history when unmounting
 * @param eventContext - Context information for the chat (fields needed, purpose, etc.)
 * @param onEventDataCollected - Callback fired when all required event data is collected
 * @param onScriptGenerated - Callback fired when a script is generated
 * @param onVoiceSelected - Callback fired when a voice is selected for the script
 * @param onContinue - Optional callback for continuing to the next step
 */
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
}: RhymeAIChatProps) {
  // Create properly typed refs - specify they're definitely HTMLDivElement refs
  const localMessagesEndRef = useRef<HTMLDivElement>(null);
  const localChatContainerRef = useRef<HTMLDivElement>(null);

  // Use custom hooks to separate concerns
  const {
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
  } = useRhymeChat({
    eventId,
    chatSessionId,
    initialMessage,
    eventContext,
    preserveChat,
  });

  // Use the provided refs or fallback to local refs
  const finalMessagesEndRef = messagesEndRef || localMessagesEndRef;
  const finalChatContainerRef = chatContainerRef || localChatContainerRef;

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
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          messagesEndRef={finalMessagesEndRef}
          chatContainerRef={finalChatContainerRef}
          initialMessage={initialMessage}
          handleScroll={handleScroll}
          loadMoreMessages={loadMoreMessages}
          hasMoreMessages={hasMoreMessages}
          isLoadingHistory={isLoadingHistory}
        />

        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleFormSubmit}
          placeholder={placeholder}
          isLoading={isLoading}
          error={error}
          eventId={eventId}
          showPreviousConversations={showPreviousConversations}
          setShowPreviousConversations={setShowPreviousConversations}
          handleSelectPreviousMessage={handleSelectPreviousMessage}
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
