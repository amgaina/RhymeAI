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
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { generatePlaygroundTTS } from "@/app/actions/playground/tts-playground";
import useTextToSpeech from "@/hooks/useTextToSpeech";

export default function TTSPlayground() {
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
  } = useTextToSpeech();

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Handle TTS generation
  const handleGenerateTTS = async () => {
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

      // Call the server action to generate TTS
      const result = await generatePlaygroundTTS(text, voiceSettings);

      if (result.success && result.audioUrl) {
        setAudioUrl(result.audioUrl);

        // Create a new audio element
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(result.audioUrl);
        audioRef.current = audio;

        // Set up event listeners
        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => setIsPlaying(false);
      } else {
        setError(result.error || "Failed to generate audio");
        // Fall back to browser TTS
        speakText(text, { rate: speakingRate, pitch });
      }
    } catch (err) {
      setError("An error occurred while generating audio");
      console.error("TTS generation error:", err);
      // Fall back to browser TTS
      speakText(text, { rate: speakingRate, pitch });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!audioRef.current && !audioUrl) {
      // If no audio has been generated yet, generate it
      handleGenerateTTS();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err);
          // Fall back to browser TTS
          speakText(text, { rate: speakingRate, pitch });
        });
      }
    } else if (audioUrl) {
      // Create a new audio element if it doesn't exist
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);

      // Play the audio
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        // Fall back to browser TTS
        speakText(text, { rate: speakingRate, pitch });
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Text-to-Speech Playground</CardTitle>
        <CardDescription>
          Enter text and generate audio using Google Cloud Text-to-Speech
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

        {/* Voice settings */}
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
              min={0.25}
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

        {/* Error message */}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Audio player (if audio is generated) */}
        {audioUrl && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={isGenerating}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                Audio generated successfully
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setText("");
            setAudioUrl(null);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
          }}
        >
          Clear
        </Button>

        <Button
          onClick={handleGenerateTTS}
          disabled={isGenerating || !text.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Audio"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
