"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

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

interface StoryViewerProps {
  userStoriesData: UserStories[];
  currentUserIndex: number;
  onClose: () => void;
}

export function StoryViewer({
  userStoriesData,
  currentUserIndex,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(currentUserIndex);
  const [currentStory, setCurrentStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentUserStories = userStoriesData[currentUser];
  const story = currentUserStories?.stories[currentStory];
  const isOwnStory = story?.user_id === user?.id;

  useEffect(() => {
    if (story) {
      markStoryAsViewed();
      if (isOwnStory) {
        loadViewers();
      }
    }
  }, [story?.id]);

  useEffect(() => {
    if (!isPaused && story) {
      const duration = story.media_type === "video" ? story.duration * 1000 : 5000;
      const increment = 100 / (duration / 50);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + increment;
        });
      }, 50);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPaused, currentStory, currentUser, story]);

  const markStoryAsViewed = async () => {
    if (!story || isOwnStory) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/stories/${story.id}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const loadViewers = async () => {
    if (!story) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/stories/${story.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setViewers(data.story.viewers || []);
      }
    } catch (error) {
      console.error("Error loading viewers:", error);
    }
  };

  const nextStory = () => {
    if (currentStory < currentUserStories.stories.length - 1) {
      setCurrentStory(currentStory + 1);
      setProgress(0);
    } else {
      nextUser();
    }
  };

  const previousStory = () => {
    if (currentStory > 0) {
      setCurrentStory(currentStory - 1);
      setProgress(0);
    } else {
      previousUser();
    }
  };

  const nextUser = () => {
    if (currentUser < userStoriesData.length - 1) {
      setCurrentUser(currentUser + 1);
      setCurrentStory(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const previousUser = () => {
    if (currentUser > 0) {
      setCurrentUser(currentUser - 1);
      const prevUserStories = userStoriesData[currentUser - 1];
      setCurrentStory(prevUserStories.stories.length - 1);
      setProgress(0);
    }
  };

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  const deleteStory = async () => {
    if (!story || !isOwnStory) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/stories/${story.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Remove story from current data
        currentUserStories.stories.splice(currentStory, 1);

        if (currentUserStories.stories.length === 0) {
          onClose();
        } else if (currentStory >= currentUserStories.stories.length) {
          setCurrentStory(currentUserStories.stories.length - 1);
        }
        setProgress(0);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {currentUserStories.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width: `${
                  index === currentStory
                    ? progress
                    : index < currentStory
                    ? 100
                    : 0
                }%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img
            src={currentUserStories.user.profile_photo || "/default-avatar.png"}
            alt={currentUserStories.user.full_name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">
              {currentUserStories.user.full_name}
            </p>
            <p className="text-white/70 text-xs">{formatTimeAgo(story.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwnStory && (
            <>
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs ml-1">{viewers.length}</span>
              </button>
              <button
                onClick={deleteStory}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        <div
          className="flex-1 cursor-pointer"
          onClick={previousStory}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        />
        <div
          className="flex-1 cursor-pointer"
          onClick={nextStory}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        />
      </div>

      {/* Story content */}
      <div className="relative w-full h-full max-w-lg flex items-center justify-center">
        {story.media_type === "image" ? (
          <img
            src={story.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={story.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <p className="text-white text-center bg-black/50 py-2 px-4 rounded-lg">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Viewers panel */}
      {isOwnStory && showViewers && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-[50vh] overflow-y-auto z-20">
          <h3 className="font-semibold text-lg mb-4">
            Viewers ({viewers.length})
          </h3>
          <div className="space-y-3">
            {viewers.map((viewer) => (
              <div key={viewer.id} className="flex items-center gap-3">
                <img
                  src={viewer.viewer?.photos?.[0] || "/default-avatar.png"}
                  alt={viewer.viewer?.full_name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium">{viewer.viewer?.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(viewer.viewed_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      <button
        onClick={previousUser}
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={nextUser}
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors z-10"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </div>
  );
}
