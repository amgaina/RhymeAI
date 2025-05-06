"use client";

import { useState } from "react";
import { OptimizedChat } from "./OptimizedChat";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface EmceeScriptGeneratorProps {
  eventId?: number;
  title?: string;
  initialMessage?: string;
}

export function EmceeScriptGenerator({
  eventId,
  title = "RhymeAI Emcee Script Generator",
  initialMessage,
}: EmceeScriptGeneratorProps) {
  // State for tracking generated content
  const [eventData, setEventData] = useState<any>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [scriptData, setScriptData] = useState<any>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("chat");

  // Handle event data collection
  const handleEventDataCollected = (data: any) => {
    setEventData(data);
    console.log("Event data collected:", data);
  };

  // Handle layout generation
  const handleLayoutGenerated = (layout: any) => {
    setLayoutData(layout);
    setActiveTab("layout");
    console.log("Layout generated:", layout);
  };

  // Handle script generation
  const handleScriptGenerated = (script: any) => {
    setScriptData(script);
    setActiveTab("script");
    console.log("Script generated:", script);
  };

  // Handle audio generation
  const handleAudioGenerated = (audioUrl: string, segmentId: string) => {
    setAudioUrls((prev) => ({
      ...prev,
      [segmentId]: audioUrl,
    }));
    console.log(`Audio generated for segment ${segmentId}:`, audioUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="layout" disabled={!layoutData}>
            Layout
          </TabsTrigger>
          <TabsTrigger value="script" disabled={!scriptData}>
            Script
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <OptimizedChat
            eventId={eventId}
            title={title}
            initialMessage={initialMessage}
            onEventDataCollected={handleEventDataCollected}
            onLayoutGenerated={handleLayoutGenerated}
            onScriptGenerated={handleScriptGenerated}
            onAudioGenerated={handleAudioGenerated}
          />
        </TabsContent>

        <TabsContent value="layout">
          {layoutData && (
            <Card>
              <CardHeader>
                <CardTitle>Event Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {layoutData.segments?.map((segment: any, index: number) => (
                    <div key={index} className="border p-4 rounded-md">
                      <h3 className="font-medium">
                        {segment.title || `Segment ${index + 1}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {segment.description}
                      </p>
                      <p className="text-xs mt-2">
                        Duration: {segment.duration || "Not specified"}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={() => setActiveTab("chat")}>
                  Back to Chat
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="script">
          {scriptData && (
            <Card>
              <CardHeader>
                <CardTitle>Emcee Script</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scriptData.segments?.map((segment: any, index: number) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">
                          {segment.title || `Segment ${index + 1}`}
                        </h3>
                        {audioUrls[segment.id] ? (
                          <audio
                            src={audioUrls[segment.id]}
                            controls
                            className="max-w-[200px]"
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Go back to chat and request audio generation
                              setActiveTab("chat");
                              // This would be handled by the chat component
                            }}
                          >
                            Generate Audio
                          </Button>
                        )}
                      </div>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                        {segment.content}
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={() => setActiveTab("chat")}>
                  Back to Chat
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
