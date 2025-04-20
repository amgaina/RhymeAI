import { useState } from "react";
import {
  createEvent,
  createScriptSegment,
  generateScript,
  updateVoiceSettings,
  finalizeEvent,
} from "@/app/actions/event";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  ScriptSegment,
  ScriptSegmentStatus,
  VoiceSettings,
  VoiceSettingsTone,
} from "@/types/event";

export type EventFormData = {
  eventName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  expectedAttendees: string;
  eventDescription: string;
  voiceType: string;
  language: string;
};

export type EventInfo = {
  name: string;
  type: string;
  date: string;
  location: string;
  hasStructure: boolean;
  hasVoiceSettings: boolean;
  hasLanguageSettings: boolean;
};

export default function useEventCreation() {
  const router = useRouter();
  const { toast } = useToast();

  // Track event information state
  const [eventInfo, setEventInfo] = useState<EventInfo>({
    name: "",
    type: "",
    date: "",
    location: "",
    hasStructure: false,
    hasVoiceSettings: false,
    hasLanguageSettings: false,
  });

  // Track script and audio generation state
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(
    null
  );

  // Track progress through the event creation process
  const [progress, setProgress] = useState(20);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // New state for collected event data
  const [collectedEventData, setCollectedEventData] = useState<Record<
    string,
    string
  > | null>(null);

  // For form input handling
  const [formData, setFormData] = useState<EventFormData>({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventLocation: "",
    expectedAttendees: "",
    eventDescription: "",
    voiceType: "",
    language: "",
  });

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate mock script segments for demonstration
  const generateMockSegments = () => {
    const eventName = eventInfo.name || formData.eventName || "the event";

    setScriptSegments([
      {
        id: 1,
        type: "introduction",
        content: `Welcome to ${eventName}! I'm your AI host, and I'm excited to guide you through today's program. We have an incredible lineup of speakers, engaging sessions, and valuable networking opportunities planned for you.`,
        audio: "mock-audio-url-1.mp3",
        status: "generated" as ScriptSegmentStatus,
        order: 1,
      },
      {
        id: 2,
        type: "agenda",
        content: `Let me walk you through today's agenda. We'll start with our keynote presentation, followed by breakout sessions on various topics. After lunch, we'll have panel discussions, and we'll conclude with networking opportunities and closing remarks.`,
        audio: null,
        status: "draft" as ScriptSegmentStatus,
        order: 2,
      },
      {
        id: 3,
        type: "speaker introduction",
        content: `I'm pleased to introduce our keynote speaker, Dr. Jane Smith, who is a renowned expert in artificial intelligence and machine learning. Dr. Smith is the Chief Technology Officer at Tech Innovations and has published numerous research papers on AI applications in healthcare.`,
        audio: null,
        status: "draft" as ScriptSegmentStatus,
        order: 3,
      },
    ]);
  };

  // Handle event data collection from chat
  const handleEventDataCollected = (data: Record<string, string>) => {
    console.log("Event data collected:", data);
    setCollectedEventData(data);

    // Update event info with collected data
    setEventInfo((prev) => ({
      ...prev,
      name: data.eventName || prev.name,
      type: data.eventType || prev.type,
      date: data.eventDate || prev.date,
      location: data.eventLocation || prev.location,
      hasStructure: true,
      hasVoiceSettings: !!data.voicePreferences,
      hasLanguageSettings: !!data.languagePreferences,
    }));

    // Update progress
    setProgress((prev) => Math.min(prev + 40, 100));

    // Generate script based on collected data
    setIsGeneratingScript(true);
    generateScriptFromEventData(data);
  };

  // Generate script segments from event data
  const generateScriptFromEventData = (data: Record<string, string>) => {
    const eventName = data.eventName || eventInfo.name || "the event";
    const eventType = data.eventType || eventInfo.type || "event";
    const eventDescription = data.eventDescription || "this special occasion";
    const speakers = data.speakerInformation
      ? JSON.stringify(data.speakerInformation).split(",")
      : ["our featured speakers"];

    // Create appropriate script segments based on event type
    const segments: ScriptSegment[] = [
      {
        id: 1,
        type: "introduction",
        content: `Welcome to ${eventName}! I'm your AI host, and I'm delighted to guide you through today's ${eventType.toLowerCase()}. ${eventDescription}`,
        audio: null,
        status: "draft" as ScriptSegmentStatus,
        order: 1,
      },
      {
        id: 2,
        type: "agenda",
        content: `Let me walk you through today's agenda. We have carefully designed this ${eventType.toLowerCase()} to provide maximum value and engagement for all attendees.`,
        audio: null,
        status: "draft" as ScriptSegmentStatus,
        order: 2,
      },
    ];

    // Set script segments with timeout to simulate processing
    setTimeout(() => {
      setScriptSegments(segments);
      setIsGeneratingScript(false);
    }, 2000);
  };

  // Handle updating a script segment
  const handleUpdateSegment = (segmentId: number, content: string) => {
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, content, status: "editing" as ScriptSegmentStatus }
          : segment
      )
    );
  };

  // Finalize event and redirect to dashboard
  const submitFinalEvent = async () => {
    // Prepare event data for saving
    const formDataObj = new FormData();
    formDataObj.append("eventName", eventInfo.name || formData.eventName);
    formDataObj.append("eventType", eventInfo.type || formData.eventType);
    formDataObj.append("eventDate", eventInfo.date || formData.eventDate);
    formDataObj.append(
      "eventLocation",
      eventInfo.location || formData.eventLocation
    );
    formDataObj.append("eventDescription", formData.eventDescription);
    formDataObj.append("expectedAttendees", formData.expectedAttendees);
    formDataObj.append("language", formData.language || "English");
    formDataObj.append("voiceType", formData.voiceType);

    // Create event in database
    const result = await createEvent(formDataObj);

    if (result.success) {
      toast({
        title: "Event created successfully!",
        description: "Your event has been saved to the database.",
        variant: "default",
      });

      if (scriptSegments.length > 0 && result.eventId) {
        try {
          // Determine tone from voice type
          let tone: VoiceSettingsTone = "casual";

          if (formData.voiceType?.toLowerCase().includes("professional")) {
            tone = "professional";
          } else if (formData.voiceType?.toLowerCase().includes("energetic")) {
            tone = "energetic";
          } else if (formData.voiceType?.toLowerCase().includes("calm")) {
            tone = "calm";
          } else if (
            formData.voiceType?.toLowerCase().includes("authoritative")
          ) {
            tone = "authoritative";
          }

          // Save voice settings
          const voiceSettings: VoiceSettings = {
            gender: "neutral",
            age: "middle-aged",
            tone: tone,
            speed: "medium",
          };

          await updateVoiceSettings(result.eventId, voiceSettings);

          // Either generate script or save existing segments
          if (collectedEventData) {
            await generateScript(result.eventId);
          } else {
            // Save existing script segments
            for (const segment of scriptSegments) {
              // Ensure status is a valid ScriptSegmentStatus before passing to API
              const segmentStatus: ScriptSegmentStatus =
                segment.status === "generated" ||
                segment.status === "generating" ||
                segment.status === "editing" ||
                segment.status === "draft"
                  ? segment.status
                  : "draft";

              await createScriptSegment(result.eventId, {
                type: segment.type,
                content: segment.content,
                status: segmentStatus,
                audio_url: segment.audio || null,
                timing: 30,
                order: segment.id,
              });
            }
          }

          // Mark event as finalized
          await finalizeEvent(result.eventId);
        } catch (error) {
          console.error("Error saving script:", error);
          toast({
            title: "Warning",
            description:
              "Event was created but there was an issue saving the script segments.",
            variant: "destructive",
          });
        }
      }

      // Redirect to the dashboard
      router.push("/dashboard");
    } else {
      toast({
        title: "Error creating event",
        description: result.error || "There was a problem creating your event.",
        variant: "destructive",
      });
    }
  };

  return {
    eventInfo,
    setEventInfo,
    scriptSegments,
    setScriptSegments,
    selectedSegment,
    setSelectedSegment,
    progress,
    setProgress,
    formData,
    setFormData,
    isGeneratingScript,
    collectedEventData,
    handleFormChange,
    generateMockSegments,
    handleEventDataCollected,
    handleUpdateSegment,
    submitFinalEvent,
  };
}
