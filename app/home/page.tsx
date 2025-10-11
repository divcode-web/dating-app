"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Star, TrendingUp, Users, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RecentActivity {
  type: 'match' | 'like' | 'message';
  name: string;
  time: string;
  photo?: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    matches: 0,
    likes: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
      loadRecentActivity();

      // Mark matches as viewed when user lands on this page
      updateLastViewedMatches();

      // Poll for updates every 5 seconds
      const statsInterval = setInterval(() => {
        loadStats();
      }, 5000);

      return () => {
        clearInterval(statsInterval);
      };
    }
  }, [user?.id]);

  const updateLastViewedMatches = async () => {
    try {
      await supabase
        .from("user_profiles")
        .update({ last_viewed_matches_at: new Date().toISOString() })
        .eq("id", user?.id);
    } catch (error) {
      console.error("Error updating last viewed matches:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Get matches count
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`);

      // Get likes received count
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", user?.id);

      // Get unread messages count (only messages received, not sent)
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`);

      let messagesCount = 0;
      if (matches) {
        const matchIds = matches.map((m) => m.id);
        const { count, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("match_id", matchIds)
          .neq("sender_id", user?.id)
          .is("read_at", null);

        if (countError) {
          console.error("Error counting unread messages:", countError);
        }

        messagesCount = count || 0;
      }

      setStats({
        matches: matchesCount || 0,
        likes: likesCount || 0,
        messages: messagesCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent matches (last 5)
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          matched_at,
          user_id_1,
          user_id_2
        `)
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`)
        .order("matched_at", { ascending: false })
        .limit(5);

      if (matches) {
        for (const match of matches) {
          const otherId = match.user_id_1 === user?.id ? match.user_id_2 : match.user_id_1;
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name, photos")
            .eq("id", otherId)
            .single();

          if (profile) {
            activities.push({
              type: 'match',
              name: profile.full_name,
              time: match.matched_at,
              photo: profile.photos?.[0]
            });
          }
        }
      }

      // Get recent likes received (last 3)
      const { data: likes } = await supabase
        .from("likes")
        .select(`
          created_at,
          from_user_id
        `)
        .eq("to_user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (likes) {
        for (const like of likes) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name, photos")
            .eq("id", like.from_user_id)
            .single();

          if (profile) {
            activities.push({
              type: 'like',
              name: profile.full_name,
              time: like.created_at,
              photo: profile.photos?.[0]
            });
          }
        }
      }

      // Sort by time and take top 5
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ready to find your perfect match today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/matches")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Matches</p>
                <p className="text-3xl font-bold text-pink-500">{stats.matches}</p>
              </div>
              <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-full">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/likes")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Likes You</p>
                <p className="text-3xl font-bold text-purple-500">{stats.likes}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/messages")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">New Messages</p>
                <p className="text-3xl font-bold text-blue-500">{stats.messages}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 bg-gradient-to-br from-pink-500 to-purple-600 text-white">
            <Zap className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Start Swiping</h3>
            <p className="mb-6 opacity-90">
              Discover new people and find your perfect match
            </p>
            <Button
              onClick={() => router.push("/swipe")}
              className="w-full !text-white font-semibold"
            >
              Start Swiping
            </Button>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <Users className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Your Matches</h3>
            <p className="mb-6 opacity-90">
              See who you matched with and start chatting
            </p>
            <Button
              onClick={() => router.push("/matches")}
              className="w-full !text-white font-semibold"
            >
              View Matches
            </Button>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="mt-8 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
            <h3 className="text-xl font-semibold">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <img
                    src={activity.photo || '/default-avatar.png'}
                    alt={activity.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm">
                      {activity.type === 'match' && (
                        <>
                          <Heart className="w-4 h-4 inline text-pink-500 mr-1" />
                          You matched with <span className="font-semibold">{activity.name}</span>
                        </>
                      )}
                      {activity.type === 'like' && (
                        <>
                          <Star className="w-4 h-4 inline text-purple-500 mr-1" />
                          <span className="font-semibold">{activity.name}</span> liked you
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Your activity will appear here</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
