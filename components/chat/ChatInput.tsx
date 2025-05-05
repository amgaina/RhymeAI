"use client";

import { Send, Mic, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  error: string | null;
  eventId?: string | number;
  disabled?: boolean;
  showPreviousConversations?: boolean;
  setShowPreviousConversations?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectPreviousMessage?: (message: string) => void;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder = "Type your message...",
  error,
  eventId,
  disabled = false,
  showPreviousConversations = false,
  setShowPreviousConversations,
  handleSelectPreviousMessage,
  formRef: externalFormRef,
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const internalFormRef = useRef<HTMLFormElement>(null);
  const formRef = externalFormRef || internalFormRef;

  // Set up recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setRecordingTime(0);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Function to handle voice input (speech-to-text)
  const handleVoiceInput = () => {
    // If already recording, stop it
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Check browser support
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Your browser does not support speech recognition. Try using Chrome or Edge."
      );
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Start recording
    setIsRecording(true);
    recognition.start();

    let finalTranscript = "";

    // Process results
    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Update input field
      const transcript = finalTranscript || interimTranscript;
      if (transcript) {
        const syntheticEvent = {
          target: { value: input ? `${input} ${transcript}` : transcript },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        handleInputChange(syntheticEvent);
      }
    };

    // Handle end of speech recognition
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      recognitionRef.current = null;
    };

    // Auto-stop after 30 seconds of recording
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 30000);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-4 relative">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              "pr-24 resize-none min-h-[80px]",
              isRecording && "border-red-400 focus-visible:ring-red-300"
            )}
            disabled={isLoading || disabled}
            rows={3}
            onKeyDown={(e) => {
              // Submit on Enter without Shift key
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading && !disabled) {
                  formRef.current?.requestSubmit();
                }
              }
            }}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {isRecording && (
              <div className="flex items-center mr-2 text-xs text-red-500">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                {recordingTime}s
              </div>
            )}

            {setShowPreviousConversations && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowPreviousConversations((prev) => !prev)}
                title="Show previous messages"
              >
                <Clock className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              disabled={isLoading || disabled}
              onClick={handleVoiceInput}
              className="h-8 w-8"
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || disabled || !input.trim()}
              className="h-8 w-8 bg-primary hover:bg-primary/90"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center text-sm text-red-500 mt-1 gap-1">
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                if (formRef.current) {
                  handleSubmit(new Event("submit") as any);
                }
              }}
              className="text-xs h-7 px-2"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Previous conversations dropdown */}
      {showPreviousConversations && handleSelectPreviousMessage && (
        <div className="absolute bottom-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto mb-1">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Recent messages
            </div>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded-sm"
                onClick={() =>
                  handleSelectPreviousMessage(
                    "What's the agenda for the event?"
                  )
                }
              >
                What's the agenda for the event?
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded-sm"
                onClick={() =>
                  handleSelectPreviousMessage("How many people will attend?")
                }
              >
                How many people will attend?
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
