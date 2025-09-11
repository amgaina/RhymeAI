"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function syncUserToDatabase() {
  try {
    // Get the current user from Clerk
    const user = await currentUser();
    const session = await auth();

    if (!user || !session.userId) {
      throw new Error("No authenticated user found");
    }

    // Get the primary email
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    // Create or update user in the database
    await db.users.upsert({
      where: { user_id: session.userId },
      update: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: primaryEmail?.emailAddress,
        avatar_url: user.imageUrl,
        updated_at: new Date(),
      },
      create: {
        user_id: session.userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: primaryEmail?.emailAddress,
        avatar_url: user.imageUrl,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return { success: false, error: "Failed to sync user profile" };
  }
}
