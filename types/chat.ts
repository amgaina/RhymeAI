import { ReactNode, RefObject, ChangeEvent, FormEvent, UIEvent } from "react";

// Message part types
export interface TextMessagePart {
  type: "text";
  text: string;
}

export interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
}

export interface ToolInvocationPart {
  type: "tool-invocation";
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    args: any;
    state: "partial-call" | "call" | "result";
    result?: any;
  };
}

export interface SourcePart {
  type: "source";
  source: {
    id: string;
    url: string;
    title?: string;
    sourceType: string;
  };
}

export interface FilePart {
  type: "file";
  file: {
    name: string;
    url: string;
    type: string;
    size?: number;
  };
}

export interface StepStartPart {
  type: "step-start";
}

export type MessagePart =
  | TextMessagePart
  | ReasoningPart
  | ToolInvocationPart
  | SourcePart
  | StepStartPart
  | FilePart;

// Tool call interfaces
export interface ToolCall {
  toolCallId?: string;
  id?: string;
  toolName?: string;
  name?: string;
  args?: any;
  arguments?: any;
  state?: string;
  result?: any;
}

// Message interface
export interface Message {
  id: string;
  role: "assistant" | "user" | "system" | "data";
  content: string;
  createdAt?: Date;
  parts?: MessagePart[];
  toolCalls?: ToolCall[];
  toolInvocations?: ToolCall[];
  toolResponse?: string;
}

// Event data type
export interface EventData {
  name?: string;
  date?: string;
  location?: string;
  type?: string;
  expectedAttendees?: string | number;
  description?: string;
  speakers?: string[];
  schedule?: {
    startTime?: string;
    endTime?: string;
    items?: Array<{
      title: string;
      duration?: string;
      speaker?: string;
      description?: string;
    }>;
  };
  [key: string]: any;
}

// Script data type
export interface ScriptData {
  title?: string;
  segments?: Array<{
    id: string;
    type: string;
    content: string;
    duration?: string;
    notes?: string;
  }>;
  totalDuration?: string;
  [key: string]: any;
}

// Voice data type
export interface VoiceData {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  previewUrl?: string;
  [key: string]: any;
}

// Event context type
export interface EventContext {
  contextType?:
    | "event-creation"
    | "event-assistance"
    | "general-assistant"
    | string;
  requiredFields?: string[];
  purpose?: string;
  additionalInfo?: Record<string, any>;
  [key: string]: any;
}

// Hook input types
export interface UseRhymeChatProps {
  eventId?: string | number;
  chatSessionId?: string;
  initialMessage?: string;
  eventContext?: EventContext;
  preserveChat?: boolean;
}

export interface UseEventDataProps {
  messages: Message[];
  eventContext?: EventContext;
  onEventDataCollected?: (data: EventData) => void;
}

// Hook return types
export interface UseRhymeChatReturn {
  messages: Message[];
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  showPreviousConversations: boolean;
  setShowPreviousConversations: (show: boolean) => void;
  handleSelectPreviousMessage: (message: string) => void;
  handleFormSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  scriptData: ScriptData | null;
  generateAudio: () => Promise<void>;
  chatContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  isLoadingHistory: boolean;
}

export interface UseEventDataReturn {
  collectedFields: Record<string, boolean>;
  isDataComplete: boolean;
  progressPercentage: number;
  handleGenerateScript: () => void;
}

// Component prop types
export interface RhymeAIChatProps {
  title?: string;
  description?: ReactNode;
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  eventId?: string | number;
  chatSessionId?: string;
  preserveChat?: boolean;
  eventContext?: EventContext;
  onEventDataCollected?: (data: EventData) => void;
  onScriptGenerated?: (data: ScriptData) => void;
  onVoiceSelected?: (data: VoiceData) => void;
  onContinue?: () => void;
}

export interface ChatHeaderProps {
  title: string;
  description?: ReactNode;
  progressPercentage: number;
  collectedFields: Record<string, boolean>;
  eventContext?: EventContext;
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  error?: string | null;
  messagesEndRef: RefObject<HTMLDivElement>;
  chatContainerRef: RefObject<HTMLDivElement>;
  initialMessage: string;
  handleScroll?: (event: UIEvent<HTMLDivElement>) => void;
  loadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingHistory?: boolean;
}

export interface ChatInputProps {
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  isLoading?: boolean;
  error?: string | null;
  eventId?: string | number;
  showPreviousConversations: boolean;
  setShowPreviousConversations: (show: boolean) => void;
  handleSelectPreviousMessage: (message: string) => void;
}

export interface ChatFooterProps {
  eventContext?: EventContext;
  progressPercentage: number;
  collectedFields: Record<string, boolean>;
  isDataComplete: boolean;
  handleGenerateScript: () => void;
  eventId?: string;
  onContinue?: () => void;
  scriptData?: ScriptData | null;
  generateAudio?: () => Promise<void>;
}

export interface MessageItemProps {
  message: Message;
}

export interface MessageContentProps {
  message: Message;
}

export interface ScrollToBottomButtonProps {
  onClick: () => void;
}
