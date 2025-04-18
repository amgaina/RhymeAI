"use client";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventHeaderProps {
  eventName: string;
  eventDate: string;
  eventType: string;
  isRunning: boolean;
  isReady: boolean;
  onBack: () => void;
  onToggleRunning: () => void;
  onEdit: () => void;
}

export function EventHeader({
  eventName,
  eventDate,
  eventType,
  isRunning,
  isReady,
  onBack,
  onToggleRunning,
  onEdit,
}: EventHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <Button variant="outline" size="sm" onClick={onBack} className="mb-2">
          ← Back to Events
        </Button>
        <h2 className="text-2xl font-bold text-primary-foreground">
          {eventName}
        </h2>
        <div className="flex items-center gap-2 text-primary-foreground/70">
          <Calendar className="h-4 w-4" />
          <span>{eventDate}</span>
          <Badge variant="outline">{eventType}</Badge>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
          Edit Event
        </Button>
        {isReady && (
          <Button
            className={`flex items-center gap-2 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-cta hover:bg-cta/90"
            }`}
            onClick={onToggleRunning}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                End Event
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Event
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
