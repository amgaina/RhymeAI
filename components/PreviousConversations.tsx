"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, User, Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PreviousConversationsProps {
  eventId: number;
  onSelectMessage?: (message: string) => void;
}

export function PreviousConversations({
  eventId,
  onSelectMessage,
}: PreviousConversationsProps) {
  const [conversations, setConversations] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreviousMessages() {
      if (!eventId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Import the getPreviousMessages function
        const { getPreviousMessages } = await import("@/app/actions/chat/get-previous-messages");
        const response = await getPreviousMessages(eventId);

        if (response.success && response.conversations) {
          setConversations(response.conversations);
        } else {
          setError(response.error || "Failed to load previous messages");
        }
      } catch (err) {
        console.error("Error loading previous messages:", err);
        setError("An error occurred while loading previous messages");
      } finally {
        setIsLoading(false);
      }
    }

    loadPreviousMessages();
  }, [eventId]);

  // Get conversation keys and sort by most recent first
  const conversationKeys = Object.keys(conversations).sort((a, b) => {
    const aLastMessage = conversations[a][conversations[a].length - 1];
    const bLastMessage = conversations[b][conversations[b].length - 1];
    return new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Loading previous conversations...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-red-500">
            <MessageSquare className="h-4 w-4" />
            Error loading conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (conversationKeys.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            No previous conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Start a new conversation to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Previous Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {conversationKeys.map((key) => {
            const convo = conversations[key];
            const lastMessage = convo[convo.length - 1];
            const timeAgo = formatDistanceToNow(new Date(lastMessage.createdAt), {
              addSuffix: true,
            });

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-xs">
                  <div className="flex items-center gap-2 text-left">
                    <span className="font-medium">
                      {convo.length} messages
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {convo.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 p-2 rounded-md text-xs ${
                          msg.role === "user"
                            ? "bg-primary/10"
                            : "bg-secondary/10"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {msg.role === "user" ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium mb-0.5">
                            {msg.role === "user" ? "You" : "RhymeAI"}
                          </div>
                          <p className="truncate">{msg.content}</p>
                        </div>
                        {onSelectMessage && msg.role === "user" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 ml-auto"
                            onClick={() => onSelectMessage(msg.content)}
                          >
                            Use
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
