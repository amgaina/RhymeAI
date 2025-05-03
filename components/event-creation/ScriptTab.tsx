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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RotateCw } from "lucide-react";
import { useState } from "react";

interface ScriptTabProps {
  form: UseFormReturn<EventFormValues>;
  onNext: () => void;
  onBack: () => void;
  handleScriptGeneration: () => Promise<void>;
}

export function ScriptTab({ 
  form, 
  onNext, 
  onBack,
  handleScriptGeneration 
}: ScriptTabProps) {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const onGenerateClick = async () => {
    setIsGeneratingScript(true);
    try {
      await handleScriptGeneration();
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
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
            onClick={onGenerateClick}
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
