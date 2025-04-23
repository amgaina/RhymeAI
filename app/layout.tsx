import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Poppins } from "next/font/google";
import { Mic2, User } from "lucide-react";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { DashboardLink } from "@/components/DashboardLink";
import PlaygroundLink from "@/components/PlaygroundLink";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "RhymeAI - AI-Powered Event Host",
  description:
    "Transform your events with a customizable AI emcee that speaks in your chosen voice, tone, and language.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={poppins.variable}>
        <body className="font-poppins">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {/* Navigation */}
            <header className="bg-primary text-primary-foreground shadow-sm">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center animate-fade-in-up">
                {/* Logo & Brand */}
                <div className="flex items-center gap-2">
                  <Mic2 className="h-6 w-6 text-terracotta animate-fade-in" />
                  <span className="text-2xl font-semibold tracking-wide animate-slide-in-left">
                    RhymeAI
                  </span>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex gap-20 animate-fade-in delay-100">
                  <DashboardLink />
                  <PlaygroundLink />
                  <Link
                    href="#features"
                    className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
                  >
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="#pricing"
                    className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
                  >
                    Pricing
                  </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-6 sm:gap-8 animate-fade-in delay-200">
                  <SignedOut>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <SignInButton mode="modal">
                        <Button
                          variant="ghost"
                          className="group text-primary-foreground hover:text-white transition-colors duration-200 ease-in-out flex items-center gap-2 font-medium px-4 py-2 rounded-full"
                        >
                          <User className="h-5 w-5 group-hover:text-white transition-colors" />
                          <span className="tracking-wide hover:text-white">
                            Login
                          </span>
                        </Button>
                      </SignInButton>

                      <SignUpButton mode="modal">
                        <Button className="bg-gradient-to-br from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg rounded-full px-6 py-2 text-white text-base font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/40">
                          <span>Get Started</span>
                        </Button>
                      </SignUpButton>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <div className="flex items-center gap-3 bg-primary/10 border border-white/10 px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition duration-200">
                      <User className="h-5 w-5 text-white/80" />
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
