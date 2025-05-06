"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  Play, 
  Pause, 
  Save, 
  RefreshCw, 
  Check, 
  Volume2,
  Wand2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { VoiceSettings, ScriptSegment } from "@/types/event";
import useTextToSpeech from "@/hooks/useTextToSpeech";

interface VoiceSettingsPanelProps {
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  selectedSegmentId: number | null;
  segments: ScriptSegment[];
}

export default function VoiceSettingsPanel({
  voiceSettings,
  onVoiceSettingsChange,
  selectedSegmentId,
  segments
}: VoiceSettingsPanelProps) {
  const [previewText, setPreviewText] = useState("This is a preview of how the voice will sound.");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("voice");
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(voiceSettings);
  
  // Get selected segment
  const selectedSegment = segments.find(s => s.id === selectedSegmentId);
  
  // Browser TTS for preview
  const { 
    speakText, 
    stopSpeaking, 
    isPlaying: isTtsSpeaking,
    availableVoices,
    selectedVoice,
    changeVoice
  } = useTextToSpeech();
  
  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(voiceSettings);
  }, [voiceSettings]);
  
  // Update preview text when selected segment changes
  useEffect(() => {
    if (selectedSegment) {
      // Use first 100 characters of segment content as preview
      const previewContent = selectedSegment.content.substring(0, 100) + 
        (selectedSegment.content.length > 100 ? "..." : "");
      setPreviewText(previewContent);
    } else {
      setPreviewText("This is a preview of how the voice will sound.");
    }
  }, [selectedSegment]);
  
  // Handle voice settings change
  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };
  
  // Handle apply settings
  const handleApplySettings = () => {
    onVoiceSettingsChange(localSettings);
  };
  
  // Handle preview play
  const handlePreviewPlay = () => {
    if (isTtsSpeaking) {
      stopSpeaking();
      return;
    }
    
    // Map voice settings to browser TTS options
    const ttsOptions = {
      rate: localSettings.speed === "slow" ? 0.8 : 
            localSettings.speed === "fast" ? 1.2 : 1.0,
      pitch: localSettings.pitch === "low" ? 0.7 : 
             localSettings.pitch === "high" ? 1.3 : 1.0
    };
    
    // Try to select a voice that matches the settings
    if (availableVoices.length > 0) {
      // Find a voice that matches gender and accent if possible
      const genderPrefix = localSettings.gender === "male" ? "male" : "female";
      const accentKeywords: Record<string, string[]> = {
        "american": ["en-US", "US"],
        "british": ["en-GB", "GB", "UK"],
        "australian": ["en-AU", "AU"],
        "indian": ["en-IN", "IN"]
      };
      
      const accentKeyword = accentKeywords[localSettings.accent || "american"] || ["en-US"];
      
      // Try to find a matching voice
      const matchingVoice = availableVoices.find(voice => {
        const matchesGender = voice.name.toLowerCase().includes(genderPrefix);
        const matchesAccent = accentKeyword.some(keyword => 
          voice.lang.includes(keyword) || voice.name.includes(keyword)
        );
        return matchesGender && matchesAccent;
      });
      
      if (matchingVoice) {
        changeVoice(matchingVoice.name);
      }
    }
    
    speakText(previewText, ttsOptions);
  };
  
  // Voice presets
  const voicePresets = [
    { name: "Professional MC", settings: { gender: "male", tone: "professional", accent: "american", speed: "medium", pitch: "medium" } },
    { name: "Energetic Host", settings: { gender: "female", tone: "energetic", accent: "american", speed: "fast", pitch: "high" } },
    { name: "Calm Narrator", settings: { gender: "male", tone: "calm", accent: "british", speed: "slow", pitch: "low" } },
    { name: "Corporate Presenter", settings: { gender: "female", tone: "authoritative", accent: "american", speed: "medium", pitch: "medium" } },
    { name: "Workshop Facilitator", settings: { gender: "male", tone: "casual", accent: "australian", speed: "medium", pitch: "medium" } }
  ];
  
  // Apply preset
  const applyPreset = (preset: VoiceSettings) => {
    setLocalSettings(preset);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Voice settings */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Voice Settings
            </CardTitle>
            <CardDescription>
              Customize the voice for your script segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="voice">Voice Characteristics</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="voice" className="space-y-6">
                {/* Gender */}
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup 
                    value={localSettings.gender} 
                    onValueChange={(value) => handleSettingChange('gender', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="gender-male" />
                      <Label htmlFor="gender-male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="gender-female" />
                      <Label htmlFor="gender-female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="neutral" id="gender-neutral" />
                      <Label htmlFor="gender-neutral">Neutral</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Tone */}
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <RadioGroup 
                    value={localSettings.tone} 
                    onValueChange={(value) => handleSettingChange('tone', value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="professional" id="tone-professional" />
                      <Label htmlFor="tone-professional">Professional</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="casual" id="tone-casual" />
                      <Label htmlFor="tone-casual">Casual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="energetic" id="tone-energetic" />
                      <Label htmlFor="tone-energetic">Energetic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="calm" id="tone-calm" />
                      <Label htmlFor="tone-calm">Calm</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="authoritative" id="tone-authoritative" />
                      <Label htmlFor="tone-authoritative">Authoritative</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Accent */}
                <div className="space-y-2">
                  <Label>Accent</Label>
                  <RadioGroup 
                    value={localSettings.accent} 
                    onValueChange={(value) => handleSettingChange('accent', value)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="american" id="accent-american" />
                      <Label htmlFor="accent-american">American</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="british" id="accent-british" />
                      <Label htmlFor="accent-british">British</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="australian" id="accent-australian" />
                      <Label htmlFor="accent-australian">Australian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="indian" id="accent-indian" />
                      <Label htmlFor="accent-indian">Indian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="neutral" id="accent-neutral" />
                      <Label htmlFor="accent-neutral">Neutral</Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-6">
                {/* Speaking Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Speaking Speed</Label>
                    <span className="text-sm text-muted-foreground capitalize">
                      {localSettings.speed || "Medium"}
                    </span>
                  </div>
                  <RadioGroup 
                    value={localSettings.speed} 
                    onValueChange={(value) => handleSettingChange('speed', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="slow" id="speed-slow" />
                      <Label htmlFor="speed-slow">Slow</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="speed-medium" />
                      <Label htmlFor="speed-medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fast" id="speed-fast" />
                      <Label htmlFor="speed-fast">Fast</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Pitch */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Pitch</Label>
                    <span className="text-sm text-muted-foreground capitalize">
                      {localSettings.pitch || "Medium"}
                    </span>
                  </div>
                  <RadioGroup 
                    value={localSettings.pitch} 
                    onValueChange={(value) => handleSettingChange('pitch', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="pitch-low" />
                      <Label htmlFor="pitch-low">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="pitch-medium" />
                      <Label htmlFor="pitch-medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="pitch-high" />
                      <Label htmlFor="pitch-high">High</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Language */}
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={localSettings.language || "en-US"} 
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-AU">English (Australia)</SelectItem>
                      <SelectItem value="en-IN">English (India)</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => setLocalSettings(voiceSettings)}
            >
              Reset
            </Button>
            <Button 
              onClick={handleApplySettings}
              disabled={JSON.stringify(localSettings) === JSON.stringify(voiceSettings)}
            >
              <Save className="h-4 w-4 mr-2" />
              Apply Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Voice preview and presets */}
      <div className="md:col-span-1 space-y-4">
        {/* Voice preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Voice Preview</CardTitle>
            <CardDescription>
              Test how your voice settings sound
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-3 text-sm min-h-[100px] max-h-[150px] overflow-y-auto">
              {previewText}
            </div>
            
            <Button 
              className="w-full"
              onClick={handlePreviewPlay}
            >
              {isTtsSpeaking ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play Preview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Voice presets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Voice Presets</CardTitle>
            <CardDescription>
              Quick settings for common voice types
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {voicePresets.map((preset, index) => (
                <div 
                  key={index}
                  className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => applyPreset(preset.settings)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{preset.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPreset(preset.settings);
                      }}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {preset.settings.gender}, {preset.settings.accent}, {preset.settings.tone}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
