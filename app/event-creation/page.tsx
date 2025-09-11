"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic2, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Import components
import EventCreationFlow from "@/components/event-creation/EventCreationFlow";

export default function EventCreation() {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/dashboard"
          className="text-primary-foreground/70 hover:text-primary-foreground inline-flex items-center mb-6 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div
            className="flex-1 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Card className="rhyme-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Create Your Event</CardTitle>
                <CardDescription>
                  Let's create an AI host for your event by following these
                  steps: collect event details, create a layout, generate
                  scripts, and add audio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventCreationFlow />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
