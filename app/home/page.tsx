"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Star, TrendingUp, Users, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    matches: 0,
    likes: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

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

      // Get messages count
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`);

      let messagesCount = 0;
      if (matches) {
        const matchIds = matches.map((m) => m.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("match_id", matchIds);
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
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
              className="w-full bg-white text-pink-600 hover:bg-gray-100"
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
              className="w-full bg-white text-blue-600 hover:bg-gray-100"
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
          <div className="text-center py-8 text-gray-500">
            <p>Your activity will appear here</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
