"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  createEvent,
  getVoicePreview,
  generateEventScript,
} from "@/app/actions/event";
import { useState } from "react";
import { Play, Plus, RotateCw } from "lucide-react";

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

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

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
    try {
      // Convert form values to FormData
      const formData = new FormData();
      formData.append("eventName", values.eventName);
      formData.append("eventType", values.eventType);
      formData.append("eventDate", values.startDate);
      formData.append("eventLocation", values.eventFormat || "");
      formData.append("eventDescription", values.eventDescription || "");
      formData.append("expectedAttendees", values.expectedAttendees || "0");
      formData.append(
        "language",
        values.multilingual ? "Multilingual" : "English"
      );
      formData.append("voiceType", values.speakingStyle || "Professional");

      // Add optional voice settings
      if (values.primaryVoice) {
        formData.append(
          "voiceGender",
          values.primaryVoice.includes("male")
            ? "male"
            : values.primaryVoice.includes("female")
            ? "female"
            : "neutral"
        );
      }

      if (values.accent) {
        formData.append("accent", values.accent);
      }

      if (values.speakingRate) {
        formData.append("speakingRate", values.speakingRate.toString());
      }

      if (values.pitch) {
        formData.append("pitch", values.pitch.toString());
      }

      // Add script if available
      if (values.customScript) {
        formData.append("scriptContent", values.customScript);
      }

      // Create event
      const result = await createEvent(formData);

      if (result.success) {
        toast({
          title: "Event created!",
          description:
            "Your event was created successfully. Redirecting to event creation page.",
        });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Event Information</CardTitle>
                <CardDescription>
                  Enter the basic details about your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Tech Conference 2025"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="conference">
                              Conference
                            </SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                            <SelectItem value="corporate">
                              Corporate Meeting
                            </SelectItem>
                            <SelectItem value="education">
                              Educational Event
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="est">
                              Eastern Time (ET)
                            </SelectItem>
                            <SelectItem value="cst">
                              Central Time (CT)
                            </SelectItem>
                            <SelectItem value="mst">
                              Mountain Time (MT)
                            </SelectItem>
                            <SelectItem value="pst">
                              Pacific Time (PT)
                            </SelectItem>
                            <SelectItem value="utc">
                              Coordinated Universal Time (UTC)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="eventDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a brief description of your event..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="expectedAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Attendees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in-person">In-Person</SelectItem>
                            <SelectItem value="virtual">Virtual</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                    onClick={() => nextTab("details")}
                  >
                    Save and Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Settings Tab */}
          <TabsContent value="voice">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Voice Configuration</CardTitle>
                <CardDescription>
                  Customize how your AI emcee will sound
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryVoice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Voice</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select voice type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male-1">
                                Male Voice 1
                              </SelectItem>
                              <SelectItem value="male-2">
                                Male Voice 2
                              </SelectItem>
                              <SelectItem value="female-1">
                                Female Voice 1
                              </SelectItem>
                              <SelectItem value="female-2">
                                Female Voice 2
                              </SelectItem>
                              <SelectItem value="neutral">
                                Gender Neutral
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select accent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="american">American</SelectItem>
                              <SelectItem value="british">British</SelectItem>
                              <SelectItem value="australian">
                                Australian
                              </SelectItem>
                              <SelectItem value="indian">Indian</SelectItem>
                              <SelectItem value="spanish">Spanish</SelectItem>
                              <SelectItem value="french">French</SelectItem>
                              <SelectItem value="german">German</SelectItem>
                              <SelectItem value="japanese">Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="speakingStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Speaking Style</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="professional">
                                Professional
                              </SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="enthusiastic">
                                Enthusiastic
                              </SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="speakingRate"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Speaking Rate</FormLabel>
                            <span className="text-sm text-primary-foreground/70">
                              Normal
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              defaultValue={[field.value]}
                              max={100}
                              step={1}
                              onValueChange={([value]) => field.onChange(value)}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-primary-foreground/50">
                            <span>Slower</span>
                            <span>Faster</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pitch"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Pitch</FormLabel>
                            <span className="text-sm text-primary-foreground/70">
                              Medium
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              defaultValue={[field.value]}
                              max={100}
                              step={1}
                              onValueChange={([value]) => field.onChange(value)}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-primary-foreground/50">
                            <span>Lower</span>
                            <span>Higher</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-primary/5 rounded-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-primary-foreground">
                          Voice Preview
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          type="button"
                          onClick={handleVoicePreview}
                          disabled={isGeneratingPreview}
                        >
                          {isGeneratingPreview ? (
                            <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          {isGeneratingPreview
                            ? "Generating..."
                            : "Play Sample"}
                        </Button>
                      </div>
                      <p className="text-primary-foreground/70 text-sm italic">
                        "Welcome to our event! I'm your AI host and I'll be
                        guiding you through today's program."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-primary/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-primary-foreground">
                        Additional Voices
                      </h3>
                      <p className="text-primary-foreground/70 text-sm">
                        Add secondary voices for different segments of your
                        event
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-white"
                      type="button"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Voice
                    </Button>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-md text-center text-primary-foreground/50">
                    No additional voices added yet. Click "Add Voice" to create
                    multiple AI hosts for your event.
                  </div>
                </div>

                <div className="border-t border-primary/10 pt-6">
                  <FormField
                    control={form.control}
                    name="multilingual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Multilingual Support
                          </FormLabel>
                          <FormDescription>
                            Enable support for multiple languages
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-primary-foreground/70"
                    onClick={() => setActiveTab("details")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                    onClick={() => nextTab("voice")}
                  >
                    Save and Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Script Tab */}
          <TabsContent value="script">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Script Generation</CardTitle>
                <CardDescription>
                  Create or customize your event script
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <FormField
                  control={form.control}
                  name="scriptTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Script Template</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">
                            Standard Emcee
                          </SelectItem>
                          <SelectItem value="formal">
                            Formal Corporate
                          </SelectItem>
                          <SelectItem value="casual">
                            Casual & Friendly
                          </SelectItem>
                          <SelectItem value="educational">
                            Educational Event
                          </SelectItem>
                          <SelectItem value="minimal">
                            Minimal Intervention
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a script template as your starting point
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoGenerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          AI Script Generation
                        </FormLabel>
                        <FormDescription>
                          Automatically generate a script based on your event
                          details
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Script Content</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={handleScriptGeneration}
                    disabled={
                      isGeneratingScript || !form.getValues("autoGenerate")
                    }
                  >
                    {isGeneratingScript ? (
                      <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-1" />
                    )}
                    {isGeneratingScript ? "Generating..." : "Generate Script"}
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="customScript"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={
                            form.getValues("autoGenerate")
                              ? "Your AI-generated script will appear here. You can edit it further if needed."
                              : "Write your custom script here..."
                          }
                          rows={12}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use [PAUSE], [EMPHASIS], and [BREATHE] markers to
                        control delivery
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-primary-foreground/70"
                    onClick={() => setActiveTab("voice")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                    onClick={() => nextTab("script")}
                  >
                    Save and Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Event Preview</CardTitle>
                <CardDescription>
                  Review your event details before finalizing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Event Name
                      </h3>
                      <p className="text-lg font-semibold">
                        {form.getValues("eventName")}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Event Type
                      </h3>
                      <p>{form.getValues("eventType")}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Date
                      </h3>
                      <p>
                        {form.getValues("startDate")}
                        {form.getValues("endDate")
                          ? ` to ${form.getValues("endDate")}`
                          : ""}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Format
                      </h3>
                      <p>{form.getValues("eventFormat") || "Not specified"}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Expected Attendees
                      </h3>
                      <p>
                        {form.getValues("expectedAttendees") || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Voice Settings
                      </h3>
                      <p>
                        {form.getValues("primaryVoice") || "Default"} ·
                        {form.getValues("accent")
                          ? ` ${form.getValues("accent")} accent ·`
                          : ""}
                        {form.getValues("speakingStyle")
                          ? ` ${form.getValues("speakingStyle")} style`
                          : ""}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Language Support
                      </h3>
                      <p>
                        {form.getValues("multilingual")
                          ? "Multilingual"
                          : "English only"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-foreground/70">
                        Description
                      </h3>
                      <p className="text-sm">
                        {form.getValues("eventDescription") ||
                          "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-primary/10 pt-4 mt-4">
                  <h3 className="font-medium mb-2">Script Preview</h3>
                  <div className="bg-primary/5 p-4 rounded-md max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {form.getValues("customScript") ||
                        "No script content available."}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-primary-foreground/70"
                    onClick={() => setActiveTab("script")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                  >
                    Create Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
