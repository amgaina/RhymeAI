"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TTSPlayground from "@/components/playground/TTSPlayground";
import StreamingTTSPlayground from "@/components/playground/StreamingTTSPlayground";

export default function TTSPlaygroundPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Text-to-Speech Playground
      </h1>
      <p className="text-center mb-8 text-muted-foreground">
        Test the text-to-speech functionality by entering text and generating
        audio.
      </p>

      <Tabs defaultValue="standard" className="w-full max-w-3xl mx-auto mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard">Standard Mode</TabsTrigger>
          <TabsTrigger value="streaming">Streaming Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <div className="mb-4 text-sm text-muted-foreground">
            Standard mode generates audio using server actions and stores it for
            playback.
          </div>
          <TTSPlayground />
        </TabsContent>

        <TabsContent value="streaming">
          <div className="mb-4 text-sm text-muted-foreground">
            Streaming mode generates audio directly from the API and streams it
            to the browser.
          </div>
          <StreamingTTSPlayground />
        </TabsContent>
      </Tabs>
    </div>
  );
}
