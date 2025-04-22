"use client";

import { User } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { DashboardLink } from "@/components/DashboardLink";

export function AuthButtons() {
  return (
    <>
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
                <span className="tracking-wide hover:text-white">Login</span>
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
    </>
  );
}

export function NavLinks() {
  return (
    <nav className="hidden md:flex gap-20 animate-fade-in delay-100">
      <DashboardLink />
      <a
        href="/emcee"
        className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
      >
        Create Emcee Script
      </a>
      <button
        onClick={() => (window.location.hash = "#features")}
        className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4 bg-transparent border-none p-0 m-0 text-inherit font-inherit cursor-pointer"
      >
        Features
      </button>
      <button
        onClick={() => (window.location.hash = "#how-it-works")}
        className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4 bg-transparent border-none p-0 m-0 text-inherit font-inherit cursor-pointer"
      >
        How It Works
      </button>
    </nav>
  );
}
