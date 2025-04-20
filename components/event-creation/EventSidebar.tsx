import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Volume2,
  FileAudio,
  Presentation,
} from "lucide-react";
import { EventInfo } from "@/hooks/useEventCreation";
import { ScriptSegment } from "@/components/ScriptEditor";

interface EventSidebarProps {
  eventInfo: EventInfo;
  progress: number;
  scriptSegments: ScriptSegment[];
  formData: {
    voiceType: string;
    language: string;
  };
  onFinalizeEvent: () => void;
}

export default function EventSidebar({
  eventInfo,
  progress,
  scriptSegments,
  formData,
  onFinalizeEvent,
}: EventSidebarProps) {
  return (
    <Card className="rhyme-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-primary">
          Event Creation
        </CardTitle>
        <CardDescription>
          Follow the steps to create your AI host
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-sm text-primary-foreground/70">
          {progress < 50
            ? "Getting started..."
            : progress < 90
            ? "Making progress..."
            : "Almost done!"}
        </p>

        <div className="space-y-4 flex-1 pt-2">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Event Structure
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">
                {eventInfo.hasStructure ? "Structure provided" : "Not provided"}
              </span>
              {eventInfo.hasStructure ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            {eventInfo.name && (
              <div className="mt-2 text-xs text-primary-foreground/70">
                <p>
                  <span className="font-medium">Name:</span> {eventInfo.name}
                </p>
                {eventInfo.type && (
                  <p>
                    <span className="font-medium">Type:</span> {eventInfo.type}
                  </p>
                )}
                {eventInfo.date && (
                  <p>
                    <span className="font-medium">Date:</span> {eventInfo.date}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary-foreground">
              <Volume2 className="h-4 w-4 text-accent" />
              Voice Settings
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">
                {eventInfo.hasVoiceSettings ? "Voice selected" : "Not selected"}
              </span>
              {eventInfo.hasVoiceSettings ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            {formData.voiceType && (
              <div className="mt-2 text-xs text-primary-foreground/70">
                <p>
                  <span className="font-medium">Voice:</span>{" "}
                  {formData.voiceType}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Language
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">
                {eventInfo.hasLanguageSettings
                  ? "Language selected"
                  : "Not selected"}
              </span>
              {eventInfo.hasLanguageSettings ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            {formData.language && (
              <div className="mt-2 text-xs text-primary-foreground/70">
                <p>
                  <span className="font-medium">Language:</span>{" "}
                  {formData.language}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary-foreground">
              <FileAudio className="h-4 w-4 text-accent" />
              Script Generation
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">
                {scriptSegments.length > 0
                  ? `${
                      scriptSegments.filter((s) => s.status === "generated")
                        .length
                    } of ${scriptSegments.length} segments`
                  : "Not started"}
              </span>
              {scriptSegments.length > 0 ? (
                scriptSegments.every((s) => s.status === "generated") ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" />
                )
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            {scriptSegments.length > 0 && (
              <div className="mt-2 space-y-1">
                {scriptSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between text-xs text-primary-foreground/70"
                  >
                    <span className="capitalize">{segment.type}</span>
                    {segment.status === "generated" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : segment.status === "generating" ? (
                      <Clock className="h-3 w-3 text-amber-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-primary-foreground">
              <Presentation className="h-4 w-4 text-accent" />
              Presentation
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-foreground/70">
                Not started
              </span>
              <XCircle className="h-5 w-5 text-gray-300" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-primary-foreground">
              Ready for Event?
            </span>
            {progress >= 75 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <Button
            className="w-full bg-cta hover:bg-cta/90 text-white"
            variant={progress >= 75 ? "default" : "outline"}
            disabled={progress < 75}
            onClick={onFinalizeEvent}
          >
            {progress >= 75 ? "Finalize Event" : "Complete Required Info"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
