"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Globe,
  PlusCircle,
  ArrowUpRight,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface EventItem {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  description: string;
  voiceSettings: {
    type: string;
    language: string;
  };
  scriptSegmentsCount: number;
  createdAt: string;
  status: string;
  duration?: number;
}

interface EventListProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
  createEventLink: string;
}

export default function EventList({
  events,
  onSelectEvent,
  createEventLink,
}: EventListProps) {
  // Format time to MM:SS
  const formatTime = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <Card className="mb-8 animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>
            Manage your scheduled and draft events
          </CardDescription>
        </div>
        <Link href={createEventLink}>
          <Button className="bg-cta hover:bg-cta/90 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Event
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first event to get started with RhymeAI
            </p>
            <Link href={createEventLink}>
              <Button className="bg-cta hover:bg-cta/90">
                Create Your First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Event Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Voice
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Language
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-primary-foreground/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={event.id}
                    className="border-b border-primary/10 hover:bg-primary/5 animate-fade-in"
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-primary-foreground">
                        {event.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.duration
                          ? formatTime(event.duration)
                          : "No content"}
                        <span className="mx-1">•</span>
                        <span>{event.scriptSegmentsCount} segments</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-primary-foreground/70">
                      {event.date}
                    </td>
                    <td className="py-4 px-4 text-primary-foreground/70">
                      {event.type}
                    </td>
                    <td className="py-4 px-4 text-primary-foreground/70">
                      {event.voiceSettings.type}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-1">
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1 bg-primary/5"
                        >
                          <Globe className="h-3 w-3" />
                          {event.voiceSettings.language}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${
                          event.status === "ready"
                            ? "bg-green-100 text-green-600"
                            : event.status === "draft"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {event.status === "ready" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {event.status === "ready"
                          ? "Ready"
                          : event.status === "draft"
                          ? "Draft"
                          : "In Progress"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-primary-foreground"
                          onClick={() => onSelectEvent(event.id)}
                        >
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant={
                            event.status === "ready" ? "default" : "outline"
                          }
                          size="sm"
                          className={`h-8 px-2 ${
                            event.status === "ready"
                              ? "bg-cta hover:bg-cta/90"
                              : ""
                          }`}
                          disabled={event.status !== "ready"}
                          onClick={() => onSelectEvent(event.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {event.status === "ready" ? "Start" : "Not Ready"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
