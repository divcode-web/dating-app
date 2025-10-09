"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Eye, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import toast from "react-hot-toast";

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
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [reactions, setReactions] = useState<any[]>([]);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [sendingReaction, setSendingReaction] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
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
        loadReactions();
      }
    }
  }, [story?.id, isOwnStory]);

  // Pause story when reply input, viewers, or reactions are shown
  useEffect(() => {
    setIsPaused(showReplyInput || showViewers || showReactions);
  }, [showReplyInput, showViewers, showReactions]);

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

  const loadReactions = async () => {
    if (!story) return;

    try {
      const { data, error } = await supabase
        .from('story_reactions')
        .select(`
          id,
          emoji,
          created_at,
          user_id,
          user_profiles!user_id (
            id,
            full_name,
            photos
          )
        `)
        .eq('story_id', story.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading reactions:", error);
        return;
      }

      setReactions(data || []);
    } catch (error) {
      console.error("Error loading reactions:", error);
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

  const handleEmojiReact = async (emoji: string) => {
    if (isOwnStory || sendingReaction) return;

    setSendingReaction(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to react");
        setSendingReaction(false);
        return;
      }

      const response = await fetch(`/api/stories/${story.id}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        setMyReaction(emoji);
        toast.success(`Reacted with ${emoji}`, { duration: 1500 });
        setTimeout(() => nextStory(), 500); // Auto advance after short delay
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to react");
      }
    } catch (error) {
      console.error("Error reacting to story:", error);
      toast.error("Failed to send reaction");
    } finally {
      setSendingReaction(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || isOwnStory || sendingReply) return;

    setSendingReply(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to reply");
        setSendingReply(false);
        return;
      }

      const response = await fetch(`/api/stories/${story.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (response.ok) {
        toast.success("Message sent!", { duration: 2000 });
        setReplyMessage("");
        setShowReplyInput(false);
        // Story will resume automatically when input closes
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error replying to story:", error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
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
                onClick={() => {
                  setShowViewers(!showViewers);
                  setShowReactions(false);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors flex items-center gap-1"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs">{viewers.length}</span>
              </button>
              <button
                onClick={() => {
                  setShowReactions(!showReactions);
                  setShowViewers(false);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors flex items-center gap-1"
              >
                <span className="text-lg">❤️</span>
                <span className="text-xs">{reactions.length}</span>
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

      {/* Navigation areas - Split screen for tap navigation */}
      <div className="absolute inset-0 flex z-5">
        {/* Left side - previous story */}
        <div
          className="flex-1 cursor-pointer active:bg-white/5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            previousStory();
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        />
        {/* Right side - next story */}
        <div
          className="flex-1 cursor-pointer active:bg-white/5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            nextStory();
          }}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              Viewers ({viewers.length})
            </h3>
            <button
              onClick={() => setShowViewers(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {viewers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No views yet</p>
            ) : (
              viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3">
                  <img
                    src={viewer.viewer?.photos?.[0] || "/default-avatar.png"}
                    alt={viewer.viewer?.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{viewer.viewer?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(viewer.viewed_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reactions panel */}
      {isOwnStory && showReactions && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-[50vh] overflow-y-auto z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              Reactions ({reactions.length})
            </h3>
            <button
              onClick={() => setShowReactions(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {reactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No reactions yet</p>
            ) : (
              reactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center gap-3">
                  <img
                    src={reaction.user_profiles?.photos?.[0] || "/default-avatar.png"}
                    alt={reaction.user_profiles?.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{reaction.user_profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(reaction.created_at)}
                    </p>
                  </div>
                  <span className="text-2xl">{reaction.emoji}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reply and Reactions UI (for viewing others' stories) */}
      {!isOwnStory && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe">
          {!showReplyInput ? (
            <div className="flex gap-2 items-center justify-center">
              {/* Quick emoji reactions */}
              <div className="flex gap-1 bg-black/40 backdrop-blur-md rounded-full px-2 py-1.5">
                {['❤️', '😂', '😮', '😢', '👏', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiReact(emoji)}
                    className="text-xl hover:scale-125 transition-transform active:scale-95 p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Reply button */}
              <button
                onClick={() => setShowReplyInput(true)}
                className="flex-shrink-0 bg-black/40 backdrop-blur-md text-white rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-black/50 transition-colors active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Reply</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 bg-white rounded-full px-3 py-2 shadow-lg max-w-md mx-auto">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                  if (e.key === 'Escape') {
                    setShowReplyInput(false);
                    setReplyMessage("");
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                autoFocus
              />
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || sendingReply}
                className="text-pink-500 disabled:text-gray-300 hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
              >
                {sendingReply ? (
                  <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
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
