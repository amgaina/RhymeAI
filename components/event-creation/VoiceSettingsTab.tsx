"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/types/event-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Plus, RotateCw } from "lucide-react";
import { useState } from "react";

interface VoiceSettingsTabProps {
  form: UseFormReturn<EventFormValues>;
  onNext: () => void;
  onBack: () => void;
  handleVoicePreview: () => Promise<void>;
}

export function VoiceSettingsTab({ 
  form, 
  onNext, 
  onBack,
  handleVoicePreview 
}: VoiceSettingsTabProps) {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const onPreviewClick = async () => {
    setIsGeneratingPreview(true);
    try {
      await handleVoicePreview();
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
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
                  onClick={onPreviewClick}
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
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            className="bg-cta hover:bg-cta/90 text-white btn-pulse"
            onClick={onNext}
          >
            Save and Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
