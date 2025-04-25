import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Edit, Save } from "lucide-react";
import SafeAIChat from "@/components/SafeAIChat";
import { useState, useEffect } from "react";
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
import { updateEventDetails } from "@/app/actions/event/update-details";
import { useToast } from "@/components/ui/use-toast";

interface EventDetailsStepProps {
  eventId: number | null;
  eventData: Record<string, any> | null;
  isLoading: boolean;
  onEventDataCollected: (data: Record<string, any>) => void;
  onContinue: () => void;
  isEditMode?: boolean;
}

export function EventDetailsStep({
  eventId,
  eventData,
  isLoading,
  onEventDataCollected,
  onContinue,
  isEditMode = false,
}: EventDetailsStepProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [useChat, setUseChat] = useState(false);

  // Reset useChat state when component is mounted with isEditMode
  useEffect(() => {
    if (isEditMode) {
      setUseChat(false);
    }
  }, [isEditMode]);

  // Form state for editing mode
  const [formData, setFormData] = useState({
    eventName: eventData?.eventName || "",
    eventType: eventData?.eventType || "",
    eventDate: eventData?.eventDate || "",
    eventLocation: eventData?.eventLocation || "",
    audienceSize: eventData?.audienceSize || "",
    eventDescription: eventData?.eventDescription || "",
    language: eventData?.language || "English",
    voiceGender: eventData?.voicePreference?.gender || "neutral",
    voiceType: eventData?.voicePreference?.tone || "professional",
    accent: eventData?.voicePreference?.accent || "american",
    speakingRate:
      eventData?.voicePreference?.speed === "fast"
        ? "80"
        : eventData?.voicePreference?.speed === "slow"
        ? "20"
        : "50",
    pitch:
      eventData?.voicePreference?.pitch === "high"
        ? "80"
        : eventData?.voicePreference?.pitch === "low"
        ? "20"
        : "50",
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for updating event details
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId) {
      toast({
        title: "Error",
        description: "No event ID available for updating",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create FormData object for the server action
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value.toString());
      });

      // Call the server action to update event details
      const result = await updateEventDetails(eventId.toString(), formDataObj);

      if (result.success) {
        // Update the local state with the updated data
        onEventDataCollected({
          ...formData,
          voicePreference: {
            gender: formData.voiceGender,
            tone: formData.voiceType,
            accent: formData.accent,
            speed:
              formData.speakingRate === "80"
                ? "fast"
                : formData.speakingRate === "20"
                ? "slow"
                : "medium",
            pitch:
              formData.pitch === "80"
                ? "high"
                : formData.pitch === "20"
                ? "low"
                : "medium",
          },
        });

        setIsEditing(false);

        toast({
          title: "Event updated",
          description:
            "Event details have been updated successfully. You can now proceed to the layout step.",
        });
      } else {
        toast({
          title: "Error updating event",
          description: result.error || "Failed to update event details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the event",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Event Details</h2>
        {eventData && !isEditing && !useChat && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUseChat(true)}
            >
              <svg
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.5286 20 9.14629 19.6916 7.94363 19.1412C7.6615 19.0077 7.52044 18.9409 7.37267 18.9385C7.22489 18.9362 7.08792 18.9915 6.81398 19.1021L3.75 20.5C3.41278 20.6516 3.24418 20.7274 3.1221 20.6574C3.01575 20.5975 2.95928 20.4912 2.96113 20.3793C2.96325 20.2525 3.09316 20.1016 3.35297 19.8L5.14706 17.7C5.43006 17.3747 5.57156 17.2121 5.61753 17.0221C5.65701 16.8578 5.64844 16.6856 5.59278 16.5265C5.52882 16.3425 5.36773 16.1524 5.04556 15.7722C4.38549 14.9864 4 14.0332 4 13C4 8.58172 8.03 5 13 5C13.7202 5 14.4193 5.07459 15.0858 5.21544"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 9.5V9.5C15.5 8.67157 16.1716 8 17 8H19C19.8284 8 20.5 8.67157 20.5 9.5V11.5C20.5 12.3284 19.8284 13 19 13H17.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Use Chat
            </Button>
          </div>
        )}
      </div>

      {(!eventData && !isEditing) || useChat ? (
        <div className="space-y-4">
          {useChat && (
            <div className="flex justify-between items-center mb-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800 flex-1 mr-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You can use the chat to update your event details. The AI
                      will help you refine your event information.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseChat(false)}
                className="whitespace-nowrap"
              >
                Cancel
              </Button>
            </div>
          )}

          <SafeAIChat
            className="border rounded-lg shadow-sm"
            title="Event Creation Assistant"
            description="I'll help you create your AI host script by collecting all necessary information about your event."
            initialMessage={
              useChat && eventData
                ? `Hi! I'm your RhymeAI event assistant. I see you already have some event details:

Event Name: ${eventData.eventName}
Event Type: ${eventData.eventType}
Date: ${eventData.eventDate}
${eventData.eventLocation ? `Location: ${eventData.eventLocation}` : ""}
${eventData.audienceSize ? `Expected Attendees: ${eventData.audienceSize}` : ""}
${
  eventData.eventDescription ? `Description: ${eventData.eventDescription}` : ""
}

What would you like to update or add to your event details? I can help you refine any of this information.`
                : "Hi! I'm your RhymeAI event assistant. I'll help you create a script for your event's AI host. To create an effective script, I need to collect some essential information about your event. Let's start with the basics:\n\n1. What's the name of your event?\n2. What type of event is it? (conference, webinar, workshop, etc.)\n3. When will the event take place?\n4. Where will it be held?\n5. How many attendees do you expect?\n6. Please provide a brief description of your event.\n7. Do you have any preferences for the AI host's voice? (gender, tone, accent)\n\nYou can share as much detail as you'd like - the more information you provide, the better I can tailor the AI host script to your specific event!"
            }
            placeholder="Tell me about your event..."
            eventId={eventId || undefined}
            eventContext={{
              purpose: "To create a customized AI host script for an event",
              requiredFields: [
                "eventName",
                "eventType",
                "eventDate",
                "eventLocation",
                "audienceSize",
                "speakerInfo",
                "voicePreference",
                "language",
                "eventDescription",
              ],
              contextType: "event-creation",
              additionalInfo: {
                currentStep: "information-gathering",
                nextStep: "layout-generation",
                existingData: useChat && eventData ? eventData : undefined,
                eventId: eventId || undefined,
              },
            }}
            onEventDataCollected={(data) => {
              onEventDataCollected(data);
              setUseChat(false);
            }}
          />
        </div>
      ) : isEditing ? (
        <form
          onSubmit={handleUpdateEvent}
          className="space-y-4 p-4 border rounded-lg bg-muted/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                name="eventType"
                value={formData.eventType}
                onValueChange={(value) =>
                  handleSelectChange("eventType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="general">General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocation">Location</Label>
              <Input
                id="eventLocation"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audienceSize">Expected Attendees</Label>
              <Input
                id="audienceSize"
                name="audienceSize"
                type="number"
                value={formData.audienceSize}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                name="language"
                value={formData.language}
                onValueChange={(value) => handleSelectChange("language", value)}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="voiceGender">Voice Gender</Label>
              <Select
                name="voiceGender"
                value={formData.voiceGender}
                onValueChange={(value) =>
                  handleSelectChange("voiceGender", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select voice gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceType">Voice Tone</Label>
              <Select
                name="voiceType"
                value={formData.voiceType}
                onValueChange={(value) =>
                  handleSelectChange("voiceType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select voice tone" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDescription">Event Description</Label>
            <Textarea
              id="eventDescription"
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (eventData) {
                  setIsEditing(false);
                }
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Details
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium">Event Information</h3>
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-sm font-medium">Event Name:</dt>
            <dd>{eventData.eventName}</dd>

            <dt className="text-sm font-medium">Event Type:</dt>
            <dd>{eventData.eventType}</dd>

            <dt className="text-sm font-medium">Date:</dt>
            <dd>{eventData.eventDate}</dd>

            <dt className="text-sm font-medium">Location:</dt>
            <dd>{eventData.eventLocation || "Not specified"}</dd>

            <dt className="text-sm font-medium">Expected Audience:</dt>
            <dd>{eventData.audienceSize || "Not specified"}</dd>

            <dt className="text-sm font-medium">Description:</dt>
            <dd className="col-span-2">
              {eventData.eventDescription || "Not provided"}
            </dd>
          </dl>

          <div className="flex flex-col space-y-4">
            {eventId && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Event details saved
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>
                        Your event details have been saved successfully. You can
                        now proceed to create the event layout or continue
                        editing the details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {eventId && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  Back to Dashboard
                </Button>
              )}

              <Button
                onClick={onContinue}
                disabled={isLoading}
                className={eventId ? "ml-auto" : ""}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {eventId ? "Updating Event..." : "Creating Event..."}
                  </>
                ) : (
                  <>
                    {eventId ? "Go to Layout" : "Create Event"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
