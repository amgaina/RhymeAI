import { EventData } from "@/app/actions/event";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarStats } from "./SidebarStats";
import { EventsList } from "./EventsList";
import { SidebarFooter } from "./SidebarFooter";

interface SidebarProps {
  events: EventData[];
  isLoading: boolean;
  isDeleting: Record<string, boolean>;
  selectedEventId: string | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onSelectEvent: (eventId: string) => void;
  onContinueEvent?: (eventId: string) => void;
  onCreateNewEvent?: () => void;
  createEventLink: string;
  formatDate: (dateString: string) => string;
  getEventProgress: (event: EventData) => number;
  totalEvents: number;
  activeVoices: number;
  scriptSegments: number;
  contentMinutes: number;
}

export function Sidebar({
  events,
  isLoading,
  isDeleting,
  selectedEventId,
  sidebarCollapsed,
  setSidebarCollapsed,
  onSelectEvent,
  onContinueEvent,
  onCreateNewEvent,
  createEventLink,
  formatDate,
  getEventProgress,
  totalEvents,
  activeVoices,
  scriptSegments,
  contentMinutes,
}: SidebarProps) {
  return (
    <div
      className={`${
        sidebarCollapsed ? "w-20" : "w-80"
      } bg-card border-r border-border h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
    >
      <SidebarHeader
        sidebarCollapsed={sidebarCollapsed}
        createEventLink={createEventLink}
        onCreateNewEvent={onCreateNewEvent}
      />

      <SidebarStats
        sidebarCollapsed={sidebarCollapsed}
        totalEvents={totalEvents}
        activeVoices={activeVoices}
        scriptSegments={scriptSegments}
        contentMinutes={contentMinutes}
      />

      <EventsList
        events={events}
        isLoading={isLoading}
        sidebarCollapsed={sidebarCollapsed}
        selectedEventId={selectedEventId}
        isDeleting={isDeleting}
        onSelectEvent={onSelectEvent}
        onContinueEvent={onContinueEvent}
        formatDate={formatDate}
        getEventProgress={getEventProgress}
      />

      <SidebarFooter
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
    </div>
  );
}
