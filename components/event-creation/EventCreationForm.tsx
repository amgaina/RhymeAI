import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Save } from "lucide-react";
import { FormData } from "@/hooks/useEventCreation";

interface EventCreationFormProps {
  formData: FormData;
  availableVoices: SpeechSynthesisVoice[];
  isPlaying: boolean;
  onFormChange: (field: string, value: string) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onTestVoice: () => void;
  onStopVoice: () => void;
}

export default function EventCreationForm({
  formData,
  availableVoices,
  isPlaying,
  onFormChange,
  onFormSubmit,
  onTestVoice,
  onStopVoice,
}: EventCreationFormProps) {
  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-md font-bold text-primary-foreground border-b border-primary/10 pb-2">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-primary-foreground">
              Event Name *
            </Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) => onFormChange("eventName", e.target.value)}
              placeholder="Tech Conference 2025"
              required
              className="border-primary/20 focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventType" className="text-primary-foreground">
              Event Type *
            </Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => onFormChange("eventType", value)}
              required
            >
              <SelectTrigger id="eventType" className="border-primary/20">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Corporate Event">Corporate Event</SelectItem>
                <SelectItem value="Social Gathering">
                  Social Gathering
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDate" className="text-primary-foreground">
              Event Date *
            </Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => onFormChange("eventDate", e.target.value)}
              required
              className="border-primary/20 focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventLocation" className="text-primary-foreground">
              Location
            </Label>
            <Input
              id="eventLocation"
              value={formData.eventLocation}
              onChange={(e) => onFormChange("eventLocation", e.target.value)}
              placeholder="City, Venue"
              className="border-primary/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="expectedAttendees"
              className="text-primary-foreground"
            >
              Expected Attendees
            </Label>
            <Input
              id="expectedAttendees"
              type="number"
              value={formData.expectedAttendees}
              onChange={(e) =>
                onFormChange("expectedAttendees", e.target.value)
              }
              placeholder="100"
              className="border-primary/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDescription" className="text-primary-foreground">
            Event Description *
          </Label>
          <Textarea
            id="eventDescription"
            value={formData.eventDescription}
            onChange={(e) => onFormChange("eventDescription", e.target.value)}
            placeholder="Describe your event, purpose, and what attendees can expect..."
            rows={4}
            required
            className="border-primary/20 focus:border-accent"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold text-primary-foreground border-b border-primary/10 pb-2">
          Voice & Language Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="voiceType" className="text-primary-foreground">
              AI Host Voice Style *
            </Label>
            <Select
              value={formData.voiceType}
              onValueChange={(value) => onFormChange("voiceType", value)}
              required
            >
              <SelectTrigger id="voiceType" className="border-primary/20">
                <SelectValue placeholder="Select voice style" />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.length > 0 ? (
                  availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Friendly">
                      Friendly & Approachable
                    </SelectItem>
                    <SelectItem value="Energetic">
                      Energetic & Enthusiastic
                    </SelectItem>
                    <SelectItem value="Formal">
                      Formal & Authoritative
                    </SelectItem>
                    <SelectItem value="Casual">Casual & Relaxed</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {formData.voiceType && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onTestVoice}
                  disabled={isPlaying}
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Test Voice
                </Button>
                {isPlaying && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={onStopVoice}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="language" className="text-primary-foreground">
              Language *
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value) => onFormChange("language", value)}
              required
            >
              <SelectTrigger id="language" className="border-primary/20">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.length > 0 ? (
                  [...new Set(availableVoices.map((v) => v.lang))].map(
                    (language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    )
                  )
                ) : (
                  <>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="text-primary-foreground/70"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-cta hover:bg-cta/90 text-white gap-1 btn-pulse"
        >
          <Save className="h-4 w-4" />
          Save and Continue
        </Button>
      </div>
    </form>
  );
}
