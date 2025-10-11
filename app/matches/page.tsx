"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin, Heart } from "lucide-react";
import { getUserProfile } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import { StoriesRing } from "@/components/stories-ring";
import { StoryViewer } from "@/components/story-viewer";
import { StoryUpload } from "@/components/story-upload";

interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  matched_at: string;
  profile?: UserProfile;
}

export default function MatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [selectedStories, setSelectedStories] = useState<any>(null);
  const [storiesKey, setStoriesKey] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadMatches();
    }
  }, [user?.id]);

  const loadMatches = async () => {
    try {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`)
        .order("matched_at", { ascending: false });

      if (data) {
        const matchesWithProfiles = await Promise.all(
          data.map(async (match) => {
            const otherUserId =
              match.user_id_1 === user?.id ? match.user_id_2 : match.user_id_1;
            try {
              const profile = await getUserProfile(otherUserId);
              return { ...match, profile };
            } catch (error) {
              return match;
            }
          })
        );
        setMatches(matchesWithProfiles);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="p-12 max-w-md text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
          <p className="text-gray-600 mb-6">
            Start swiping to find your perfect match!
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
        <h1 className="text-3xl font-bold mb-6">Your Matches</h1>

        {/* Stories Ring */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-4">
          <StoriesRing
            key={storiesKey}
            onStoryClick={(userStories) => {
              setSelectedStories([userStories]);
              setShowStoryViewer(true);
            }}
            onAddStoryClick={() => setShowStoryUpload(true)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => {
            const isOnline = match.profile?.last_active
              ? new Date(match.profile.last_active).getTime() > Date.now() - 5 * 60 * 1000
              : false;

            return (
              <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-64">
                  <img
                    src={match.profile?.photos?.[0] || "/default-avatar.png"}
                    alt={match.profile?.full_name || "User"}
                    className="w-full h-full object-cover"
                  />
                  {match.profile?.last_active && (
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}></div>
                  )}
                </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold">
                  {match.profile?.full_name || "User"}
                </h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {match.profile?.bio || "No bio available"}
                </p>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{match.profile?.location_city || "Unknown"}</span>
                </div>
                <Button
                  onClick={() => router.push(`/messages`)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {showStoryViewer && selectedStories && (
        <StoryViewer
          userStoriesData={selectedStories}
          currentUserIndex={0}
          onClose={() => {
            setShowStoryViewer(false);
            setSelectedStories(null);
            setStoriesKey((prev) => prev + 1); // Refresh stories ring
          }}
        />
      )}

      {/* Story Upload */}
      {showStoryUpload && (
        <StoryUpload
          onClose={() => setShowStoryUpload(false)}
          onUploadComplete={() => {
            setStoriesKey((prev) => prev + 1); // Refresh stories ring
          }}
        />
      )}
    </div>
  );
}
