import { Metadata } from "next";
import Link from "next/link";
import { Beaker, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "RhymeAI Playground",
  description: "Test and experiment with RhymeAI features",
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">RhymeAI Playground</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/playground">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Playground Home
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Main Site
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
