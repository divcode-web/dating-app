"use client";

import { useState, useEffect } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import { getDiscoveryProfiles, createLike, getUserSettings } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Crown, RotateCcw, Globe, MapPin } from "lucide-react";
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
  const [lastSwipedProfile, setLastSwipedProfile] = useState<{profile: Profile, direction: string} | null>(null);
  const [canRewind, setCanRewind] = useState(false);
  const [hasGlobalDating, setHasGlobalDating] = useState(false);
  const [isGlobalMode, setIsGlobalMode] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfiles();
      loadSwipeLimits();
      checkRewindFeature();
      checkGlobalDatingFeature();
    }
  }, [user?.id]);

  const checkRewindFeature = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('subscription_tier_id')
        .eq('id', user.id)
        .single();

      if (data?.subscription_tier_id) {
        const { data: tierData } = await supabase
          .from('subscription_tiers')
          .select('can_rewind_swipes')
          .eq('id', data.subscription_tier_id)
          .single();

        setCanRewind(tierData?.can_rewind_swipes || false);
      }
    } catch (error) {
      console.error('Error checking rewind feature:', error);
    }
  };

  const checkGlobalDatingFeature = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('subscription_tier_id')
        .eq('id', user.id)
        .single();

      if (data?.subscription_tier_id) {
        const { data: tierData } = await supabase
          .from('subscription_tiers')
          .select('has_global_dating')
          .eq('id', data.subscription_tier_id)
          .single();

        setHasGlobalDating(tierData?.has_global_dating || false);
      }
    } catch (error) {
      console.error('Error checking global dating feature:', error);
    }
  };

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
      // Pass global mode flag to discovery algorithm
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
      toast.error(`Out of swipes! Resets in ${formatTimeRemaining(swipeLimitInfo.resetAt!)} or upgrade for unlimited`, {
        duration: 5000,
      });
      // Show upgrade prompt
      router.push('/premium?reason=swipes');
      return;
    }

    // Save last swiped profile for rewind
    const swipedProfile = profiles.find(p => p.id === profileId);
    if (swipedProfile && canRewind) {
      setLastSwipedProfile({ profile: swipedProfile, direction });
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

  const handleRewind = async () => {
    if (!lastSwipedProfile || !user?.id) return;

    try {
      // Delete the like if it was a right swipe or super like
      if (lastSwipedProfile.direction === "right" || lastSwipedProfile.direction === "up") {
        await supabase
          .from('likes')
          .delete()
          .eq('liker_id', user.id)
          .eq('liked_id', lastSwipedProfile.profile.id);
      }

      // Add profile back to the deck
      setProfiles(prev => [lastSwipedProfile.profile, ...prev]);
      setLastSwipedProfile(null);
      toast.success('⏪ Swipe undone!');
    } catch (error) {
      console.error('Error rewinding swipe:', error);
      toast.error('Failed to undo swipe');
    }
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Find Matches</h1>
            {/* Global/Local Toggle for Premium Users */}
            {hasGlobalDating && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setIsGlobalMode(false);
                      loadProfiles(); // Reload profiles when switching modes
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      !isGlobalMode
                        ? 'bg-white text-pink-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    Local
                  </button>
                  <button
                    onClick={() => {
                      setIsGlobalMode(true);
                      loadProfiles(); // Reload profiles when switching modes
                    }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      isGlobalMode
                        ? 'bg-white text-pink-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Global
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={handleSettingsClick}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Swipe Limit Info for Free and Basic users */}
        {swipeLimitInfo && !swipeLimitInfo.isPremium && !swipeLimitInfo.isBasic && (
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
                 Upgrade
               </Button>
             </div>
           </div>
         )}

         {/* Basic tier - show limited swipes with countdown */}
         {swipeLimitInfo?.isBasic && (
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
                 className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
               >
                 <Crown className="w-3 h-3 mr-1" />
                 More Swipes
               </Button>
             </div>
           </div>
         )}

         {/* Premium tier - show unlimited badge */}
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

        {/* Rewind Button */}
        {canRewind && lastSwipedProfile && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleRewind}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Undo Last Swipe
            </Button>
          </div>
        )}

        {/* Rewind Feature Locked - Show upgrade prompt */}
        {!canRewind && lastSwipedProfile && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Want to undo that swipe?</p>
            <Button
              onClick={() => router.push('/premium')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-1" />
              Upgrade for Rewind
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
