"use client";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Edit,
  Pause,
  Play,
  ArrowRight,
  LayoutTemplate,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventHeaderProps {
  eventName: string;
  eventDate: string;
  eventType: string;
  isRunning: boolean;
  isReady: boolean;
  status: string;
  onBack: () => void;
  onToggleRunning: () => void;
  onEdit: () => void;
  onContinueSetup?: () => void;
  onGenerateLayout?: () => void;
  onGenerateScript?: () => void;
}

export function EventHeader({
  eventName,
  eventDate,
  eventType,
  isRunning,
  isReady,
  status,
  onBack,
  onToggleRunning,
  onEdit,
  onContinueSetup,
  onGenerateLayout,
  onGenerateScript,
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
        {/* Show different action buttons based on event status */}
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

        {/* Show continue setup button for draft events */}
        {status === "draft" && onContinueSetup && (
          <Button
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
            onClick={onContinueSetup}
          >
            <ArrowRight className="h-4 w-4" />
            Continue Setup
          </Button>
        )}

        {/* Show generate layout button */}
        {status === "layout_pending" && onGenerateLayout && (
          <Button
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
            onClick={onGenerateLayout}
          >
            <LayoutTemplate className="h-4 w-4" />
            Generate Layout
          </Button>
        )}

        {/* Show generate script button */}
        {status === "script_pending" && onGenerateScript && (
          <Button
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
            onClick={onGenerateScript}
          >
            <FileText className="h-4 w-4" />
            Generate Script
          </Button>
        )}
      </div>
    </div>
  );
}
