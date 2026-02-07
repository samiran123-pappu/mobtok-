import { getProfileByUsername, getUserLikedPosts, getUserPosts, isFollowing } from "@/actions/profile.action";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import ProfilePageClient from "./ProfilePageClient";


const getUserCached = cache(getProfileByUsername);


type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await getUserCached(username);

if (!user) {
  return {
    title: "Profile not found",
    description: "This user profile does not exist.",
  };
}

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio ?? `Checkout ${user.username}'s profile on OurApp.`
  }

}


async function ProfilePageServer({ params }: Props) {
const { username } = await params;
const user = await getUserCached(username);
if (!user) notFound();


  const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFollowing(user.id)
  ])

  return (
      <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isCurrentUserFollowing}
    />
  );
}
  

export default ProfilePageServer;