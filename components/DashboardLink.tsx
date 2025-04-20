"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { SignInButton } from "@clerk/nextjs"
import Link from "next/link"

export function DashboardLink() {
    const router = useRouter()
    const { isSignedIn } = useAuth()

    if (isSignedIn) {
        return (
            <Link
                href="/dashboard"
                className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
            >
                My Dashboard
            </Link>

        )
    }

    return (
        <SignInButton mode="modal">
            <a
                className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4 hover:cursor-pointer"
            >
                My Dashboard
            </a>
        </SignInButton>

    )
}
