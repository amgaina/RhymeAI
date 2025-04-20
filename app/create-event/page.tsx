"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Calendar,
  Mic2,
  Clock,
  Save,
  Play,
  Plus,
  Users,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { createEvent } from "../actions/event";

export default function CreateEvent() {
  const router = useRouter();
  const { toast } = useToast();

  // State for form values
  const [formData, setFormData] = useState({
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
  });

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Create event using form data
  const handleCreateEventForm = async () => {
    try {
      // Prepare form data
      const eventFormData = new FormData();
      eventFormData.append("eventName", formData.eventName);
      eventFormData.append("eventType", formData.eventType);
      eventFormData.append("eventDate", formData.startDate);
      eventFormData.append("eventLocation", ""); // Fill in if you collect location
      eventFormData.append("eventDescription", formData.eventDescription);
      eventFormData.append("expectedAttendees", formData.expectedAttendees);
      eventFormData.append("language", "English"); // Default to English
      eventFormData.append(
        "voiceType",
        formData.speakingStyle || "Professional"
      );

      // Create event in database
      const result = await createEvent(eventFormData);

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

  const handleCreateEvent = () => {
    router.push("/event-creation");
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <Link
            href="/dashboard"
            className="text-primary-foreground/70 hover:text-primary-foreground inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-primary-foreground mt-4">
            Create New Event
          </h1>
          <p className="text-primary-foreground/70">
            Set up your AI emcee for your upcoming event
          </p>
        </div>

        <div
          className="flex flex-col items-center justify-center space-y-8 my-10 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-2xl font-bold text-primary-foreground">
            How would you like to create your event?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <Card className="border border-primary/10 hover:border-accent transition-all hover:shadow-md cursor-pointer hover-scale rhyme-card">
              <CardHeader>
                <CardTitle>Use Form Builder</CardTitle>
                <CardDescription>
                  Create your event step by step using our structured form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
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
                          <div className="space-y-2">
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input
                              id="event-name"
                              placeholder="e.g., Tech Conference 2025"
                              onChange={(e) =>
                                handleInputChange("eventName", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select
                              onValueChange={(value) =>
                                handleInputChange("eventType", value)
                              }
                            >
                              <SelectTrigger id="event-type">
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
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
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              type="date"
                              onChange={(e) =>
                                handleInputChange("startDate", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              type="date"
                              onChange={(e) =>
                                handleInputChange("endDate", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select
                              onValueChange={(value) =>
                                handleInputChange("timezone", value)
                              }
                            >
                              <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
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
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="event-description">
                            Event Description
                          </Label>
                          <Textarea
                            id="event-description"
                            placeholder="Provide a brief description of your event..."
                            rows={4}
                            onChange={(e) =>
                              handleInputChange(
                                "eventDescription",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="expected-attendees">
                              Expected Attendees
                            </Label>
                            <Input
                              id="expected-attendees"
                              type="number"
                              placeholder="e.g., 500"
                              onChange={(e) =>
                                handleInputChange(
                                  "expectedAttendees",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="event-format">Event Format</Label>
                            <Select
                              onValueChange={(value) =>
                                handleInputChange("eventFormat", value)
                              }
                            >
                              <SelectTrigger id="event-format">
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in-person">
                                  In-Person
                                </SelectItem>
                                <SelectItem value="virtual">Virtual</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                            onClick={handleCreateEventForm}
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
                            <div className="space-y-2">
                              <Label>Primary Voice</Label>
                              <Select
                                onValueChange={(value) =>
                                  handleInputChange("primaryVoice", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select voice type" />
                                </SelectTrigger>
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
                            </div>

                            <div className="space-y-2">
                              <Label>Accent</Label>
                              <Select
                                onValueChange={(value) =>
                                  handleInputChange("accent", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select accent" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="american">
                                    American
                                  </SelectItem>
                                  <SelectItem value="british">
                                    British
                                  </SelectItem>
                                  <SelectItem value="australian">
                                    Australian
                                  </SelectItem>
                                  <SelectItem value="indian">Indian</SelectItem>
                                  <SelectItem value="spanish">
                                    Spanish
                                  </SelectItem>
                                  <SelectItem value="french">French</SelectItem>
                                  <SelectItem value="german">German</SelectItem>
                                  <SelectItem value="japanese">
                                    Japanese
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Speaking Style</Label>
                              <Select
                                onValueChange={(value) =>
                                  handleInputChange("speakingStyle", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">
                                    Professional
                                  </SelectItem>
                                  <SelectItem value="friendly">
                                    Friendly
                                  </SelectItem>
                                  <SelectItem value="enthusiastic">
                                    Enthusiastic
                                  </SelectItem>
                                  <SelectItem value="formal">Formal</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Speaking Rate</Label>
                                <span className="text-sm text-primary-foreground/70">
                                  Normal
                                </span>
                              </div>
                              <Slider
                                defaultValue={[50]}
                                max={100}
                                step={1}
                                onValueChange={(value) =>
                                  handleInputChange("speakingRate", value[0])
                                }
                              />
                              <div className="flex justify-between text-xs text-primary-foreground/50">
                                <span>Slower</span>
                                <span>Faster</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Pitch</Label>
                                <span className="text-sm text-primary-foreground/70">
                                  Medium
                                </span>
                              </div>
                              <Slider
                                defaultValue={[50]}
                                max={100}
                                step={1}
                                onValueChange={(value) =>
                                  handleInputChange("pitch", value[0])
                                }
                              />
                              <div className="flex justify-between text-xs text-primary-foreground/50">
                                <span>Lower</span>
                                <span>Higher</span>
                              </div>
                            </div>

                            <div className="p-4 bg-primary/5 rounded-md">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-primary-foreground">
                                  Voice Preview
                                </h3>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Play Sample
                                </Button>
                              </div>
                              <p className="text-primary-foreground/70 text-sm italic">
                                "Welcome to our event! I'm your AI host and I'll
                                be guiding you through today's program."
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
                                Add secondary voices for different segments of
                                your event
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-accent hover:bg-accent/90 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Voice
                            </Button>
                          </div>

                          <div className="bg-primary/5 p-4 rounded-md text-center text-primary-foreground/50">
                            No additional voices added yet. Click "Add Voice" to
                            create multiple AI hosts for your event.
                          </div>
                        </div>

                        <div className="border-t border-primary/10 pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-primary-foreground">
                                Multilingual Support
                              </h3>
                              <p className="text-primary-foreground/70 text-sm">
                                Enable support for multiple languages
                              </p>
                            </div>
                            <Switch
                              onCheckedChange={(checked) =>
                                handleInputChange("multilingual", checked)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button
                            variant="outline"
                            className="text-primary-foreground/70"
                          >
                            Back
                          </Button>
                          <Button
                            className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                            onClick={handleCreateEventForm}
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
                        <CardTitle>Event Script</CardTitle>
                        <CardDescription>
                          Create the script for your AI emcee to follow
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 px-0">
                        <div className="flex items-center space-x-4 mb-4">
                          <Button
                            variant="outline"
                            className="text-primary-foreground"
                          >
                            Use Template
                          </Button>
                          <Button
                            variant="outline"
                            className="text-primary-foreground"
                          >
                            Import Script
                          </Button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label>Opening Remarks</Label>
                            <Textarea
                              placeholder="Welcome message and introduction..."
                              rows={4}
                              defaultValue="Welcome to our Tech Conference 2025! I'm your AI host for today's event. We have an exciting lineup of speakers and sessions planned for you over the next three days. Before we begin, I'd like to go over a few housekeeping items..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Session Introductions</Label>
                            <Textarea
                              placeholder="How to introduce each session..."
                              rows={4}
                              defaultValue="Our next session is titled 'The Future of AI in Healthcare' presented by Dr. Jane Smith, who is the Chief Innovation Officer at MedTech Solutions. Dr. Smith has over 15 years of experience in developing AI applications for medical diagnostics..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Speaker Introductions</Label>
                            <Textarea
                              placeholder="How to introduce speakers..."
                              rows={4}
                              defaultValue="I'm pleased to introduce our keynote speaker, John Anderson. John is the founder and CEO of Future Technologies, a company that has revolutionized the way we think about sustainable energy solutions. With over 20 years of experience in the field..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Transitions</Label>
                            <Textarea
                              placeholder="Transitions between sessions..."
                              rows={4}
                              defaultValue="Thank you for that insightful presentation. We'll now take a short 15-minute break before our next session. Please be back in the main hall by 11:15 AM for our panel discussion on 'Ethical Considerations in AI Development'..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Closing Remarks</Label>
                            <Textarea
                              placeholder="Closing message..."
                              rows={4}
                              defaultValue="As we come to the end of our conference, I'd like to thank all of our speakers, sponsors, and most importantly, you, our attendees. We hope you found the sessions informative and inspiring. Please don't forget to fill out the feedback form that has been sent to your email..."
                            />
                          </div>
                        </div>

                        <div className="border-t border-primary/10 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium text-primary-foreground">
                                Advanced Settings
                              </h3>
                              <p className="text-primary-foreground/70 text-sm">
                                Fine-tune how your script is delivered
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-md">
                              <div>
                                <h4 className="font-medium text-primary-foreground">
                                  Pause Detection
                                </h4>
                                <p className="text-primary-foreground/70 text-sm">
                                  Automatically detect and add natural pauses
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-md">
                              <div>
                                <h4 className="font-medium text-primary-foreground">
                                  Emphasis Detection
                                </h4>
                                <p className="text-primary-foreground/70 text-sm">
                                  Automatically emphasize important words
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button
                            variant="outline"
                            className="text-primary-foreground/70"
                          >
                            Back
                          </Button>
                          <Button
                            className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                            onClick={handleCreateEventForm}
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
                        <CardTitle>Preview Your AI Emcee</CardTitle>
                        <CardDescription>
                          Listen to how your AI emcee will sound during your
                          event
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 px-0">
                        <div className="bg-primary p-6 rounded-lg animate-fade-in">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="outline"
                                className="text-primary-foreground/70"
                              >
                                Back
                              </Button>
                              <Button className="bg-cta hover:bg-cta/90 text-white btn-pulse">
                                Finalize Event
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card
              className="border border-primary/10 hover:border-accent transition-all hover:shadow-md cursor-pointer hover-scale rhyme-card"
              onClick={handleCreateEvent}
            >
              <CardHeader>
                <CardTitle>Chat with AI Assistant</CardTitle>
                <CardDescription>
                  Let our AI help you create your event through natural
                  conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Mic2 className="h-12 w-12 text-accent" />
                </div>
                <p className="text-center text-primary-foreground/70 mb-6">
                  Our AI will guide you through creating your event script,
                  collecting all necessary information through a natural
                  conversation.
                </p>
                <Button
                  className="bg-cta hover:bg-cta/90 text-white w-full btn-pulse"
                  onClick={handleCreateEvent}
                >
                  Start Creating with AI
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
