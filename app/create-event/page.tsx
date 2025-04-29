"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mic2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCreationForm from "@/components/EventCreationForm";

export default function CreateEvent() {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push("/event-creation");
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        <div
          className="flex flex-col items-center justify-center space-y-8 my-10 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-2xl font-bold text-primary-foreground">
            How would you like to create your event?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <Card className="border border-primary/10 hover:border-accent transition-all hover:shadow-md cursor-pointer hover-scale rhyme-card">
              <CardHeader>
                <CardTitle>Use Form Builder</CardTitle>
                <CardDescription>
                  Create your event step by step using our structured form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventCreationForm />
              </CardContent>
            </Card>

            <Card
              className="border border-primary/10 hover:border-accent transition-all hover:shadow-md cursor-pointer hover-scale rhyme-card"
              onClick={handleCreateEvent}
            >
              <CardHeader>
                <CardTitle>Chat with AI Assistant</CardTitle>
                <CardDescription>
                  Let our AI help you create your event through natural
                  conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Mic2 className="h-12 w-12 text-accent" />
                </div>
                <p className="text-center text-primary-foreground/70 mb-6">
                  Our AI will guide you through creating your event script,
                  collecting all necessary information through a natural
                  conversation.
                </p>
                <Button
                  className="border-white text-white bg-primary hover:bg-accent/2 px-8 py-6 text-lg rounded-xl transition-colors duration-300"
                  onClick={handleCreateEvent}
                >
                  Start Creating with AI
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
