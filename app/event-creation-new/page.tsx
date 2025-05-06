"use client";

import { EventCreationForm } from "@/components/EventCreationForm";

export default function EventCreationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      <EventCreationForm />
    </div>
  );
}
