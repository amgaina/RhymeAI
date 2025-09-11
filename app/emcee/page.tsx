"use client";

import { EmceeScriptGenerator } from "@/components/EmceeScriptGenerator";

export default function EmceePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Create Your AI Emcee Script
      </h1>
      
      <EmceeScriptGenerator 
        title="RhymeAI Emcee Assistant"
        initialMessage="Hi! I'm your RhymeAI Emcee Assistant. I'll help you create a professional script for your event host or emcee. Let's start by gathering some basic information about your event. What type of event are you planning?"
      />
      
      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>Share your event details</strong> - Tell me about your event type, date, location, audience size, and any specific requirements.
          </li>
          <li>
            <strong>Review the event layout</strong> - I'll create a structured outline of your event with appropriate segments.
          </li>
          <li>
            <strong>Generate the script</strong> - Based on the layout, I'll write a complete emcee script with introductions, transitions, and announcements.
          </li>
          <li>
            <strong>Create audio</strong> - Generate professional text-to-speech audio for each segment of your script.
          </li>
        </ol>
      </div>
    </div>
  );
}
