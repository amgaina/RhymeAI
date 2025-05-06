import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Creates or retrieves a user in the database based on Clerk authentication
 */
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  let user = await db.users.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    // Get user details from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      throw new Error("Failed to get user details");
    }

    // Cr user in our database
    user = await db.users.create({
      data: {
        user_id: userId,
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User",
        email: clerkUser.emailAddresses[0]?.emailAddress,
        avatar_url: clerkUser.imageUrl,
      },
    });
  }

  return user;
}
