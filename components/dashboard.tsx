"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getUserProfile, updateUserProfile, uploadPhoto } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Settings,
  Crown,
  MapPin,
  Camera,
  Star,
  Users,
  Sparkles,
  ChevronRight,
  Bell,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SwipeDeck } from "./swipe-deck";
import { ChatInterface } from "./chat-interface";
import {
  SearchFilters,
  type SearchFilters as SearchFiltersType,
} from "./search-filters";

export function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("discover");
  const [showChat, setShowChat] = useState(false);
  const [currentChat, setCurrentChat] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({
    ageRange: [18, 50],
    distance: 50,
    interests: [],
    gender: 'all',
    hasPhoto: false,
    isOnline: false
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Load admin messages on component mount
  useEffect(() => {
    if (user?.id) {
      loadAdminMessages();
    }
  }, [user?.id]);

  const tabs = [
    { id: "discover", label: "Discover", icon: Heart },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "matches", label: "Matches", icon: Users },
    { id: "profile", label: "Profile", icon: Camera },
  ];

  const handleOpenChat = (match: {
    id: string;
    name: string;
    avatar?: string;
  }) => {
    setCurrentChat(match);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setCurrentChat(null);
  };

  const handleApplyFilters = (filters: SearchFiltersType) => {
    setCurrentFilters(filters);
    console.log('Applied filters:', filters);
    // Here you would typically filter the profiles based on these criteria
  };

  const loadAdminMessages = async () => {
    if (!user?.id) return;

    try {
      setLoadingNotifications(true);

      // Load unread admin messages
      const { data, error } = await supabase
        .from("admin_messages")
        .select(`
          *,
          admin:admin_users(id, role)
        `)
        .eq("recipient_id", user.id)
        .eq("is_read", false)
        .not("admin_id", "is", null) // Only messages from admin
        .order("created_at", { ascending: false })
        .limit(5); // Show up to 5 recent unread messages

      if (error) {
        console.error("Error loading admin messages:", error);
        return;
      }

      if (data && data.length > 0) {
        // Get admin profile for each message
        const messagesWithProfiles = await Promise.all(
          data.map(async (msg) => {
            const { data: adminProfile } = await supabase
              .from("user_profiles")
              .select("id, full_name, photos, is_verified, is_premium")
              .eq("id", msg.admin_id)
              .single();

            return {
              ...msg,
              sender: adminProfile
            };
          })
        );

        setAdminMessages(messagesWithProfiles);
      } else {
        setAdminMessages([]);
      }
    } catch (error) {
      console.error("Error loading admin messages:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-1.5">
                <img
                  src="/lovento-icon.png"
                  alt="Lovento Logo"
                  className="h-12 w-auto object-contain"
                />
                <div className="flex flex-col -space-y-0.5">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">Lovento</h1>
                  <p className="text-sm text-gray-500">
                    Find your perfect match
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Stats */}
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-gray-700">12 matches</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">8 likes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">Premium</span>
                  </div>
                </div>

                <Button variant="outline" size="icon" className="relative" onClick={() => {
                  const newState = !showNotifications;
                  setShowNotifications(newState);
                  if (newState) {
                    loadAdminMessages();
                  }
                }}>
                  <Bell className="w-4 h-4" />
                  {adminMessages.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{adminMessages.length}</span>
                    </div>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={() => router.push('/settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notification-dropdown absolute top-16 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : adminMessages.length > 0 ? (
                adminMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setShowNotifications(false);
                      router.push('/messages');
                    }}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Admin Message</p>
                        <p className="text-xs text-gray-500">{msg.subject || 'System Message'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  router.push('/messages');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Messages
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg sticky top-24">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{tab.label}</span>
                          {tab.id === "messages" && (
                            <div className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                2
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === "discover" && (
                <DiscoverTab onOpenChat={handleOpenChat} onOpenFilters={() => setShowFilters(true)} />
              )}
              {activeTab === "messages" && (
                <MessagesTab onOpenChat={handleOpenChat} />
              )}
              {activeTab === "matches" && (
                <MatchesTab onOpenChat={handleOpenChat} />
              )}
              {activeTab === "profile" && <ProfileTab />}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {currentChat && (
        <ChatInterface
          matchId={currentChat.id}
          matchName={currentChat.name}
          matchAvatar={currentChat.avatar}
          isOnline={true}
          onBack={handleCloseChat}
          isVisible={showChat}
        />
      )}

      {/* Search Filters */}
      <SearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
      />
    </>
  );
}

function DiscoverTab({
  onOpenChat,
  onOpenFilters,
}: {
  onOpenChat: (match: { id: string; name: string; avatar?: string }) => void;
  onOpenFilters: () => void;
}) {
  const [showTutorial, setShowTutorial] = useState(false);

  // Mock data for demonstration
  const mockProfiles = [
    {
      id: "1",
      name: "Sarah Johnson",
      age: 28,
      bio: "Coffee enthusiast ☕ | Love hiking and photography 📸 | Looking for someone to explore the world with 🌍",
      photos: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      ],
      interests: ["Coffee", "Hiking", "Photography", "Travel"],
      distance: 2.3,
      isOnline: true,
    },
    {
      id: "2",
      name: "Mike Chen",
      age: 32,
      bio: "Software engineer by day, chef by night 👨‍🍳 | Love trying new restaurants and cooking at home",
      photos: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      ],
      interests: ["Cooking", "Technology", "Food", "Music"],
      distance: 5.1,
      isOnline: false,
    },
    {
      id: "3",
      name: "Emma Davis",
      age: 26,
      bio: "Yoga instructor 🧘‍♀️ | Passionate about wellness, meditation, and helping others find their inner peace",
      photos: [
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      ],
      interests: ["Yoga", "Meditation", "Wellness", "Nature"],
      distance: 1.8,
      isOnline: true,
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      age: 29,
      bio: "Adventure seeker 🚀 | Love rock climbing, scuba diving, and outdoor activities",
      photos: [
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      ],
      interests: ["Climbing", "Diving", "Adventure", "Fitness"],
      distance: 3.7,
      isOnline: false,
    },
  ];

  const [profiles, setProfiles] = useState(mockProfiles);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwipe = (
    profileId: string,
    direction: "left" | "right" | "up"
  ) => {
    console.log(`Swiped ${direction} on profile ${profileId}`);
    // Here you would typically send this to your backend
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProfiles([...mockProfiles].sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Discover</h2>
        <Button
          onClick={onOpenFilters}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Swipe Deck */}
      <div className="flex justify-center">
        <SwipeDeck
          profiles={profiles}
          onSwipe={handleSwipe}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowTutorial(true)}>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              How to Swipe
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <span>Swipe left to pass</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <span>Swipe up for super like</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <span>Swipe right to like</span>
              </div>
            </div>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                How to Use Lovento
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTutorial(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Master the Art of Swiping</h3>
                <p className="text-gray-600">Learn how to find your perfect match</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Swipe Left to Pass</h4>
                  <p className="text-sm text-gray-600">Not interested? Swipe left or tap the X button to pass on this profile.</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Swipe Up for Super Like</h4>
                  <p className="text-sm text-gray-600">Really like someone? Swipe up or tap the star for a super like - they'll know you really like them!</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Swipe Right to Like</h4>
                  <p className="text-sm text-gray-600">Found someone interesting? Swipe right or tap the heart to like their profile.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">💡 Pro Tips</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Be genuine:</strong> Write an authentic bio that reflects your personality</li>
                  <li>• <strong>Good photos:</strong> Use clear, recent photos where you're smiling</li>
                  <li>• <strong>Complete your profile:</strong> Fill out all sections to increase matches</li>
                  <li>• <strong>Be respectful:</strong> Treat everyone with kindness and respect</li>
                  <li>• <strong>Take your time:</strong> Quality matches are better than quantity</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">🎯 What Happens Next?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <strong>When you match:</strong><br />
                    Both people liked each other! You can now start chatting.
                  </div>
                  <div>
                    <strong>Premium features:</strong><br />
                    Unlock unlimited likes, see who liked you, and more!
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={() => setShowTutorial(false)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Got it! Let's start swiping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MessagesTab({
  onOpenChat,
}: {
  onOpenChat: (match: { id: string; name: string; avatar?: string }) => void;
}) {
  const mockConversations = [
    {
      id: "1",
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      lastMessage: "Hey! I saw we matched 😊",
      timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
      unread: true,
      online: true,
    },
    {
      id: "2",
      name: "Mike Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      lastMessage: "Thanks for the match!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      unread: false,
      online: false,
    },
    {
      id: "3",
      name: "Emma Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      lastMessage: "That sounds amazing! Tell me more",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      unread: false,
      online: true,
    },
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Messages
          </CardTitle>
          <CardDescription>Chat with your matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() =>
                  onOpenChat({
                    id: conversation.id,
                    name: conversation.name,
                    avatar: conversation.avatar,
                  })
                }
                className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <div className="relative">
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conversation.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 truncate">
                      {conversation.name}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function MatchesTab({
  onOpenChat,
}: {
  onOpenChat: (match: { id: string; name: string; avatar?: string }) => void;
}) {
  const mockMatches = [
    {
      id: "1",
      name: "Sarah Johnson",
      age: 28,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
      matchDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      lastMessage: "Hey! I saw we matched 😊",
      online: true,
    },
    {
      id: "2",
      name: "Mike Chen",
      age: 32,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      matchDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      lastMessage: "Thanks for the match!",
      online: false,
    },
    {
      id: "3",
      name: "Emma Davis",
      age: 26,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      matchDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
      lastMessage: "That sounds amazing!",
      online: true,
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      age: 29,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      matchDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      lastMessage: "Adventure awaits! 🏔️",
      online: false,
    },
  ];

  const formatMatchDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "1 week ago";
    return `${Math.floor(days / 7)} weeks ago`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Your Matches
          </CardTitle>
          <CardDescription>People you've matched with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockMatches.map((match) => (
              <div
                key={match.id}
                onClick={() =>
                  onOpenChat({
                    id: match.id,
                    name: match.name,
                    avatar: match.avatar,
                  })
                }
                className="text-center cursor-pointer group bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-200"
              >
                <div className="relative mb-3">
                  <img
                    src={match.avatar}
                    alt={match.name}
                    className="w-20 h-20 mx-auto rounded-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {match.online && (
                    <div className="absolute bottom-0 right-1/2 transform translate-x-6 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">
                  {match.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {match.age} years old
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  Matched {formatMatchDate(match.matchDate)}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {match.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    interests: [] as string[],
    photos: [] as string[],
    date_of_birth: '',
    gender: '',
    location: '',
    occupation: '',
    education: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
    }
  }, [user?.id])

  const loadUserProfile = async () => {
    try {
      const userProfile = await getUserProfile(user!.id)
      setProfile({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        interests: userProfile.interests || [],
        photos: userProfile.photos || [],
        date_of_birth: userProfile.date_of_birth || '',
        gender: userProfile.gender || '',
        location: userProfile.location_city || '',
        occupation: userProfile.occupation || '',
        education: userProfile.education || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handlePhotoUpload = async () => {
    if (!selectedFile) return

    try {
      setIsLoading(true)
      const photoUrl = await uploadPhoto(selectedFile)

      // Update profile with new photo
      const updatedPhotos = [...profile.photos, photoUrl]
      await updateUserProfile(user!.id, { photos: updatedPhotos })

      setProfile(prev => ({ ...prev, photos: updatedPhotos }))
      setSelectedFile(null)
      setPreviewUrl(null)

      toast.success('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      const updatedPhotos = profile.photos.filter(p => p !== photoUrl)
      await updateUserProfile(user!.id, { photos: updatedPhotos })
      setProfile(prev => ({ ...prev, photos: updatedPhotos }))
      toast.success('Photo removed')
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true)

      const updateData = {
        full_name: profile.full_name,
        bio: profile.bio,
        interests: profile.interests,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        location_city: profile.location,
        occupation: profile.occupation,
        education: profile.education
      }

      await updateUserProfile(user!.id, updateData)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const addInterest = (interest: string) => {
    if (interest.trim() && !profile.interests.includes(interest.trim())) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }))
    }
  }

  const removeInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  return (
    <div className="space-y-8">
      {/* Profile Photos */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Profile Photos
          </CardTitle>
          <CardDescription>Upload up to 6 photos to showcase yourself</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {profile.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Profile photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photo)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload new photo */}
              {profile.photos.length < 6 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors"
                     onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-10 h-10 text-gray-400 mb-3" />
                  <span className="text-sm text-gray-500 font-medium">Add Photo</span>
                </div>
              )}
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview and Upload */}
            {previewUrl && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ready to upload</p>
                  <p className="text-xs text-gray-500">{selectedFile?.name}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePhotoUpload}
                    disabled={isLoading}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-300 focus:ring-purple-200"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={profile.occupation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                  placeholder="What do you do?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={profile.education}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="School/University"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-300 focus:ring-purple-200 resize-none"
                rows={4}
                placeholder="Tell others about yourself, your interests, and what you're looking for..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{profile.bio.length}/500 characters</p>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest..."
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.target as HTMLInputElement
                      addInterest(input.value)
                      input.value = ''
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add an interest..."]') as HTMLInputElement
                    if (input?.value) {
                      addInterest(input.value)
                      input.value = ''
                    }
                  }}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
