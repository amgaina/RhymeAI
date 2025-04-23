"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  Calendar,
  Settings,
  Mic2,
  Clock,
  FileText,
} from "lucide-react";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import EventList, { EventItem } from "@/components/dashboard/EventList";
import { useEvents } from "@/hooks/useEvents";

export default function Dashboard() {
  const { events, isLoading } = useEvents();

  // Convert event data to event item format for EventList
  const eventItems: EventItem[] = events.map((event) => ({
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location || "",
    description: event.description || "",
    voiceSettings: event.voiceSettings,
    scriptSegmentsCount: event.scriptSegments?.length || 0,
    createdAt: event.createdAt,
    status: event.status,
    duration: (event.scriptSegments || []).reduce(
      (sum, segment) => sum + (segment.timing || 0),
      0
    ),
  }));

  // Create new event link
  const createEventLink = "/create-event";

  return (
    <div className="min-h-screen bg-secondary">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold text-primary-foreground">
              Your Events
            </h1>
            <p className="text-primary-foreground/70">
              Manage your AI-powered event hosts
            </p>
          </div>
          <Link href={createEventLink}>
            <Button
              className="mt-4 md:mt-0 bg-cta hover:bg-cta/90 text-white btn-pulse animate-slide-up flex items-center gap-2"
              style={{ animationDelay: "0.2s" }}
            >
              <PlusCircle className="h-5 w-5" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 stagger-animation">
          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Total Events
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Active Voices
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.filter((e) => e.status === "ready").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Mic2 className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Script Segments
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {events.reduce(
                      (sum, event) => sum + event.scriptSegments.length,
                      0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-scale animate-fade-in rhyme-card"
            style={{ animationDelay: "0.4s" }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/70">
                    Content Minutes
                  </p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {Math.round(
                      events.reduce(
                        (sum, event) =>
                          sum +
                          (event.scriptSegments || []).reduce(
                            (segSum, segment) => segSum + (segment.timing || 0),
                            0
                          ),
                        0
                      ) / 60
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-3 text-primary-foreground">
              Loading events...
            </span>
          </div>
        ) : (
          <EventList
            events={eventItems}
            onSelectEvent={(eventId) => {
              // Navigate to event detail page
              window.location.href = `/event/${eventId}`;
            }}
            onContinueEvent={(eventId, status) => {
              // Handle different statuses
              switch (status) {
                case "draft":
                  // Continue with event setup
                  window.location.href = `/event/create?eventId=${eventId}`;
                  break;
                case "layout_pending":
                  // Generate layout
                  window.location.href = `/event/${eventId}/layout`;
                  break;
                case "script_pending":
                  // Generate script
                  window.location.href = `/event/${eventId}/script`;
                  break;
                default:
                  // Default to event detail page
                  window.location.href = `/event/${eventId}`;
              }
            }}
            createEventLink={createEventLink}
          />
        )}

        {/* AI Assistant */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-animation mt-8">
          <Card
            className="md:col-span-3 animate-slide-up rhyme-card"
            style={{ animationDelay: "0.3s" }}
          >
            <RhymeAIChat
              title="Event Assistant"
              initialMessage="How can I help with your event planning today? Ask me about creating events, managing voices, or generating scripts."
              placeholder="Ask about event planning..."
              className="border-0 shadow-none"
            />
          </Card>
        </div>
      </main>
    </div>
  );
}
