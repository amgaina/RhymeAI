"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createEvent } from "@/app/actions/event";
import { getVoicePreview, generateEventScript } from "@/app/actions/event";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Import proper components
import { EventDetailsTab } from "@/components/event-creation/EventDetailsTab";
import { VoiceSettingsTab } from "@/components/event-creation/VoiceSettingsTab";
import { ScriptTab } from "@/components/event-creation/ScriptTab";
import { PreviewTab } from "@/components/event-creation/PreviewTab";
import { EventFormValues } from "@/types/event-form";

// Form validation schema
const eventFormSchema = z.object({
  // Event Details
  eventName: z
    .string()
    .min(3, { message: "Event name must be at least 3 characters" }),
  eventType: z.string().min(1, { message: "Please select an event type" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().optional(),
  timezone: z.string().optional(),
  eventDescription: z.string().optional(),
  expectedAttendees: z.string().optional(),
  eventFormat: z.string().optional(),

  // Voice Settings
  primaryVoice: z.string().optional(),
  accent: z.string().optional(),
  speakingStyle: z.string().optional(),
  speakingRate: z.number().default(50),
  pitch: z.number().default(50),
  multilingual: z.boolean().default(false),

  // Script Settings
  scriptTemplate: z.string().optional(),
  customScript: z.string().optional(),
  autoGenerate: z.boolean().default(true),
});

export function EventCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState<EventFormValues | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: "",
      eventType: "",
      startDate: "",
      endDate: "",
      timezone: "",
      eventDescription: "",
      expectedAttendees: "",
      eventFormat: "",
      primaryVoice: "",
      accent: "",
      speakingStyle: "",
      speakingRate: 50,
      pitch: 50,
      multilingual: false,
      scriptTemplate: "standard",
      autoGenerate: true,
      customScript: "",
    },
  });

  // Function to handle voice preview generation
  const handleVoicePreview = async () => {
    try {
      setIsGeneratingPreview(true);
      const voiceSettings = {
        voice: form.getValues("primaryVoice"),
        accent: form.getValues("accent"),
        style: form.getValues("speakingStyle"),
        rate: form.getValues("speakingRate"),
        pitch: form.getValues("pitch"),
      };

      const result = await getVoicePreview(voiceSettings);

      if (result.success) {
        setPreviewUrl(result.previewUrl ?? null);
        toast({
          title: "Voice preview ready",
          description: "Click play to hear the voice sample",
        });
      } else {
        toast({
          title: "Error generating preview",
          description: result.error || "Failed to generate voice preview",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        title: "Preview generation failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Function to generate script based on event details
  const handleScriptGeneration = async () => {
    try {
      setIsGeneratingScript(true);

      // Using a mock event ID for demonstration
      const eventId = `temp_${Date.now()}`;
      const result = await generateEventScript(eventId);

      if (result.success && result.script) {
        // For demo, we'll just combine the script sections
        const scriptText = `
# Introduction
${result.script.introduction}

# Main Content
${result.script.mainContent}

# Conclusion
${result.script.conclusion}
        `;

        setGeneratedScript(scriptText);
        form.setValue("customScript", scriptText);

        toast({
          title: "Script generated",
          description: "Your event script has been created successfully",
        });
      } else {
        toast({
          title: "Script generation failed",
          description: result.error || "Failed to generate script",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Script generation error:", error);
      toast({
        title: "Script generation failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Function to handle form submission
  const onSubmit = async (values: EventFormValues) => {
    // Store form values and show confirmation dialog
    setFormValues(values);
    setShowConfirmDialog(true);
  };

  // Function to handle actual event creation after confirmation
  const handleCreateEvent = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent default button behavior
    console.log("handleCreateEvent called");

    if (!formValues) {
      console.error("No form values available");
      return;
    }

    setIsCreatingEvent(true);

    try {
      // Create a FormData object for the server action
      const formData = new FormData();

      // Add all required fields
      formData.append("eventName", formValues.eventName);
      formData.append("eventType", formValues.eventType);
      formData.append("eventDate", formValues.startDate);

      // Add optional fields with fallbacks
      formData.append("eventLocation", formValues.eventFormat || "");
      formData.append("eventDescription", formValues.eventDescription || "");
      formData.append("expectedAttendees", formValues.expectedAttendees || "0");
      formData.append(
        "language",
        formValues.multilingual ? "Multilingual" : "English"
      );
      formData.append("voiceType", formValues.speakingStyle || "Professional");

      // Add voice gender based on primary voice selection
      if (formValues.primaryVoice) {
        const voiceGender = formValues.primaryVoice.includes("male")
          ? "male"
          : formValues.primaryVoice.includes("female")
          ? "female"
          : "neutral";
        formData.append("voiceGender", voiceGender);
      }

      // Add other voice settings if available
      if (formValues.accent) {
        formData.append("accent", formValues.accent);
      }

      if (formValues.speakingRate) {
        formData.append("speakingRate", formValues.speakingRate.toString());
      }

      if (formValues.pitch) {
        formData.append("pitch", formValues.pitch.toString());
      }

      // Add script if available
      if (formValues.customScript) {
        formData.append("scriptContent", formValues.customScript);
      }

      console.log(
        "Submitting form data to server action:",
        Object.fromEntries(formData.entries())
      );

      // Try two different approaches to call the server action
      let result;

      try {
        // Method 1: Call the server action directly with the FormData
        result = await createEvent(formData);
      } catch (serverActionError) {
        console.error(
          "First method failed, trying alternative approach:",
          serverActionError
        );

        // Method 2: Create a temporary form and submit it
        const tempForm = document.createElement("form");
        tempForm.method = "post";
        tempForm.style.display = "none";

        // Add all form data as hidden inputs
        for (const [key, value] of formData.entries()) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          tempForm.appendChild(input);
        }

        // Add action attribute with server action URL
        tempForm.action = "/api/events/create";

        // Append to body, submit, and remove
        document.body.appendChild(tempForm);
        tempForm.submit();

        // Show loading toast and return early
        toast({
          title: "Creating event...",
          description: "Your event is being created. Please wait.",
        });

        return;
      }

      console.log("Server action result:", result);

      if (result.success) {
        toast({
          title: "Event created!",
          description:
            "Your event was created successfully. Redirecting to event creation page.",
        });

        // Navigate to the event creation page with the new event ID
        router.push(`/event-creation?eventId=${result.eventId}`);
      } else {
        toast({
          title: "Error creating event",
          description:
            result.error || "There was a problem creating your event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      // Reset loading state and close the dialog regardless of the outcome
      setIsCreatingEvent(false);
      setShowConfirmDialog(false);
    }
  };

  // Function to navigate to next tab after current tab is completed
  const nextTab = (currentTab: string) => {
    switch (currentTab) {
      case "details":
        setActiveTab("voice");
        break;
      case "voice":
        setActiveTab("script");
        break;
      case "script":
        setActiveTab("preview");
        break;
      default:
        // Submit the form if we're on the last tab
        form.handleSubmit(onSubmit)();
        break;
    }
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Create New Event</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to create this event? You can edit the
              details later.
            </AlertDialogDescription>
            <div className="mt-4 p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-1">Event Summary:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <span className="font-medium">Name:</span>{" "}
                  {formValues?.eventName}
                </li>
                <li>
                  <span className="font-medium">Type:</span>{" "}
                  {formValues?.eventType}
                </li>
                <li>
                  <span className="font-medium">Date:</span>{" "}
                  {formValues?.startDate}
                </li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0">
              Cancel
            </AlertDialogCancel>

            {/* Primary button - uses server action */}
            <AlertDialogAction asChild disabled={isCreatingEvent}>
              <button
                type="button"
                className="bg-cta hover:bg-cta/90 text-white px-4 py-2 rounded-md"
                onClick={handleCreateEvent}
                disabled={isCreatingEvent}
              >
                {isCreatingEvent ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
            </AlertDialogAction>

            {/* Alternative button - uses form submission to API route */}
            {!isCreatingEvent && (
              <form
                action="/api/events/create"
                method="post"
                className="m-0"
                onSubmit={() => {
                  setIsCreatingEvent(true);
                  toast({
                    title: "Creating event...",
                    description: "Your event is being created. Please wait.",
                  });
                }}
              >
                {/* Hidden inputs for form data */}
                {formValues &&
                  Object.entries(formValues).map(
                    ([key, value]) =>
                      value !== undefined && (
                        <input
                          key={key}
                          type="hidden"
                          name={key}
                          value={String(value)}
                        />
                      )
                  )}
                <button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md text-sm"
                >
                  Alternative Submit
                </button>
              </form>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          action={async () => {
            // This ensures the form is properly submitted as a server action
            if (form.formState.isValid) {
              const values = form.getValues();
              await onSubmit(values);
            }
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-primary/5 p-1 mb-6">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
              >
                Event Details
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
              >
                Voice Settings
              </TabsTrigger>
              <TabsTrigger
                value="script"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
              >
                Script
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-accent data-[state=active]:text-white"
              >
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Event Details Tab */}
            <TabsContent value="details">
              <EventDetailsTab form={form} onNext={() => nextTab("details")} />
            </TabsContent>

            {/* Voice Settings Tab */}
            <TabsContent value="voice">
              <VoiceSettingsTab
                form={form}
                onNext={() => nextTab("voice")}
                onBack={() => setActiveTab("details")}
                handleVoicePreview={handleVoicePreview}
              />
            </TabsContent>

            {/* Script Tab */}
            <TabsContent value="script">
              <ScriptTab
                form={form}
                onNext={() => nextTab("script")}
                onBack={() => setActiveTab("voice")}
                handleScriptGeneration={handleScriptGeneration}
              />
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview">
              <PreviewTab
                form={form}
                onBack={() => setActiveTab("script")}
                isSubmitting={form.formState.isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </>
  );
}
