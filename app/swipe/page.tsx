"use client";

import { useState, useEffect } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import { getDiscoveryProfiles, createLike, getUserSettings } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";

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

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const settings = await getUserSettings(user.id);
      const discoveredProfiles = await getDiscoveryProfiles(user.id, settings);
      // Map UserProfile to Profile type
      const mappedProfiles = discoveredProfiles.map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        age: profile.date_of_birth
          ? new Date().getFullYear() -
            new Date(profile.date_of_birth).getFullYear()
          : 0,
        bio: profile.bio || "",
        photos: profile.photos,
        interests: profile.interests,
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

    try {
      if (direction === "right" || direction === "up") {
        const { match } = await createLike(
          user.id,
          profileId,
          direction === "up"
        );
        if (match) {
          // Show match animation/notification
          toast.success("It's a match! 🎉");
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find Matches</h1>
          <Button variant="outline" size="icon" onClick={handleSettingsClick}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

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
