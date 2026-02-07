"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!user || !userId) return null;

        // Safely extract fields — Clerk may not always provide all of them
        const email = user.emailAddresses?.[0]?.emailAddress;
        if (!email) {
            console.error("syncUser: Clerk user has no email address", userId);
            return null;
        }

        const username =
            user.username ?? email.split("@")[0];
        const name =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || username;

        // Use upsert to avoid race conditions and duplicate-key errors
        const dbUser = await prisma.user.upsert({
            where: { clerkId: userId },
            update: {
                name,
                username,
                email,
                image: user.imageUrl,
            },
            create: {
                clerkId: userId,
                name,
                username,
                email,
                image: user.imageUrl,
            },
        });

        return dbUser;
    } catch (error) {
        console.error("syncUser error:", error);
        return null;
    }
}



export async function getUserByClerkId(clerkId: string) {
    return await prisma.user.findUnique({
        where: {
            clerkId,
        },
        include: {
            _count: {
                select: {
                    followers: true,
                    following: true,
                    posts: true,
                }

            }
        }
    });
}


export async function getDbUserId() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    // Try to find the user, if missing sync from Clerk first
    let user = await getUserByClerkId(clerkId);

    if (!user) {
        // New user — syncUser creates them in the DB
        const synced = await syncUser();
        if (!synced) {
            console.error("getDbUserId: could not sync user", clerkId);
            return null;
        }
        user = await getUserByClerkId(clerkId);
    }

    return user?.id ?? null;
}

export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },  // Exclude current user

                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId
                                }

                            }
                        }
                    }
                ]

            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },

            },
            take: 3,
        })
        return randomUsers;

    } catch (error) {
        console.error("Error fetching random users:", error);
        return [];

    }

}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}