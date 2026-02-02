"use client";

import { toggleFollow } from "@/actions/user.action";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";

function FollowButton({ userId, isFollowing: initialIsFollowing = false }: { userId: string; isFollowing?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      const result = await toggleFollow(userId);
      if (result?.success) {
        setIsFollowing(result.isFollowing);
        toast.success(result.isFollowing ? "User followed successfully" : "User unfollowed successfully");
      }
    } catch (error) {
      toast.error("Error following user");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Button
      size={"sm"}
      variant={isFollowing ? "outline" : "secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
    >
      {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

export default FollowButton;
