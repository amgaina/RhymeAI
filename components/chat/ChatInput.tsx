"use client";

import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  error: string | null;
  eventId?: string | number;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder = "Type your message...",
  error,
  eventId,
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
      } as React.ChangeEvent<HTMLInputElement>;

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
    <>
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={isLoading || isRecording}
          onClick={handleVoiceInput}
          className={isRecording ? "bg-red-100 text-red-500" : ""}
        >
          <Mic className="h-4 w-4" />
        </Button>
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
    </>
  );
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
