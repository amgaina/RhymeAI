import { useState } from "react";
import { ScriptSegment } from "@/components/ScriptEditor";

export interface EventInfo {
  name: string;
  type: string;
  date: string;
  location: string;
  hasStructure: boolean;
  hasVoiceSettings: boolean;
  hasLanguageSettings: boolean;
}

export interface FormData {
  eventName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  expectedAttendees: string;
  eventDescription: string;
  voiceType: string;
  language: string;
}

export function useEventCreation() {
  // Event information state
  const [eventInfo, setEventInfo] = useState<EventInfo>({
    name: "",
    type: "",
    date: "",
    location: "",
    hasStructure: false,
    hasVoiceSettings: false,
    hasLanguageSettings: false,
  });

  // Progress tracking
  const [progress, setProgress] = useState(20);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventLocation: "",
    expectedAttendees: "",
    eventDescription: "",
    voiceType: "",
    language: "",
  });

  // Script generation state
  const [scriptSegments, setScriptSegments] = useState<ScriptSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(
    null
  );
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [collectedEventData, setCollectedEventData] = useState<Record<
    string,
    string
  > | null>(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update event info
    setEventInfo((prev) => ({
      ...prev,
      name: formData.eventName,
      type: formData.eventType,
      date: formData.eventDate,
      location: formData.eventLocation,
      hasStructure: true,
      hasVoiceSettings: !!formData.voiceType,
      hasLanguageSettings: !!formData.language,
    }));

    // Update progress
    setProgress((prev) => Math.min(prev + 40, 100));

    // Generate mock script segments
    generateMockSegments();
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setEventInfo((prev) => ({
        ...prev,
        hasStructure: true,
      }));
      setProgress((prev) => Math.min(prev + 20, 100));

      // Simulate extracting event info from file
      setTimeout(() => {
        setEventInfo((prev) => ({
          ...prev,
          name: file.name.replace(/\.(pdf|docx|txt|md)$/, ""),
          type: "Conference",
          date: "2025-05-15",
        }));

        generateMockSegments();
      }, 500);
    }
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
        status: "generated",
      },
      {
        id: 2,
        type: "agenda",
        content: `Let me walk you through today's agenda. We'll start with our keynote presentation, followed by breakout sessions on various topics. After lunch, we'll have panel discussions, and we'll conclude with networking opportunities and closing remarks.`,
        audio: null,
        status: "draft",
      },
      {
        id: 3,
        type: "speaker introduction",
        content: `I'm pleased to introduce our keynote speaker, Dr. Jane Smith, who is a renowned expert in artificial intelligence and machine learning. Dr. Smith is the Chief Technology Officer at Tech Innovations and has published numerous research papers on AI applications in healthcare.`,
        audio: null,
        status: "draft",
      },
    ]);
  };

  // Handle event data collection from chat
  const handleEventDataCollected = (data: Record<string, string>) => {
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
    const eventDate = data.eventDate || eventInfo.date || "the scheduled date";
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
        status: "draft",
      },
      {
        id: 2,
        type: "agenda",
        content: `Let me walk you through today's agenda. We have carefully designed this ${eventType.toLowerCase()} to provide maximum value and engagement for all attendees.`,
        audio: null,
        status: "draft",
      },
      {
        id: 3,
        type: "speaker introduction",
        content: `I'm pleased to introduce our speakers for today. ${
          speakers.length > 1
            ? "They bring extensive expertise and insights to our discussions."
            : "They bring extensive expertise and insights to our discussion."
        }`,
        audio: null,
        status: "draft",
      },
      {
        id: 4,
        type: "transitions",
        content: `As we transition between segments of our ${eventType.toLowerCase()}, please feel free to use this time to reflect on what you've learned or to prepare questions for our upcoming sessions.`,
        audio: null,
        status: "draft",
      },
      {
        id: 5,
        type: "closing",
        content: `Thank you all for participating in ${eventName}. We hope you found this ${eventType.toLowerCase()} valuable and informative. We look forward to seeing you at future events!`,
        audio: null,
        status: "draft",
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
          ? { ...segment, content, status: "editing" }
          : segment
      )
    );
  };

  return {
    eventInfo,
    setEventInfo,
    progress,
    setProgress,
    formData,
    handleFormChange,
    handleFormSubmit,
    scriptSegments,
    setScriptSegments,
    selectedSegment,
    setSelectedSegment,
    isGeneratingScript,
    collectedEventData,
    uploadedFile,
    handleFileUpload,
    handleEventDataCollected,
    handleUpdateSegment,
    generateScriptFromEventData,
  };
}
