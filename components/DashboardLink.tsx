import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export async function DashboardLink() {
  const user = await auth();

  const isSignedIn = user.userId !== null;

  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4"
      >
        My Dashboard
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <a className="hover:text-accent transition-colors font-medium tracking-wide hover:underline underline-offset-4 hover:cursor-pointer">
        My Dashboard
      </a>
    </SignInButton>
  );
}
