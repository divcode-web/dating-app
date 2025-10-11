"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, Star, Crown } from "lucide-react";
import { getUserProfile, createLike } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import toast from "react-hot-toast";

interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  is_super_like: boolean;
  profile?: UserProfile;
}

export default function LikesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkPremium();
      loadLikes();
    }
  }, [user?.id]);

  const checkPremium = async () => {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("is_premium")
        .eq("id", user?.id)
        .single();
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error("Error checking premium:", error);
    }
  };

  const loadLikes = async () => {
    try {
      const { data } = await supabase
        .from("likes")
        .select("*")
        .eq("to_user_id", user?.id)
        .order("created_at", { ascending: false });

      if (data) {
        const likesWithProfiles = await Promise.all(
          data.map(async (like) => {
            try {
              const profile = await getUserProfile(like.from_user_id);
              return { ...like, profile };
            } catch (error) {
              return like;
            }
          })
        );
        setLikes(likesWithProfiles);
      }
    } catch (error) {
      console.error("Error loading likes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (likeId: string, userId: string) => {
    try {
      const { match } = await createLike(user?.id!, userId, false);
      if (match) {
        toast.success("It's a match! 🎉");
        router.push("/matches");
      } else {
        toast.success("Liked back!");
        setLikes(likes.filter((l) => l.id !== likeId));
      }
    } catch (error) {
      toast.error("Failed to like back");
    }
  };

  const handlePass = (likeId: string) => {
    setLikes(likes.filter((l) => l.id !== likeId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="p-12 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
          <p className="text-gray-600 mb-2">
            See who likes you with Premium
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You have {likes.length} {likes.length === 1 ? "person" : "people"} who liked you
          </p>
          <Button
            onClick={() => router.push("/premium")}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="p-12 max-w-md text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">No likes yet</h2>
          <p className="text-gray-600 mb-6">
            Keep swiping! Someone special is out there.
          </p>
          <Button
            onClick={() => router.push("/swipe")}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            Start Swiping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">People Who Like You</h1>
        <p className="text-gray-600 mb-6">
          {likes.length} {likes.length === 1 ? "person" : "people"} liked your profile
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likes.map((like) => (
            <Card key={like.id} className="overflow-hidden">
              <div className="relative h-64">
                {like.is_super_like && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Super Like
                  </div>
                )}
                <img
                  src={like.profile?.photos?.[0] || "/default-avatar.png"}
                  alt={like.profile?.full_name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold">
                  {like.profile?.full_name || "User"}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {like.profile?.bio || "No bio available"}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePass(like.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Pass
                  </Button>
                  <Button
                    onClick={() => handleLikeBack(like.id, like.from_user_id)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Like Back
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
