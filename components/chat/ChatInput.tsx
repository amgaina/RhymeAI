"use client";

import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // Fixed textarea type
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  error: string | null;
  eventId?: string | number;
  disabled?: boolean;
  showPreviousConversations?: boolean;
  setShowPreviousConversations?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectPreviousMessage?: (message: string) => void;
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
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);

  // Function to handle voice input (speech-to-text)
  const handleVoiceInput = () => {
    // Check if the browser supports the Web Speech API
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Your browser does not support speech recognition. Try using Chrome or Edge."
      );
      return;
    }

    // Create a speech recognition instance
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure the recognition
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Start recording
    setIsRecording(true);
    recognition.start();

    let finalTranscript = "";

    // Process results
    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Update the input field with the current transcript
      const syntheticEvent = {
        target: { value: finalTranscript || interimTranscript },
      } as React.ChangeEvent<HTMLTextAreaElement>; // Fixed to textarea

      handleInputChange(syntheticEvent);
    };

    // Handle end of speech recognition
    recognition.onend = () => {
      setIsRecording(false);
    };

    // Handle errors
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 relative">
      <div className="relative">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1"
          disabled={isLoading || disabled}
        />

        {/* Add previous conversations button if needed */}
        {setShowPreviousConversations && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-14 top-2"
            onClick={() => setShowPreviousConversations((prev) => !prev)}
          >
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
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="12" y1="7" x2="12" y2="13" />
            </svg>
          </Button>
        )}

        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={isLoading || disabled || isRecording}
          onClick={handleVoiceInput}
          className={`absolute right-10 bottom-1 ${
            isRecording ? "bg-red-100 text-red-500" : ""
          }`}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || disabled || !input.trim()}
          className="bg-primary hover:bg-primary/90 absolute right-1 bottom-1"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Display previous conversations dropdown if enabled */}
      {showPreviousConversations && handleSelectPreviousMessage && (
        <div className="absolute bottom-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Recent messages
            </div>
            {/* This would be populated with previous messages */}
            <div className="space-y-1">
              <button
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

      {/* Add a retry button when there's an error */}
      {error && (
        <div className="mt-2 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              const form = e.currentTarget.closest("form");
              if (form) {
                handleSubmit(new Event("submit") as any);
              }
            }}
            className="text-xs"
          >
            Retry
          </Button>
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
