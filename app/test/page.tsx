"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RhymeAIChat } from "@/components/RhymeAIChat";

// Client component that uses useSearchParams
function TestPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");

  // Redirect to the dedicated event creation page if mode is "event-creation"
  if (mode === "event-creation") {
    // Use useEffect for client-side navigation to avoid hydration issues
    useState(() => {
      router.push("/event-creation");
    });
    return null;
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold text-primary mb-6">
        RhymeAI Test Page
      </h1>
      <div className="max-w-2xl mx-auto">
        <RhymeAIChat
          className="w-full"
          title="RhymeAI Assistant"
          description="Get personalized help with planning your next event"
          initialMessage="Hello! I'm the RhymeAI assistant. How can I help you today? You can ask me about event planning, AI hosts, or any other questions you might have."
          placeholder="Type your message here..."
        />
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function TestPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <TestPageContent />
    </Suspense>
  );
}
