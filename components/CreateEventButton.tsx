"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CreateEventButton() {
    const { isSignedIn } = useAuth()
    const router = useRouter()

    if (isSignedIn) {
        return (
            <Button
                onClick={() => router.push("/create-event")}
                className="relative bg-cta hover:bg-cta/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl btn-pulse group focus:outline-none focus:ring-4 focus:ring-cta/40"
            >
                <span className="flex items-center gap-2">
                    Create Your Event
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="absolute -inset-1 rounded-xl bg-cta opacity-20 blur-lg animate-glow z-[-1]"></span>
            </Button>
        )
    }

    return (
        <SignInButton mode="modal">
            <Button
                className="relative bg-cta hover:bg-cta/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl btn-pulse group focus:outline-none focus:ring-4 focus:ring-cta/40"
            >
                <span className="flex items-center gap-2">
                    Create Your Event
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="absolute -inset-1 rounded-xl bg-cta opacity-20 blur-lg animate-glow z-[-1]"></span>
            </Button>
        </SignInButton>
    )
}
