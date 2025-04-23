import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic2, Wand2 } from "lucide-react";

export const metadata: Metadata = {
  title: "RhymeAI Playground",
  description: "Test and experiment with RhymeAI features",
};

export default function PlaygroundPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        RhymeAI Playground
      </h1>
      <p className="text-center mb-8 text-muted-foreground">
        Explore and test various features of the RhymeAI platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/playground/tts" className="block">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="h-5 w-5" />
                Text-to-Speech
              </CardTitle>
              <CardDescription>
                Test the text-to-speech functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Enter text and generate audio using Google Cloud Text-to-Speech.
                Customize voice settings and play back the generated audio.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Add more playground cards here as they are developed */}
      </div>
    </div>
  );
}
