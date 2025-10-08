"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url?: string | null;
  caption?: string | null;
  duration: number;
  created_at: string;
  expires_at: string;
  is_viewed?: boolean;
  view_count?: number;
  user?: {
    id: string;
    full_name: string;
    profile_photo: string | null;
  };
}

interface UserStories {
  user_id: string;
  user: {
    id: string;
    full_name: string;
    profile_photo: string | null;
  };
  stories: Story[];
  has_unviewed: boolean;
  latest_story_at: string;
}

interface StoriesRingProps {
  onStoryClick: (userStories: UserStories) => void;
  onAddStoryClick: () => void;
}

export function StoriesRing({ onStoryClick, onAddStoryClick }: StoriesRingProps) {
  const { user } = useAuth();
  const [storiesData, setStoriesData] = useState<UserStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStories();
    }
  }, [user?.id]);

  const loadStories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load stories from matches
      const response = await fetch("/api/stories/matches", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStoriesData(data.stories || []);
      }

      // Load user's own stories
      const { data: ownStories } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      setMyStories(ownStories || []);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
      {/* Add Story Button */}
      <div className="flex-shrink-0 cursor-pointer" onClick={onAddStoryClick}>
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-dashed border-pink-300 flex items-center justify-center hover:border-pink-500 transition-colors">
            <Plus className="w-8 h-8 text-pink-500" />
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
        </div>
        <p className="text-xs text-center mt-2 font-medium">Your Story</p>
      </div>

      {/* User's Own Stories (if they have any) */}
      {myStories.length > 0 && (
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() =>
            onStoryClick({
              user_id: user?.id!,
              user: {
                id: user?.id!,
                full_name: "You",
                profile_photo: null,
              },
              stories: myStories,
              has_unviewed: false,
              latest_story_at: myStories[0].created_at,
            })
          }
        >
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600`}
            >
              <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                <img
                  src={myStories[0]?.media_url || "/default-avatar.png"}
                  alt="Your story"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-2 font-medium truncate w-16">
            You ({myStories.length})
          </p>
        </div>
      )}

      {/* Stories from matches */}
      {storiesData.map((userStory) => (
        <div
          key={userStory.user_id}
          className="flex-shrink-0 cursor-pointer"
          onClick={() => onStoryClick(userStory)}
        >
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full p-[3px] ${
                userStory.has_unviewed
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  : "bg-gray-300"
              }`}
            >
              <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                <img
                  src={userStory.user.profile_photo || "/default-avatar.png"}
                  alt={userStory.user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-2 font-medium truncate w-16">
            {userStory.user.full_name.split(" ")[0]}
          </p>
        </div>
      ))}
    </div>
  );
}
