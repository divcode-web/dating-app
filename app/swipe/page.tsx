"use client";

import { useState, useEffect } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import { getDiscoveryProfiles, createLike, getUserSettings } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Settings, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";
import { getSwipeLimitInfo, incrementSwipeCount, formatTimeRemaining, SwipeLimitInfo } from "@/lib/swipe-limits";

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  interests: string[];
  distance: number;
  isOnline: boolean;
}

export default function SwipePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeLimitInfo, setSwipeLimitInfo] = useState<SwipeLimitInfo | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfiles();
      loadSwipeLimits();
    }
  }, [user?.id]);

  const loadSwipeLimits = async () => {
    if (!user?.id) return;
    try {
      const info = await getSwipeLimitInfo(user.id);
      setSwipeLimitInfo(info);
    } catch (error) {
      console.error('Error loading swipe limits:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const settings = await getUserSettings(user.id);
      const discoveredProfiles = await getDiscoveryProfiles(user.id, settings);
      // Map UserProfile to Profile type - INCLUDE ALL FIELDS
      const mappedProfiles = discoveredProfiles.map((profile) => ({
        ...profile, // Include ALL fields from database
        name: profile.full_name,
        age: profile.date_of_birth
          ? new Date().getFullYear() -
            new Date(profile.date_of_birth).getFullYear()
          : 0,
        bio: profile.bio || "",
        photos: profile.photos || [],
        interests: profile.interests || [],
        distance: profile.distance || 0,
        isOnline:
          new Date(profile.last_active).getTime() > Date.now() - 5 * 60 * 1000, // Online if active in last 5 mins
      }));
      setProfiles(mappedProfiles);
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (
    profileId: string,
    direction: "left" | "right" | "up"
  ) => {
    if (!user?.id) return;

    // Check swipe limit
    if (swipeLimitInfo && !swipeLimitInfo.canSwipe) {
      toast.error(`Out of swipes! Resets in ${formatTimeRemaining(swipeLimitInfo.resetAt!)}`);
      return;
    }

    try {
      if (direction === "right" || direction === "up") {
        const { match } = await createLike(
          user.id,
          profileId,
          direction === "up"
        );
        if (match) {
          toast.success("It's a match! 🎉");
        }
      }

      // Increment swipe count and update limit info
      if (user?.id && !swipeLimitInfo?.isPremium) {
        const updatedInfo = await incrementSwipeCount(user.id);
        setSwipeLimitInfo(updatedInfo);

        // Show warning when approaching limit
        if (updatedInfo.remainingSwipes === 3) {
          toast(`⚠️ ${updatedInfo.remainingSwipes} swipes remaining`, {
            icon: '⚠️',
          });
        } else if (updatedInfo.remainingSwipes === 0) {
          toast.error(`No swipes left! Resets in ${formatTimeRemaining(updatedInfo.resetAt!)}`);
        }
      }
    } catch (error) {
      console.error("Error processing swipe:", error);
    }
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Find Matches</h1>
          <Button variant="outline" size="icon" onClick={handleSettingsClick}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Swipe Limit Info */}
        {swipeLimitInfo && !swipeLimitInfo.isPremium && (
          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  {swipeLimitInfo.remainingSwipes > 0 ? (
                    <>
                      <span className="font-bold text-pink-600">{swipeLimitInfo.remainingSwipes}</span> swipes left
                    </>
                  ) : (
                    <span className="text-red-600 font-medium">No swipes left</span>
                  )}
                </div>
                {swipeLimitInfo.resetAt && (
                  <span className="text-xs text-gray-500">
                    • Resets in {formatTimeRemaining(swipeLimitInfo.resetAt)}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/premium')}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
              >
                <Crown className="w-3 h-3 mr-1" />
                Unlimited
              </Button>
            </div>
          </div>
        )}

        {swipeLimitInfo?.isPremium && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-white">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Premium - Unlimited Swipes</span>
            </div>
          </div>
        )}

        <SwipeDeck
          profiles={profiles}
          onSwipe={handleSwipe}
          onRefresh={loadProfiles}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
