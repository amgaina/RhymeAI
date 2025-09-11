"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EventDetailsFormProps {
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

export default function EventDetailsForm({
  onSubmit,
  isLoading = false
}: EventDetailsFormProps) {
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "conference",
    eventDate: new Date().toISOString().split('T')[0],
    eventLocation: "",
    audienceSize: "",
    eventDescription: "",
    language: "English",
    voicePreference: {
      gender: "neutral",
      tone: "professional",
      accent: "american",
      speed: "medium",
      pitch: "medium"
    }
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleVoiceChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      voicePreference: {
        ...prev.voicePreference,
        [field]: value
      }
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
        <CardDescription>
          Fill out the form below to provide details about your event.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name *</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) => handleChange("eventName", e.target.value)}
              placeholder="e.g., Annual Tech Conference 2023"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => handleChange("eventType", value)}
              >
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="general">General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleChange("eventDate", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventLocation">Location</Label>
              <Input
                id="eventLocation"
                value={formData.eventLocation}
                onChange={(e) => handleChange("eventLocation", e.target.value)}
                placeholder="e.g., San Francisco Convention Center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audienceSize">Expected Audience Size</Label>
              <Input
                id="audienceSize"
                type="number"
                min="1"
                value={formData.audienceSize}
                onChange={(e) => handleChange("audienceSize", e.target.value)}
                placeholder="e.g., 500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eventDescription">Event Description</Label>
            <Textarea
              id="eventDescription"
              value={formData.eventDescription}
              onChange={(e) => handleChange("eventDescription", e.target.value)}
              placeholder="Provide a brief description of your event..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Voice Preferences</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="voiceGender" className="text-xs">Gender</Label>
                <Select
                  value={formData.voicePreference.gender}
                  onValueChange={(value) => handleVoiceChange("gender", value)}
                >
                  <SelectTrigger id="voiceGender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="voiceTone" className="text-xs">Tone</Label>
                <Select
                  value={formData.voicePreference.tone}
                  onValueChange={(value) => handleVoiceChange("tone", value)}
                >
                  <SelectTrigger id="voiceTone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="voiceAccent" className="text-xs">Accent</Label>
                <Select
                  value={formData.voicePreference.accent}
                  onValueChange={(value) => handleVoiceChange("accent", value)}
                >
                  <SelectTrigger id="voiceAccent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="american">American</SelectItem>
                    <SelectItem value="british">British</SelectItem>
                    <SelectItem value="australian">Australian</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
