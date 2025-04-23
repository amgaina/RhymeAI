"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, Volume2, Loader2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useTextToSpeech from "@/hooks/useTextToSpeech";

export default function StreamingTTSPlayground() {
  // State for text input
  const [text, setText] = useState<string>(
    "Hello! This is a test of the text-to-speech functionality."
  );

  // State for voice settings
  const [voiceGender, setVoiceGender] = useState<string>("FEMALE");
  const [voiceName, setVoiceName] = useState<string>("en-US-Neural2-F");
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);

  // State for audio playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Browser TTS fallback
  const {
    speakText,
    stopSpeaking,
    isPlaying: isBrowserTtsPlaying,
    availableVoices,
    selectedVoice,
    changeVoice,
  } = useTextToSpeech();

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Handle streaming TTS generation
  const handleStreamTTS = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Prepare voice settings
      const voiceSettings = {
        name: voiceName,
        languageCode: voiceName.split("-").slice(0, 2).join("-"),
        ssmlGender: voiceGender,
        speakingRate,
        pitch,
      };

      // Create a URL with query parameters
      const params = new URLSearchParams();
      params.append("text", text);
      params.append("voiceSettings", JSON.stringify(voiceSettings));

      // Generate a unique timestamp to prevent caching
      const timestamp = Date.now();

      // Create audio URL
      const audioUrl = `/api/playground/tts?${params.toString()}&t=${timestamp}`;

      // Create a new audio element
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setError("Failed to play audio. Falling back to browser TTS.");
        // Fall back to browser TTS
        speakText(text, { rate: speakingRate, pitch });
      };

      // Play the audio
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setError("Failed to play audio. Falling back to browser TTS.");
        // Fall back to browser TTS
        speakText(text, { rate: speakingRate, pitch });
      });
    } catch (err) {
      setError("An error occurred while generating audio");
      console.error("TTS generation error:", err);
      // Fall back to browser TTS
      speakText(text, { rate: speakingRate, pitch });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle browser TTS
  const handleBrowserTTS = () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setError(null);

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // Use browser TTS
    speakText(text, { rate: speakingRate, pitch });
  };

  // Handle play/pause for streaming audio
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err);
          setError("Failed to play audio. Falling back to browser TTS.");
          // Fall back to browser TTS
          speakText(text, { rate: speakingRate, pitch });
        });
      }
    } else {
      // If no audio has been generated yet, generate it
      handleStreamTTS();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Streaming Text-to-Speech</CardTitle>
        <CardDescription>
          Test TTS with direct streaming from the API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Text input */}
        <div className="space-y-2">
          <Label htmlFor="text-input">Text to convert to speech</Label>
          <Textarea
            id="text-input"
            placeholder="Enter text here..."
            value={text}
            onChange={handleTextChange}
            rows={5}
            className="resize-y"
          />
        </div>

        <Tabs defaultValue="google">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">Google TTS</TabsTrigger>
            <TabsTrigger value="browser">Browser TTS</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="space-y-4">
            {/* Google TTS voice settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voice-gender">Voice Gender</Label>
                <Select value={voiceGender} onValueChange={setVoiceGender}>
                  <SelectTrigger id="voice-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-name">Voice Name</Label>
                <Select value={voiceName} onValueChange={setVoiceName}>
                  <SelectTrigger id="voice-name">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US-Neural2-F">
                      US English (Female)
                    </SelectItem>
                    <SelectItem value="en-US-Neural2-M">
                      US English (Male)
                    </SelectItem>
                    <SelectItem value="en-GB-Neural2-F">
                      British English (Female)
                    </SelectItem>
                    <SelectItem value="en-GB-Neural2-M">
                      British English (Male)
                    </SelectItem>
                    <SelectItem value="en-AU-Neural2-F">
                      Australian English (Female)
                    </SelectItem>
                    <SelectItem value="en-AU-Neural2-M">
                      Australian English (Male)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="speaking-rate">
                    Speaking Rate: {speakingRate.toFixed(1)}
                  </Label>
                </div>
                <Slider
                  id="speaking-rate"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speakingRate]}
                  onValueChange={(value) => setSpeakingRate(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="pitch">Pitch: {pitch.toFixed(1)}</Label>
                </div>
                <Slider
                  id="pitch"
                  min={-10.0}
                  max={10.0}
                  step={0.5}
                  value={[pitch]}
                  onValueChange={(value) => setPitch(value[0])}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStreamTTS}
                disabled={isGenerating || !text.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Stream Audio
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="browser" className="space-y-4">
            {/* Browser TTS voice settings */}
            <div className="space-y-2">
              <Label htmlFor="browser-voice">Browser Voice</Label>
              <Select
                value={selectedVoice?.name || ""}
                onValueChange={changeVoice}
                disabled={availableVoices.length === 0}
              >
                <SelectTrigger id="browser-voice">
                  <SelectValue
                    placeholder={
                      availableVoices.length === 0
                        ? "No voices available"
                        : "Select voice"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="browser-rate">
                    Speaking Rate: {speakingRate.toFixed(1)}
                  </Label>
                </div>
                <Slider
                  id="browser-rate"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speakingRate]}
                  onValueChange={(value) => setSpeakingRate(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="browser-pitch">
                    Pitch: {pitch.toFixed(1)}
                  </Label>
                </div>
                <Slider
                  id="browser-pitch"
                  min={-2.0}
                  max={2.0}
                  step={0.1}
                  value={[pitch]}
                  onValueChange={(value) => setPitch(value[0])}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleBrowserTTS}
                disabled={!text.trim() || !selectedVoice}
              >
                <Play className="mr-2 h-4 w-4" />
                Play with Browser TTS
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error message */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setText("");
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            stopSpeaking();
          }}
        >
          Clear
        </Button>

        <Button
          variant="outline"
          onClick={handlePlayPause}
          disabled={isGenerating || !text.trim()}
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Play
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
