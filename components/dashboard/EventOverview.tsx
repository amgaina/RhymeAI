"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Presentation,
  Cast,
  Share2,
  CheckCircle,
  AlertTriangle,
  Play,
} from "lucide-react";
import { EventData } from "@/app/actions/event";

interface EventOverviewProps {
  event: EventData;
  totalDuration: number;
  onNavigateToTab: (tabId: string) => void;
  onPlayAudio?: (audioUrl: string) => void;
}

export default function EventOverview({
  event,
  totalDuration,
  onNavigateToTab,
  onPlayAudio,
}: EventOverviewProps) {
  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Event Details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">
                Location
              </p>
              <p className="text-primary-foreground">
                {event.location || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">
                Date & Time
              </p>
              <p className="text-primary-foreground">{event.date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">
                Voice Style
              </p>
              <p className="text-primary-foreground">
                {event.voiceSettings.type}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">
                Language
              </p>
              <p className="text-primary-foreground">
                {event.voiceSettings.language}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-primary-foreground/70">
              Description
            </p>
            <p className="text-primary-foreground">{event.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-primary-foreground/70">
              Script Status
            </p>
            <div className="mt-2">
              <Progress
                value={
                  event.scriptSegments.length === 0
                    ? 0
                    : (event.scriptSegments.filter(
                        (s) => s.status === "generated"
                      ).length /
                        event.scriptSegments.length) *
                      100
                }
                className="h-2"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>
                  {
                    event.scriptSegments.filter((s) => s.status === "generated")
                      .length
                  }{" "}
                  of {event.scriptSegments.length} segments
                </span>
                <span>
                  {totalDuration > 0 ? formatTime(totalDuration) : "0:00"} total
                  duration
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNavigateToTab("script")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Edit Script
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNavigateToTab("presentation")}
          >
            <Presentation className="h-4 w-4 mr-2" />
            Manage Presentation
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNavigateToTab("event")}
          >
            <Cast className="h-4 w-4 mr-2" />
            Go to Event Dashboard
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Share2 className="h-4 w-4 mr-2" />
            Share Event
          </Button>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {event.scriptSegments.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Script Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.scriptSegments.slice(0, 3).map((segment) => (
                <div key={segment.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium capitalize">{segment.type}</h3>
                    <div className="flex items-center gap-2">
                      {segment.status === "generated" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-600 border-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-600 border-amber-200"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-primary-foreground/80">
                    {segment.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-primary-foreground/60">
                      Duration:{" "}
                      {segment.timing ? formatTime(segment.timing) : "N/A"}
                    </span>
                    {segment.audio && onPlayAudio && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex items-center gap-1"
                        onClick={() => onPlayAudio(segment.audio!)}
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {event.scriptSegments.length > 3 && (
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-primary"
                    onClick={() => onNavigateToTab("script")}
                  >
                    View all {event.scriptSegments.length} segments
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
