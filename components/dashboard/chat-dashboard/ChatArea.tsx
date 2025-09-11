import { useRef, useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import { EventData } from "@/app/actions/event";
import { ChatSuggestions } from "./ChatSuggestions";

interface ChatAreaProps {
  selectedEvent: EventData | null | undefined;
  selectedEventId: string | null;
  isTyping: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedSuggestion: string | null;
  setSelectedSuggestion: (suggestion: string | null) => void;
  handleSuggestion: (suggestion: string) => void;
  chatKey: string;
  customChatProps: any;
}

export function ChatArea({
  selectedEvent,
  selectedEventId,
  isTyping,
  chatContainerRef,
  selectedSuggestion,
  setSelectedSuggestion,
  handleSuggestion,
  chatKey,
  customChatProps,
}: ChatAreaProps) {
  // State to track if we should auto-submit "create new event"
  const [autoSubmitCreateEvent, setAutoSubmitCreateEvent] = useState(false);

  // Check if the chatKey indicates we're creating a new event
  useEffect(() => {
    if (chatKey.startsWith("chat-new-event-")) {
      setAutoSubmitCreateEvent(true);
    }
  }, [chatKey]);

  // Reference to the form element
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-submit the form with "create new event" text
  useEffect(() => {
    // Only run this effect once when autoSubmitCreateEvent becomes true
    if (autoSubmitCreateEvent && formRef.current) {
      // Use a longer delay to ensure the chat component is fully initialized
      const timer = setTimeout(() => {
        try {
          if (formRef.current) {
            // Find the input element and set its value
            const inputElement = formRef.current.querySelector("input");
            if (inputElement) {
              // Set the input value to "create new event"
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              )?.set;

              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(inputElement, "create new event");

                // Dispatch an input event to trigger React's onChange
                const inputEvent = new Event("input", { bubbles: true });
                inputElement.dispatchEvent(inputEvent);

                // Submit the form after a short delay
                setTimeout(() => {
                  try {
                    if (formRef.current) {
                      // Create a custom submit event
                      const submitEvent = new Event("submit", {
                        bubbles: true,
                        cancelable: true,
                      });

                      // Add a preventDefault method to the event to make it compatible with React's form handling
                      Object.defineProperty(submitEvent, "preventDefault", {
                        value: () => {},
                        enumerable: true,
                      });

                      formRef.current.dispatchEvent(submitEvent);
                    }
                  } catch (error) {
                    console.error("Error submitting form:", error);
                  } finally {
                    // Always reset the flag to prevent infinite loops
                    setAutoSubmitCreateEvent(false);
                  }
                }, 200);
              }
            }
          }
        } catch (error) {
          console.error("Error in auto-submit effect:", error);
          // Reset the flag even if there's an error
          setAutoSubmitCreateEvent(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoSubmitCreateEvent]);

  return (
    <div
      className="flex-1 overflow-hidden flex flex-col"
      ref={chatContainerRef}
    >
      <div className="flex-1 overflow-y-auto">
        <RhymeAIChat
          key={chatKey}
          formRef={formRef}
          {...customChatProps}
          renderInput={(props: {
            value: string;
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
          }) => (
            <div className="flex items-center gap-2 bg-background rounded-md border border-input p-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full p-2 h-auto"
              >
                <Sparkles className="h-4 w-4 text-accent" />
              </Button>
              <input
                {...props}
                value={selectedSuggestion || props.value}
                onChange={(e) => {
                  // Clear selected suggestion if user types something else
                  if (
                    selectedSuggestion &&
                    e.target.value !== selectedSuggestion
                  ) {
                    setSelectedSuggestion(null);
                  }
                  props.onChange(e);
                }}
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground text-sm h-10 px-2"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full p-2 h-8 w-8 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          )}
          renderMessage={(message: string, isUser: boolean) => (
            <div
              className={`${
                isUser ? "flex justify-end" : "flex justify-start"
              }`}
            >
              <div
                className={
                  isUser
                    ? customChatProps.userMessageClassName
                    : customChatProps.assistantMessageClassName
                }
              >
                {message}
              </div>
            </div>
          )}
        />
      </div>

      {/* Smart Suggestions */}
      {!isTyping && (
        <ChatSuggestions
          selectedEvent={selectedEvent}
          selectedSuggestion={selectedSuggestion}
          handleSuggestion={handleSuggestion}
        />
      )}
    </div>
  );
}
