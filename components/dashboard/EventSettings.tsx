"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventData } from "@/app/actions/event";

interface EventSettingsProps {
  event: EventData;
  onSaveSettings: (updatedEvent: any) => void;
}

export default function EventSettings({
  event,
  onSaveSettings,
}: EventSettingsProps) {
  const [formData, setFormData] = useState({
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location || "",
    description: event.description || "",
    voiceSettings: {
      type: event.voiceSettings.type,
      language: event.voiceSettings.language,
    },
    settings: {
      autoAdaptive: false,
      autoSlideTransition: true,
      recordEvent: true,
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === "voiceType" || field === "language") {
      setFormData((prev) => ({
        ...prev,
        voiceSettings: {
          ...prev.voiceSettings,
          [field === "voiceType" ? "type" : "language"]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: checked,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...event,
      ...formData,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Settings</CardTitle>
        <CardDescription>Configure settings for this event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Webinar">Webinar</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Corporate Event">
                    Corporate Event
                  </SelectItem>
                  <SelectItem value="Social Gathering">
                    Social Gathering
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="voiceType">Voice Style</Label>
              <Select
                value={formData.voiceSettings.type}
                onValueChange={(value) =>
                  handleSelectChange("voiceType", value)
                }
              >
                <SelectTrigger id="voiceType">
                  <SelectValue placeholder="Select voice style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">
                    Friendly & Approachable
                  </SelectItem>
                  <SelectItem value="Energetic">
                    Energetic & Enthusiastic
                  </SelectItem>
                  <SelectItem value="Formal">Formal & Authoritative</SelectItem>
                  <SelectItem value="Casual">Casual & Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.voiceSettings.language}
                onValueChange={(value) => handleSelectChange("language", value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium border-b pb-2">
              Advanced Settings
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAdaptive">Auto-Adaptive MC</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI MC to adapt to audience feedback
                  </p>
                </div>
                <Switch
                  id="autoAdaptive"
                  checked={formData.settings.autoAdaptive}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("autoAdaptive", checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSlideTransition">
                    Auto Slide Transitions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically advance slides with script
                  </p>
                </div>
                <Switch
                  id="autoSlideTransition"
                  checked={formData.settings.autoSlideTransition}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("autoSlideTransition", checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recordEvent">Record Event</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically record the entire event
                  </p>
                </div>
                <Switch
                  id="recordEvent"
                  checked={formData.settings.recordEvent}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("recordEvent", checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
