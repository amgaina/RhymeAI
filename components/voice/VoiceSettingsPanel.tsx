import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, X, Volume2, Play, Pause } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface VoiceSettingsProps {
  voiceId?: string;
  onSubmit: (settings: any) => void;
  onCancel: () => void;
}

export function VoiceSettingsPanel({
  voiceId,
  onSubmit,
  onCancel,
}: VoiceSettingsProps) {
  // Voice settings state
  const [settings, setSettings] = useState({
    provider: "google",
    voiceName: voiceId || "en-US-Neural2-F",
    pitch: 0,
    speed: 1,
  });

  // Sample audio state
  const [sampleAudio, setSampleAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);

  // Available voices (simplified - in production this would come from an API)
  const voices = [
    { id: "en-US-Neural2-F", name: "Emma (Female)", provider: "google" },
    { id: "en-US-Neural2-M", name: "Jack (Male)", provider: "google" },
    { id: "en-US-Neural2-C", name: "Sam (Neutral)", provider: "google" },
    { id: "en-GB-Neural2-B", name: "Thomas (British)", provider: "google" },
    { id: "en-AU-Neural2-A", name: "Olivia (Australian)", provider: "google" },
  ];

  // Handle settings changes
  const updateSettings = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Generate sample audio
  const generateSample = async () => {
    // In a real implementation, this would call an API to generate a sample
    // For now, we'll just simulate it
    console.log("Generating sample with settings:", settings);
    setSampleUrl("/api/voice/sample?dummy=" + Math.random());
  };

  // Manage audio playback
  useEffect(() => {
    if (sampleUrl) {
      const audio = new Audio(sampleUrl);
      audio.onended = () => setIsPlaying(false);
      setSampleAudio(audio);

      return () => {
        audio.pause();
        audio.src = "";
        setSampleAudio(null);
      };
    }
  }, [sampleUrl]);

  const togglePlay = () => {
    if (!sampleAudio) return;

    if (isPlaying) {
      sampleAudio.pause();
      setIsPlaying(false);
    } else {
      sampleAudio.play();
      setIsPlaying(true);
    }
  };

  // Submit settings
  const handleSubmit = () => {
    onSubmit({
      ...settings,
      sampleUrl,
    });
  };

  return (
    <Card className="border-primary/20 mb-4 animate-in fade-in-50 slide-in-from-top-5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Voice Settings</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="voice">Voice</Label>
          <Select
            value={settings.voiceName}
            onValueChange={(value) => updateSettings("voiceName", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between">
            <Label htmlFor="pitch">Pitch</Label>
            <span className="text-xs text-muted-foreground">
              {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
            </span>
          </div>
          <Slider
            id="pitch"
            value={[settings.pitch]}
            min={-10}
            max={10}
            step={1}
            onValueChange={(value) => updateSettings("pitch", value[0])}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between">
            <Label htmlFor="speed">Speed</Label>
            <span className="text-xs text-muted-foreground">
              {settings.speed}x
            </span>
          </div>
          <Slider
            id="speed"
            value={[settings.speed]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={(value) => updateSettings("speed", value[0])}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSample}
            className="gap-1"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Generate Sample
          </Button>

          {sampleUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="gap-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Play Sample
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="gap-1">
          <Check className="h-4 w-4" />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
