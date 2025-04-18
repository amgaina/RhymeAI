"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic2,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Play,
  Edit,
  Save,
  ChevronRight,
  Volume2,
  FileAudio,
  Presentation,
  ArrowLeft,
  Settings,
  Loader2,
  Pause,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
import { useRouter } from "next/navigation";
import { RhymeAIChat } from "@/components/RhymeAIChat";
import ScriptEditor, { ScriptSegment } from "@/components/ScriptEditor";
import AudioPreview from "@/components/AudioPreview";
import Link from "next/link";

export default function EventCreation() {
  const router = useRouter();

  // Track event information state
  const [eventInfo, setEventInfo] = useState({
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
  const [activeTab, setActiveTab] = useState("chat");

  // New state for collected event data
  const [collectedEventData, setCollectedEventData] = useState<Record<
    string,
    string
  > | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // For file upload handling
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Text-to-speech state
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsUtterance, setTtsUtterance] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [ttsSupported, setTtsSupported] = useState(true);

  // For form input handling
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventLocation: "",
    expectedAttendees: "",
    eventDescription: "",
    voiceType: "",
    language: "",
  });

  // Initialize speech synthesis and load available voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("speechSynthesis" in window)) {
        console.log("Text-to-speech not supported in this browser");
        setTtsSupported(false);
        return;
      }

      // Set available voices when they load
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          // Set default voice
          const defaultVoice =
            voices.find((voice) => voice.default) || voices[0];
          setSelectedVoice(defaultVoice);

          // Update form data with default voice name
          setFormData((prev) => ({
            ...prev,
            voiceType: defaultVoice.name,
          }));
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Initial load of voices (works in Firefox)
      loadVoices();

      // Cleanup function to cancel any active speech when component unmounts
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Play text using speech synthesis
  const speakText = (text: string) => {
    if (!ttsSupported || !selectedVoice) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance with selected voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Set up events
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      setIsPlaying(false);
    };

    // Store utterance in state
    setTtsUtterance(utterance);

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  // Stop current speech
  const stopSpeaking = () => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Change the voice
  const changeVoice = (voiceName: string) => {
    const voice = availableVoices.find((v) => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);

      // Update form data
      setFormData((prev) => ({
        ...prev,
        voiceType: voice.name,
        language: voice.lang,
      }));

      // Update event info
      setEventInfo((prev) => ({
        ...prev,
        hasVoiceSettings: true,
        hasLanguageSettings: true,
      }));

      // If something is currently being spoken, update the voice
      if (isPlaying && ttsUtterance) {
        stopSpeaking();
        speakText(ttsUtterance.text);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Update event structure status
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

        // Generate mock script segments
        generateMockSegments();
      }, 500);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If the voice type changes, update the selected voice
    if (field === "voiceType" && availableVoices.length > 0) {
      changeVoice(value);
    }
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

    // Switch to chat tab
    setActiveTab("chat");

    // Generate mock script segments
    generateMockSegments();
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

      // Use TTS to announce that the script is ready
      if (ttsSupported && selectedVoice) {
        speakText(
          "Your event script is now ready. You can review and edit each segment."
        );
      }
    }, 2000);
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

  // Handle generating audio for a script segment
  const handleGenerateAudio = (segmentId: number) => {
    // Set status to generating
    setScriptSegments((prev) =>
      prev.map((segment) =>
        segment.id === segmentId
          ? { ...segment, status: "generating" }
          : segment
      )
    );

    // Get the segment content
    const segment = scriptSegments.find((s) => s.id === segmentId);
    if (!segment) return;

    // For real implementation, this would call an API to generate audio
    // For now, we'll use the browser's TTS as a placeholder
    if (ttsSupported && selectedVoice) {
      // Create an AudioContext to record TTS audio
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const mediaStreamDest = audioContext.createMediaStreamDestination();

        // Record the TTS for demonstration purposes
        const mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Update segment with generated audio
          setScriptSegments((prev) =>
            prev.map((s) =>
              s.id === segmentId
                ? {
                    ...s,
                    status: "generated",
                    audio: audioUrl,
                  }
                : s
            )
          );

          // If all segments have audio, increase progress
          if (
            scriptSegments.every(
              (s) => s.id === segmentId || s.status === "generated"
            )
          ) {
            setProgress((prev) => Math.min(prev + 15, 100));
          }
        };

        // Start recording
        mediaRecorder.start();

        // Speak the text (this is a simplified placeholder; real implementation would use an API)
        speakText(segment.content);

        // Stop recording after a few seconds
        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000);
      } catch (error) {
        console.error("Error creating audio:", error);

        // Fallback to mock implementation if recording fails
        simulateAudioGeneration(segmentId);
      }
    } else {
      // Fallback to mock implementation
      simulateAudioGeneration(segmentId);
    }
  };

  // Simulate audio generation with timeout (fallback method)
  const simulateAudioGeneration = (segmentId: number) => {
    setTimeout(() => {
      setScriptSegments((prev) =>
        prev.map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                status: "generated",
                audio: `mock-audio-url-${segmentId}.mp3`,
              }
            : segment
        )
      );

      // If all segments have audio, increase progress
      if (scriptSegments.every((segment) => segment.status === "generated")) {
        setProgress((prev) => Math.min(prev + 15, 100));
      }
    }, 2000);
  };

  // Handle playing audio for a script segment
  const handlePlayAudio = (audioUrl: string) => {
    const segment = scriptSegments.find((s) => s.audio === audioUrl);
    if (segment) {
      setSelectedSegment(segment);

      // If it's a mock URL, use TTS to play the content
      if (audioUrl.startsWith("mock-audio-url")) {
        speakText(segment.content);
      }
    }
  };

  // Finalize event and redirect to dashboard
  const finalizeEvent = () => {
    // Prepare event data for saving
    const eventData = {
      id: Date.now().toString(),
      name: eventInfo.name || formData.eventName,
      type: eventInfo.type || formData.eventType,
      date: eventInfo.date || formData.eventDate,
      location: eventInfo.location || formData.eventLocation,
      description: formData.eventDescription,
      voiceSettings: {
        type: formData.voiceType,
        language: formData.language,
      },
      scriptSegments: scriptSegments,
      createdAt: new Date().toISOString(),
      status: "ready",
    };

    // In a real implementation, this would save to an API
    console.log("Saving event data:", eventData);

    // For now, let's store in localStorage for demo purposes
    if (typeof window !== "undefined") {
      const existingEvents = JSON.parse(
        localStorage.getItem("rhymeai-events") || "[]"
      );
      localStorage.setItem(
        "rhymeai-events",
        JSON.stringify([...existingEvents, eventData])
      );
    }

    alert("Event finalized! Redirecting to dashboard...");
    // Redirect to the dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mic2 className="h-6 w-6 text-terracotta" />
            <span className="text-xl font-bold">RhymeAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-accent flex items-center gap-2"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              JD
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Link
          href="/dashboard"
          className="text-primary-foreground/70 hover:text-primary-foreground inline-flex items-center mb-6 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar for event creation mode */}
          <div className="w-full lg:w-80 animate-slide-up">
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
                        {eventInfo.hasStructure
                          ? "Structure provided"
                          : "Not provided"}
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
                          <span className="font-medium">Name:</span>{" "}
                          {eventInfo.name}
                        </p>
                        {eventInfo.type && (
                          <p>
                            <span className="font-medium">Type:</span>{" "}
                            {eventInfo.type}
                          </p>
                        )}
                        {eventInfo.date && (
                          <p>
                            <span className="font-medium">Date:</span>{" "}
                            {eventInfo.date}
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
                        {eventInfo.hasVoiceSettings
                          ? "Voice selected"
                          : "Not selected"}
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
                              scriptSegments.filter(
                                (s) => s.status === "generated"
                              ).length
                            } of ${scriptSegments.length} segments`
                          : "Not started"}
                      </span>
                      {scriptSegments.length > 0 ? (
                        scriptSegments.every(
                          (s) => s.status === "generated"
                        ) ? (
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
                    onClick={finalizeEvent}
                  >
                    {progress >= 75
                      ? "Finalize Event"
                      : "Complete Required Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div
            className="flex-1 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Card className="rhyme-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Create Your Event</CardTitle>
                <CardDescription>
                  Let's create an AI host for your event - provide details
                  through chat, upload a file, or fill out a form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-3 mb-6 bg-primary/5">
                    <TabsTrigger
                      value="chat"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <Mic2 className="h-4 w-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="form"
                      className="flex gap-2 data-[state=active]:bg-accent data-[state=active]:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Form</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Chat Tab Content */}
                  <TabsContent
                    value="chat"
                    className="focus-visible:outline-none"
                  >
                    <div className="grid grid-cols-1 gap-6">
                      {isGeneratingScript && (
                        <div className="bg-primary/5 p-4 rounded-lg flex items-center gap-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-primary-foreground">
                            Generating your event script based on collected
                            information...
                          </p>
                        </div>
                      )}

                      <RhymeAIChat
                        className="border-0 shadow-none"
                        title="Event Creation Assistant"
                        description="I'll help you create your AI host script by collecting all necessary information about your event."
                        initialMessage="Hi! I'm your RhymeAI event assistant. I'll help you create a script for your event's AI host. To create an effective script, I need to collect some essential information about your event. Let's start with the basics:

1. What's the name of your event?
2. What type of event is it? (conference, webinar, workshop, etc.)
3. When will the event take place?
4. Where will it be held?

You can share as much detail as you'd like - the more information you provide, the better I can tailor the AI host script to your specific event!"
                        placeholder="Tell me about your event..."
                        eventContext={{
                          purpose:
                            "To create a customized AI host script for an event",
                          requiredFields: [
                            "eventName",
                            "eventType",
                            "eventDate",
                            "eventLocation",
                            "expectedAttendees",
                            "eventDescription",
                            "speakerInformation",
                            "specialInstructions",
                            "voicePreferences",
                            "languagePreferences",
                          ],
                          contextType: "event-creation",
                          additionalInfo: {
                            currentStep: "information-gathering",
                            nextStep: "script-generation",
                          },
                        }}
                        onEventDataCollected={handleEventDataCollected}
                      />

                      {scriptSegments.length > 0 && (
                        <>
                          <div className="border-t border-primary/10 pt-6 mt-2">
                            <h3 className="text-xl font-bold text-primary-foreground mb-4 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-accent" />
                              Generated Script
                              {collectedEventData && (
                                <span className="text-sm font-normal text-primary-foreground/70 ml-2">
                                  Based on your{" "}
                                  {collectedEventData.eventType || "event"}{" "}
                                  details
                                </span>
                              )}
                            </h3>
                            <ScriptEditor
                              segments={scriptSegments}
                              onUpdateSegment={handleUpdateSegment}
                              onGenerateAudio={handleGenerateAudio}
                              onPlayAudio={handlePlayAudio}
                            />
                          </div>

                          {selectedSegment && (
                            <AudioPreview
                              title={`Preview: ${selectedSegment.type}`}
                              scriptText={selectedSegment.content}
                              audioUrl={selectedSegment.audio}
                              onTtsPlay={
                                selectedSegment.audio?.startsWith(
                                  "mock-audio-url"
                                )
                                  ? () => speakText(selectedSegment.content)
                                  : undefined
                              }
                              onTtsStop={
                                selectedSegment.audio?.startsWith(
                                  "mock-audio-url"
                                )
                                  ? stopSpeaking
                                  : undefined
                              }
                              isPlaying={isPlaying}
                            />
                          )}

                          <div className="flex justify-end">
                            <Button
                              onClick={finalizeEvent}
                              disabled={progress < 75}
                              className="bg-cta hover:bg-cta/90 text-white btn-pulse"
                            >
                              Finalize Event
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Upload Tab Content */}
                  <TabsContent
                    value="upload"
                    className="focus-visible:outline-none"
                  >
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-primary/20 rounded-md p-6 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-accent" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-primary-foreground">
                          Drag & Drop Files Here
                        </h3>
                        <p className="text-sm text-primary-foreground/70 text-center mb-4">
                          Supported formats: PDF, DOCX, TXT, or any text-based
                          file
                        </p>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="file-upload"
                            className="bg-cta hover:bg-cta/90 text-white px-4 py-2 rounded-md cursor-pointer transition"
                          >
                            Browse Files
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".pdf,.docx,.txt,.md"
                          />
                          <Button
                            variant="outline"
                            className="text-primary-foreground"
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>

                      {uploadedFile && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium text-primary-foreground">
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-primary-foreground/70">
                                {Math.round(uploadedFile.size / 1024)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            className="bg-cta hover:bg-cta/90 text-white gap-1"
                            onClick={() => setActiveTab("chat")}
                          >
                            <ChevronRight className="h-4 w-4" />
                            Continue
                          </Button>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-primary/10">
                        <h3 className="text-sm font-medium text-primary-foreground">
                          What we'll extract from your document:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle className="h-3 w-3 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-primary-foreground">
                                Event Structure
                              </p>
                              <p className="text-xs text-primary-foreground/70">
                                Agenda, timeline, and session details
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle className="h-3 w-3 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-primary-foreground">
                                Speaker Information
                              </p>
                              <p className="text-xs text-primary-foreground/70">
                                Names, titles, and presentation topics
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle className="h-3 w-3 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-primary-foreground">
                                Event Details
                              </p>
                              <p className="text-xs text-primary-foreground/70">
                                Name, date, venue, and description
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle className="h-3 w-3 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-primary-foreground">
                                Special Instructions
                              </p>
                              <p className="text-xs text-primary-foreground/70">
                                Any specific guidance for the AI host
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Form Tab Content */}
                  <TabsContent
                    value="form"
                    className="focus-visible:outline-none"
                  >
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-md font-bold text-primary-foreground border-b border-primary/10 pb-2">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="eventName"
                              className="text-primary-foreground"
                            >
                              Event Name *
                            </Label>
                            <Input
                              id="eventName"
                              value={formData.eventName}
                              onChange={(e) =>
                                handleFormChange("eventName", e.target.value)
                              }
                              placeholder="Tech Conference 2025"
                              required
                              className="border-primary/20 focus:border-accent"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="eventType"
                              className="text-primary-foreground"
                            >
                              Event Type *
                            </Label>
                            <Select
                              value={formData.eventType}
                              onValueChange={(value) =>
                                handleFormChange("eventType", value)
                              }
                              required
                            >
                              <SelectTrigger
                                id="eventType"
                                className="border-primary/20"
                              >
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Conference">
                                  Conference
                                </SelectItem>
                                <SelectItem value="Webinar">Webinar</SelectItem>
                                <SelectItem value="Workshop">
                                  Workshop
                                </SelectItem>
                                <SelectItem value="Corporate Event">
                                  Corporate Event
                                </SelectItem>
                                <SelectItem value="Social Gathering">
                                  Social Gathering
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="eventDate"
                              className="text-primary-foreground"
                            >
                              Event Date *
                            </Label>
                            <Input
                              id="eventDate"
                              type="date"
                              value={formData.eventDate}
                              onChange={(e) =>
                                handleFormChange("eventDate", e.target.value)
                              }
                              required
                              className="border-primary/20 focus:border-accent"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="eventLocation"
                              className="text-primary-foreground"
                            >
                              Location
                            </Label>
                            <Input
                              id="eventLocation"
                              value={formData.eventLocation}
                              onChange={(e) =>
                                handleFormChange(
                                  "eventLocation",
                                  e.target.value
                                )
                              }
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
                                handleFormChange(
                                  "expectedAttendees",
                                  e.target.value
                                )
                              }
                              placeholder="100"
                              className="border-primary/20 focus:border-accent"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="eventDescription"
                            className="text-primary-foreground"
                          >
                            Event Description *
                          </Label>
                          <Textarea
                            id="eventDescription"
                            value={formData.eventDescription}
                            onChange={(e) =>
                              handleFormChange(
                                "eventDescription",
                                e.target.value
                              )
                            }
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
                            <Label
                              htmlFor="voiceType"
                              className="text-primary-foreground"
                            >
                              AI Host Voice Style *
                            </Label>
                            <Select
                              value={formData.voiceType}
                              onValueChange={(value) =>
                                handleFormChange("voiceType", value)
                              }
                              required
                            >
                              <SelectTrigger
                                id="voiceType"
                                className="border-primary/20"
                              >
                                <SelectValue placeholder="Select voice style" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableVoices.length > 0 ? (
                                  availableVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.name}
                                      value={voice.name}
                                    >
                                      {voice.name} ({voice.lang})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <>
                                    <SelectItem value="Professional">
                                      Professional
                                    </SelectItem>
                                    <SelectItem value="Friendly">
                                      Friendly & Approachable
                                    </SelectItem>
                                    <SelectItem value="Energetic">
                                      Energetic & Enthusiastic
                                    </SelectItem>
                                    <SelectItem value="Formal">
                                      Formal & Authoritative
                                    </SelectItem>
                                    <SelectItem value="Casual">
                                      Casual & Relaxed
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>

                            {selectedVoice && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    speakText(
                                      "This is a sample of how your AI host voice will sound during the event."
                                    )
                                  }
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
                                    onClick={stopSpeaking}
                                  >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Stop
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="language"
                              className="text-primary-foreground"
                            >
                              Language *
                            </Label>
                            <Select
                              value={formData.language}
                              onValueChange={(value) =>
                                handleFormChange("language", value)
                              }
                              required
                            >
                              <SelectTrigger
                                id="language"
                                className="border-primary/20"
                              >
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableVoices.length > 0 ? (
                                  [
                                    ...new Set(
                                      availableVoices.map((v) => v.lang)
                                    ),
                                  ].map((language) => (
                                    <SelectItem key={language} value={language}>
                                      {language}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <>
                                    <SelectItem value="English">
                                      English
                                    </SelectItem>
                                    <SelectItem value="Spanish">
                                      Spanish
                                    </SelectItem>
                                    <SelectItem value="French">
                                      French
                                    </SelectItem>
                                    <SelectItem value="German">
                                      German
                                    </SelectItem>
                                    <SelectItem value="Japanese">
                                      Japanese
                                    </SelectItem>
                                    <SelectItem value="Chinese">
                                      Chinese
                                    </SelectItem>
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
