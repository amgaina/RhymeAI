"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/types/event-form";

interface PreviewTabProps {
  form: UseFormReturn<EventFormValues>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function PreviewTab({ 
  form, 
  onBack,
  isSubmitting
}: PreviewTabProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Event Preview</CardTitle>
        <CardDescription>
          Review your event details before finalizing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Event Name
              </h3>
              <p className="text-lg font-semibold">
                {form.getValues("eventName")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Event Type
              </h3>
              <p>{form.getValues("eventType")}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Date
              </h3>
              <p>
                {form.getValues("startDate")}
                {form.getValues("endDate")
                  ? ` to ${form.getValues("endDate")}`
                  : ""}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Format
              </h3>
              <p>{form.getValues("eventFormat") || "Not specified"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Expected Attendees
              </h3>
              <p>
                {form.getValues("expectedAttendees") || "Not specified"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Voice Settings
              </h3>
              <p>
                {form.getValues("primaryVoice") || "Default"} ·
                {form.getValues("accent")
                  ? ` ${form.getValues("accent")} accent ·`
                  : ""}
                {form.getValues("speakingStyle")
                  ? ` ${form.getValues("speakingStyle")} style`
                  : ""}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Language Support
              </h3>
              <p>
                {form.getValues("multilingual")
                  ? "Multilingual"
                  : "English only"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-primary-foreground/70">
                Description
              </h3>
              <p className="text-sm">
                {form.getValues("eventDescription") ||
                  "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/10 pt-4 mt-4">
          <h3 className="font-medium mb-2">Script Preview</h3>
          <div className="bg-primary/5 p-4 rounded-md max-h-48 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {form.getValues("customScript") ||
                "No script content available."}
            </pre>
          </div>
        </div>

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
            type="submit"
            className="bg-cta hover:bg-cta/90 text-white btn-pulse"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
