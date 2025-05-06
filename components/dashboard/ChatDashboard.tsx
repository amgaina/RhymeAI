"use client";

import { ChatDashboard as ChatDashboardComponent } from "./chat-dashboard";
import { EventData } from "@/app/actions/event";

interface ChatDashboardProps {
  events: EventData[];
  isLoading: boolean;
  isDeleting: Record<string, boolean>;
  selectedEventId?: string | null;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onSelectEvent?: (eventId: string) => void;
  onContinueEvent?: (eventId: string) => void;
  onCreateEvent?: (eventData: any) => Promise<any>;
  onUpdateEvent?: (eventId: string, updateData: any) => Promise<any>;
  createEventLink?: string;
}

export default function ChatDashboard(props: ChatDashboardProps) {
  return <ChatDashboardComponent {...props} />;
}
