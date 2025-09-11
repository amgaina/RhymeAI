"use client";

import { useState } from "react";
import SafeRhymeAIChatWrapper from "@/components/SafeRhymeAIChatWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChatDemoPage() {
  const [activeTab, setActiveTab] = useState("event-creation");
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [eventData, setEventData] = useState<any>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [scriptData, setScriptData] = useState<any>(null);

  // Handle event data collection
  const handleEventDataCollected = (data: any) => {
    setEventData(data);
    if (data.eventId) {
      setEventId(data.eventId);
    }
  };

  // Handle layout generation
  const handleLayoutGenerated = (layout: any) => {
    setLayoutData(layout);
    setActiveTab("event-layout");
  };

  // Handle script generation
  const handleScriptGenerated = (script: any) => {
    setScriptData(script);
    setActiveTab("script-generation");
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">RhymeAI Chat Demo</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="event-creation">Event Creation</TabsTrigger>
          <TabsTrigger value="event-layout" disabled={!eventId}>
            Layout Design
          </TabsTrigger>
          <TabsTrigger value="script-generation" disabled={!layoutData}>
            Script Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event-creation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <SafeRhymeAIChatWrapper
                title="Event Creation Assistant"
                description="I'll help you create a new event and collect all the necessary information."
                contextType="event-creation"
                onEventDataCollected={handleEventDataCollected}
                onLayoutGenerated={handleLayoutGenerated}
              />
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventData ? (
                    <div className="space-y-2">
                      <p>
                        <strong>Event ID:</strong> {eventData.eventId}
                      </p>
                      <p>
                        <strong>Name:</strong> {eventData.eventName}
                      </p>
                      <p>
                        <strong>Type:</strong> {eventData.eventType}
                      </p>
                      <p>
                        <strong>Date:</strong> {eventData.eventDate}
                      </p>
                      <p>
                        <strong>Location:</strong> {eventData.eventLocation}
                      </p>
                      <p>
                        <strong>Attendees:</strong>{" "}
                        {eventData.expectedAttendees}
                      </p>

                      {eventId && (
                        <Button
                          className="w-full mt-4"
                          onClick={() => setActiveTab("event-layout")}
                        >
                          Continue to Layout Design
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No event data collected yet. Start chatting with the
                      assistant to create an event.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="event-layout">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <SafeRhymeAIChatWrapper
                eventId={eventId}
                title="Layout Design Assistant"
                description="Let's design the layout for your event."
                contextType="event-layout"
                initialMessage="Now that we have your event information, let's design the layout. What segments would you like to include in your event?"
                onLayoutGenerated={handleLayoutGenerated}
                onScriptGenerated={handleScriptGenerated}
              />
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {layoutData ? (
                    <div className="space-y-2">
                      <p>
                        <strong>Segments:</strong>{" "}
                        {Array.isArray(layoutData)
                          ? layoutData.length
                          : "Unknown"}
                      </p>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Segments:</h4>
                        <ul className="space-y-2">
                          {Array.isArray(layoutData) &&
                            layoutData.map((segment, index) => (
                              <li key={index} className="border p-2 rounded-md">
                                <p>
                                  <strong>
                                    {segment.name || segment.type}
                                  </strong>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {segment.duration} min • Order:{" "}
                                  {segment.order}
                                </p>
                              </li>
                            ))}
                        </ul>
                      </div>

                      {layoutData && (
                        <Button
                          className="w-full mt-4"
                          onClick={() => setActiveTab("script-generation")}
                        >
                          Continue to Script Generation
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No layout data generated yet. Chat with the assistant to
                      design your event layout.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="script-generation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <SafeRhymeAIChatWrapper
                eventId={eventId}
                title="Script Generation Assistant"
                description="Let's create the script for your event."
                contextType="script-generation"
                initialMessage="Now that we have your event layout, let's create the script. I'll generate content for each segment."
                onScriptGenerated={handleScriptGenerated}
              />
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Script Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {scriptData ? (
                    <div className="space-y-2">
                      <p>
                        <strong>Segments:</strong>{" "}
                        {scriptData.segments
                          ? scriptData.segments.length
                          : scriptData.sections
                          ? scriptData.sections.length
                          : "Unknown"}
                      </p>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                          Script Segments:
                        </h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {(
                            scriptData.segments ||
                            scriptData.sections ||
                            []
                          ).map((segment: any, index: number) => (
                            <div key={index} className="border p-2 rounded-md">
                              <p className="font-medium">
                                {segment.type || segment.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {segment.content
                                  ? `${segment.content.substring(0, 100)}...`
                                  : "No content"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No script data generated yet. Chat with the assistant to
                      create your event script.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
