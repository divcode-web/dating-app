"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Match, Message, UserProfile } from "@/lib/types";
import { getUserProfile, getMessages, sendMessage } from "@/lib/api";
import { format } from "date-fns";
import { Send, Image, MessageCircle, X, Flag, UserX, Eye, Bell, ArrowDown, ArrowLeft, Smile } from "lucide-react";
import { encryptMessage, decryptMessage, isEncrypted } from "@/lib/encryption";
import dynamic from 'next/dynamic';

// Dynamic imports for emoji and GIF pickers (client-side only)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const GifPicker = dynamic(() => import('gif-picker-react'), { ssr: false });

interface MatchWithProfile extends Match {
  profile: UserProfile;
  lastMessage?: Message;
  unreadCount?: number;
}

function DecryptedMessage({ content, className }: { content: string; className?: string }) {
  const [decrypted, setDecrypted] = useState(content);

  useEffect(() => {
    // Use the proper encryption detection function
    if (isEncrypted(content)) {
      decryptMessage(content)
        .then(setDecrypted)
        .catch((err) => {
          console.warn('Failed to decrypt message, showing as-is');
          setDecrypted(content);
        });
    } else {
      setDecrypted(content); // Already plain text (e.g., story replies)
    }
  }, [content]);

  return <p className={className}>{decrypted}</p>;
}

interface AdminMessage {
  id: string;
  subject: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name: string;
    photos: string[];
    is_verified: boolean;
    is_premium: boolean;
  };
}

function StoryReplyIndicator({ storyId, isSender }: { storyId: string; isSender: boolean }) {
  const [storyData, setStoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const { data } = await supabase
          .from('stories')
          .select('id, media_url, media_type, caption, is_active, expires_at')
          .eq('id', storyId)
          .single();

        setStoryData(data);
      } catch (error) {
        console.error('Error fetching story:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  const isExpired = storyData && (!storyData.is_active || new Date(storyData.expires_at) < new Date());

  return (
    <div className={`text-xs mb-2 pb-2 border-b ${
      isSender ? "border-white/20" : "border-gray-300 dark:border-gray-600"
    }`}>
      <div className="flex items-center gap-2">
        {/* Story Thumbnail */}
        {!loading && storyData && (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {storyData.media_type === 'image' ? (
              <img
                src={storyData.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={storyData.media_url}
                className="w-full h-full object-cover"
                muted
              />
            )}
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[8px] text-white font-medium">Expired</span>
              </div>
            )}
          </div>
        )}

        {/* Text Label */}
        <div className="flex-1">
          <div className="flex items-center gap-1 opacity-80">
            <MessageCircle className="w-3 h-3" />
            <span className="font-medium">
              {isSender ? "You replied to their story" : "Replied to your story"}
            </span>
          </div>
          {isExpired && (
            <p className="text-[10px] opacity-60 mt-0.5">Story has expired</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfile | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [selectedAdminMessage, setSelectedAdminMessage] = useState<AdminMessage | null>(null);
  const [adminConversation, setAdminConversation] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showAdminNotifications, setShowAdminNotifications] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [iceBreakers, setIceBreakers] = useState<{id: string; question: string; category: string}[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);
  const adminMessagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadMatches(true); // Show loading on initial load
      loadAdminMessages();
      loadBlockedUsers();
      syncOnlineStatus();

      // Poll for match updates (to refresh unread counts) every 5 seconds
      const matchInterval = setInterval(() => {
        loadMatches(false); // Don't show loading on poll
      }, 5000);

      // Poll for admin messages every 5 seconds
      const adminInterval = setInterval(() => {
        loadAdminMessages();
      }, 5000);

      return () => {
        clearInterval(matchInterval);
        clearInterval(adminInterval);
      };
    }
  }, [user?.id]);

  // Real-time online status sync
  const syncOnlineStatus = () => {
    if (!user?.id) return;

    // Update own status to online
    const updateStatus = async () => {
      await supabase
        .from("user_profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", user.id);
    };

    updateStatus();
    const statusInterval = setInterval(updateStatus, 30000); // Update every 30 seconds

    // Subscribe to other users' status changes
    const subscription = supabase
      .channel("online-users")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=neq.${user.id}`,
        },
        (payload) => {
          const userId = payload.new.id;
          const lastActive = new Date(payload.new.last_active).getTime();
          const isOnline = lastActive > Date.now() - 5 * 60 * 1000;

          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            if (isOnline) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(statusInterval);
      subscription.unsubscribe();
    };
  };

  const loadBlockedUsers = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id);

      setBlockedUsers(new Set(data?.map(b => b.blocked_id) || []));
    } catch (error) {
      console.error("Error loading blocked users:", error);
    }
  };

  const loadAdminMessages = async () => {
    try {
      // Get admin users
      const { data: adminUsers } = await supabase
        .from("admin_users")
        .select("id");

      if (adminUsers && adminUsers.length > 0) {
        setAdminId(adminUsers[0].id);
      }

      // Load latest admin message from admin_messages table (ONLY from admin, NOT user replies)
      const { data, error } = await supabase
        .from("admin_messages")
        .select(`
          *,
          admin:admin_users(id, role)
        `)
        .eq("recipient_id", user?.id)
        .not("admin_id", "is", null) // ONLY messages FROM admin (exclude user replies where admin_id is null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error loading admin messages:", error);
        return;
      }

      if (data && data.length > 0) {
        const latestMsg = data[0];

        // Get admin profile
        const { data: adminProfile } = await supabase
          .from("user_profiles")
          .select("id, full_name, photos, is_verified, is_premium")
          .eq("id", latestMsg.admin_id)
          .single();

        setAdminMessages([{
          id: 'admin-support',
          subject: latestMsg.subject || '',
          content: latestMsg.content,
          message_type: latestMsg.message_type || 'system',
          created_at: latestMsg.created_at,
          is_read: latestMsg.is_read || false,
          sender: adminProfile
        }] as any);
      } else {
        setAdminMessages([]);
      }
    } catch (error) {
      console.error("Error loading admin messages:", error);
    }
  };

  const loadAdminConversation = async (scrollToBottom = false) => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: true });

      // Convert admin_messages format to Message format for UI
      // admin_id = null means it's FROM the user (a reply)
      // admin_id = not null means it's FROM admin TO user
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.admin_id || user.id, // If admin_id is null, sender is the user
        content: msg.content,
        sent_at: msg.created_at,
        is_read: msg.is_read,
        created_at: msg.created_at
      }));
 
      setAdminConversation(formattedMessages as any);

      // Mark unread messages as read (only admin messages, not user's own replies)
      if (data) {
        const unreadIds = data.filter(m => !m.is_read && m.admin_id !== null).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("admin_messages")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }

      // Scroll to bottom only when requested (after sending message)
      if (scrollToBottom) {
        setTimeout(() => {
          adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error loading admin conversation:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      setAdminMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg)
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  useEffect(() => {
    if (selectedMatch && user?.id) {
      loadMessages(selectedMatch.id);

      // Poll for new messages every 3 seconds
      const messageInterval = setInterval(() => {
        loadMessages(selectedMatch.id);
      }, 3000);

      return () => {
        clearInterval(messageInterval);
      };
    }
  }, [selectedMatch?.id, user?.id]);

  const loadMatches = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (!matches) {
        setMatches([]);
        return;
      }

      const matchesWithProfiles = await Promise.all(
        matches.map(async (match) => {
          const otherUserId =
            match.user_id_1 === user?.id ? match.user_id_2 : match.user_id_1;
          const profile = await getUserProfile(otherUserId);

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*")
            .eq("match_id", match.id)
            .order("sent_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("match_id", match.id)
            .eq("sender_id", otherUserId)
            .is("read_at", null);

          return {
            ...match,
            profile,
            lastMessage,
            unreadCount: unreadCount || 0,
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (matchId: string) => {
    try {
      const messages = await getMessages(matchId);

      // Check if no messages and if user is blocked - this could indicate blocking
      if (!messages || messages.length === 0) {
        // Still set empty messages array
        setMessages([]);
      } else {
        setMessages(messages);
      }

      // Mark unread messages as read (only messages from other user)
      if (messages && user?.id) {
        const unreadMessages = messages.filter(m => !m.read_at && m.sender_id !== user.id);
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(m => m.id);
          const { error } = await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);

          if (error) {
            console.error("Error marking messages as read:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadIceBreakers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_random_ice_breakers', { limit_count: 3 });
      if (error) throw error;
      setIceBreakers(data || []);
      setShowIceBreakers(true);
    } catch (error) {
      console.error("Error loading ice breakers:", error);
      // Fallback ice breakers if function doesn't exist yet
      setIceBreakers([
        { id: '1', question: "If you could travel anywhere tomorrow, where would you go?", category: 'travel' },
        { id: '2', question: "What's your go-to karaoke song?", category: 'fun' },
        { id: '3', question: "Coffee or tea? Defend your choice! ☕🍵", category: 'food' }
      ]);
      setShowIceBreakers(true);
    }
  };

  const handleIceBreakerClick = async (question: string, questionId: string) => {
    setNewMessage(question);
    setShowIceBreakers(false);

    // Increment usage count
    try {
      await supabase.rpc('increment_ice_breaker_usage', { question_id: questionId });
    } catch (error) {
      console.error("Error incrementing ice breaker usage:", error);
    }
  };

  const handleEmojiSelect = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gif: any) => {
    // Insert GIF URL into message
    const gifUrl = gif.url || gif.preview_gif?.url || gif.media_formats?.gif?.url;
    if (gifUrl) {
      setNewMessage(prev => prev + ` ${gifUrl} `);
    }
    setShowGifPicker(false);
  };

  const handleSendMessage = async () => {
    if (!selectedMatch || (!newMessage.trim() && !selectedImage) || !user?.id) return;

    try {
      setUploading(true);
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileName = `chat-${Date.now()}-${selectedImage.name}`;
        const { data, error } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, selectedImage);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Encrypt message content (or use placeholder if only image)
      const messageContent = newMessage.trim() || "[Image]";

      // AI Moderation check (Phase 3)
      if (messageContent !== "[Image]") {
        const moderationResponse = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageContent, type: 'message' }),
        });

        const moderationResult = await moderationResponse.json();

        if (!moderationResult.allowed) {
          toast.error(`Message blocked: ${moderationResult.reason || 'Inappropriate content detected'}`);
          setUploading(false);
          return;
        }
      }

      const encrypted = await encryptMessage(messageContent);

      // Send message with optional image URL
      const { data, error } = await supabase.from("messages").insert({
        match_id: selectedMatch.id,
        sender_id: user.id,
        content: encrypted,
        image_url: imageUrl,
      }).select();

      if (error) throw error;

      // Add message to UI immediately
      if (data && data[0]) {
        setMessages((prev) => [...prev, data[0] as Message]);
      }

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.message?.includes("Daily message limit")) {
        toast.error("Daily message limit reached. Upgrade to premium!");
      } else if (error.code === '42501' || error.message?.includes('blocked') || error.message?.includes('policy')) {
        toast.error("Message failed: This user may have blocked you or you've blocked them");
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      setUploading(true);

      // Insert user reply into admin_messages table with admin_id as null to indicate it's from user
      const { error } = await supabase.from("admin_messages").insert({
        admin_id: null, // null indicates message is FROM user TO admin
        recipient_id: user.id, // Keep user as recipient for consistency in queries
        message_type: 'reply',
        subject: 'User Reply',
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage("");
      await loadAdminConversation(true); // Scroll to bottom after sending
      await loadAdminMessages();
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedMatch || !user?.id) return;

    const otherUserId =
      selectedMatch.user_id_1 === user.id
        ? selectedMatch.user_id_2
        : selectedMatch.user_id_1;

    try {
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: otherUserId,
        reason: "Blocked from chat",
        blocked_by_admin: false,
      });

      if (error) throw error;

      toast.success("User blocked successfully");
      setBlockedUsers(prev => new Set(Array.from(prev).concat(otherUserId)));
      setSelectedMatch(null);
      loadMatches();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      if (error.code === '23505') {
        toast.error("User is already blocked");
      } else {
        toast.error("Failed to block user");
      }
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedMatch || !user?.id) return;

    const otherUserId =
      selectedMatch.user_id_1 === user.id
        ? selectedMatch.user_id_2
        : selectedMatch.user_id_1;

    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", otherUserId);

      if (error) throw error;

      toast.success("User unblocked successfully");
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(otherUserId);
        return newSet;
      });
      loadMatches();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    }
  };

  const handleReportUser = async () => {
    if (!selectedMatch || !user?.id || !reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    const otherUserId =
      selectedMatch.user_id_1 === user.id
        ? selectedMatch.user_id_2
        : selectedMatch.user_id_1;

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: otherUserId,
        report_type: "user",
        reason: reportReason,
      });

      if (error) throw error;

      toast.success("Report submitted successfully");
      setShowReportDialog(false);
      setReportReason("");
    } catch (error) {
      console.error("Error reporting user:", error);
      toast.error("Failed to submit report");
    }
  };

  const handleViewProfile = () => {
    if (!selectedMatch) return;

    const otherUserId =
      selectedMatch.user_id_1 === user?.id
        ? selectedMatch.user_id_2
        : selectedMatch.user_id_1;

    router.push(`/profile?userId=${otherUserId}`);
  };

  const formatTime = (date: string) => {
    if (!date) return "";
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matches.length === 0 && adminMessages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">No messages yet</h2>
          <p className="text-gray-600 mb-6">
            Start swiping and matching with people to begin chatting!
          </p>
          <Button
            onClick={() => router.push("/swipe")}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            Find Your Match
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden h-[calc(100vh-2rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Matches List */}
          <div className={`border-r dark:border-gray-700 h-full ${selectedMatch || selectedAdminMessage ? 'hidden md:block' : 'block'}`}>
            <div className="p-4 border-b dark:border-gray-700 flex-shrink-0 flex items-center justify-between bg-white dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
              {/* Admin Notification Bell - Desktop Only */}
              {adminMessages.length > 0 && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowAdminNotifications(!showAdminNotifications)}
                    className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {adminMessages.some(msg => !msg.is_read) && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {/* Admin Notifications Dropdown */}
                  {showAdminNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700 font-semibold text-sm text-blue-900 dark:text-blue-100 sticky top-0">
                        System Messages
                      </div>
                      {adminMessages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => {
                            setSelectedMatch(null);
                            setSelectedAdminMessage(msg);
                            loadAdminConversation();
                            setShowAdminNotifications(false);
                          }}
                          className={`p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                            !msg.is_read ? "bg-blue-50/50 dark:bg-blue-900/30" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={msg.sender?.photos?.[0] || "/default-avatar.png"}
                              alt={msg.sender?.full_name || "Admin"}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                                {msg.sender?.full_name || "System Message"}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {msg.content.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </div>
                            </div>
                            {!msg.is_read && (
                              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">

              {/* User Matches */}
              {matches.map((match) => {
                const otherUserId = match.user_id_1 === user?.id ? match.user_id_2 : match.user_id_1;
                const isOnline = onlineUsers.has(otherUserId) ||
                  (match.profile?.last_active && new Date(match.profile.last_active).getTime() > Date.now() - 5 * 60 * 1000);

                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      setSelectedMatch(match);
                      setSelectedAdminMessage(null);
                    }}
                    className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedMatch?.id === match.id ? "bg-gray-50 dark:bg-gray-800" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={match.profile.photos?.[0] || "/default-avatar.png"}
                          alt={match.profile.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">{match.profile.full_name}</h3>
                          {(match.unreadCount ?? 0) > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                              {(match.unreadCount ?? 0) > 99 ? '99+' : match.unreadCount}
                            </span>
                          )}
                        </div>
                        {match.lastMessage && (
                          <DecryptedMessage
                            content={match.lastMessage.content}
                            className="text-sm text-gray-500 truncate"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`col-span-1 md:col-span-2 h-full flex-col overflow-hidden ${selectedMatch || selectedAdminMessage ? 'flex' : 'hidden md:flex'}`}>
            {/* Mobile Header with Bell Icon */}
            <div className="md:hidden p-4 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
              {(selectedMatch || selectedAdminMessage) && (
                <button
                  onClick={() => {
                    setSelectedMatch(null);
                    setSelectedAdminMessage(null);
                  }}
                  className="mr-2 text-gray-900 dark:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
              {adminMessages.length > 0 && (
                <div className="relative md:hidden">
                  <button
                    onClick={() => setShowAdminNotifications(!showAdminNotifications)}
                    className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {adminMessages.some(msg => !msg.is_read) && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {/* Admin Notifications Dropdown - Mobile */}
                  {showAdminNotifications && (
                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700 font-semibold text-sm text-blue-900 dark:text-blue-100 sticky top-0">
                        System Messages
                      </div>
                      {adminMessages.map((msg) => (
                        <div
                          key={`mobile-${msg.id}`}
                          onClick={() => {
                            setSelectedMatch(null);
                            setSelectedAdminMessage(msg);
                            loadAdminConversation();
                            setShowAdminNotifications(false);
                          }}
                          className={`p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                            !msg.is_read ? "bg-blue-50/50 dark:bg-blue-900/30" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={msg.sender?.photos?.[0] || "/default-avatar.png"}
                              alt={msg.sender?.full_name || "Admin"}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                                {msg.sender?.full_name || "System Message"}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {msg.content.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </div>
                            </div>
                            {!msg.is_read && (
                              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedAdminMessage ? (
              /* Admin Message View */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedAdminMessage.sender?.photos?.[0] || "/default-avatar.png"}
                        alt={selectedAdminMessage.sender?.full_name || "Admin"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white"
                      />
                      <div className="text-white">
                        <h3 className="font-semibold">{selectedAdminMessage.sender?.full_name || "Admin Team"}</h3>
                        <p className="text-xs text-pink-100">
                          {format(new Date(selectedAdminMessage.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAdminMessage(null)}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Messages Area */}
                <div
                  ref={adminMessagesContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0 relative"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                    setShowScrollButton(!isAtBottom);
                  }}
                >
                  {adminConversation.map((message) => {
                    const isFromUser = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                            isFromUser
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-sm"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm md:text-base">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isFromUser ? "text-pink-100" : "text-gray-500"
                            }`}
                          >
                            {format(new Date(message.sent_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={adminMessagesEndRef} />

                  {/* Scroll to Bottom Button */}
                  {showScrollButton && (
                    <button
                      onClick={() => adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="fixed bottom-24 right-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-10"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-3 md:p-4 border-t bg-white dark:bg-gray-800 flex-shrink-0">
                  <div className="flex items-end space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendToAdmin();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 text-sm md:text-base"
                    />
                    <Button
                      onClick={handleSendToAdmin}
                      disabled={!newMessage.trim() || uploading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedMatch ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={
                            selectedMatch.profile.photos?.[0] ||
                            "/default-avatar.png"
                          }
                          alt={selectedMatch.profile.full_name}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80"
                          onClick={handleViewProfile}
                        />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          (() => {
                            const otherUserId = selectedMatch.user_id_1 === user?.id ? selectedMatch.user_id_2 : selectedMatch.user_id_1;
                            return onlineUsers.has(otherUserId) ||
                              (selectedMatch.profile?.last_active &&
                               new Date(selectedMatch.profile.last_active).getTime() > Date.now() - 5 * 60 * 1000)
                              ? "bg-green-500"
                              : "bg-gray-400";
                          })()
                        }`}></div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-pink-600 dark:hover:text-pink-400" onClick={handleViewProfile}>
                          {selectedMatch.profile.full_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedMatch.profile.bio?.slice(0, 50)}
                          {(selectedMatch.profile.bio?.length || 0) > 50
                            ? "..."
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleViewProfile}
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowReportDialog(true)}
                        title="Report User"
                      >
                        <Flag className="w-4 h-4 text-orange-500" />
                      </Button>
                      {blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      ) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUnblockUser}
                          title="Unblock User"
                        >
                          <UserX className="w-4 h-4 text-green-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBlockUser}
                          title="Block User"
                        >
                          <UserX className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Blocked User Warning */}
                {blockedUsers.has(
                  selectedMatch.user_id_1 === user?.id
                    ? selectedMatch.user_id_2
                    : selectedMatch.user_id_1
                ) && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <div>
                          <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                            You blocked this user
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            Unblock to send and receive messages
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleUnblockUser}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Unblock
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.sender_id === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          message.sender_id === user?.id
                            ? "bg-primary text-white ml-auto rounded-br-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md"
                        }`}
                      >
                        {/* Story Reply Indicator */}
                        {message.story_id && (
                          <StoryReplyIndicator
                            storyId={message.story_id}
                            isSender={message.sender_id === user?.id}
                          />
                        )}
                        {(message as any).image_url && (
                          <img
                            src={(message as any).image_url}
                            alt="Shared image"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        <DecryptedMessage
                          content={message.content}
                          className="text-sm"
                        />
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Ice Breaker Section */}
                {messages.length === 0 && !showIceBreakers && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-t border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">Need a conversation starter?</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">Get fun questions to break the ice!</p>
                      </div>
                      <Button
                        onClick={loadIceBreakers}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        Get Questions
                      </Button>
                    </div>
                  </div>
                )}

                {/* Ice Breaker Questions Popup */}
                {showIceBreakers && (
                  <div className="p-4 border-t border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Pick a question to start:</h3>
                      <button
                        onClick={() => setShowIceBreakers(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {iceBreakers.map((breaker) => (
                        <button
                          key={breaker.id}
                          onClick={() => handleIceBreakerClick(breaker.question, breaker.id)}
                          className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700 transition-colors"
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200">{breaker.question}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {breaker.category}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={loadIceBreakers}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-medium"
                    >
                      ↻ Get different questions
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                  {blockedUsers.has(
                    selectedMatch.user_id_1 === user?.id
                      ? selectedMatch.user_id_2
                      : selectedMatch.user_id_1
                  ) && (
                    <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg text-center">
                      <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
                        You need to unblock this user to send messages
                      </p>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 left-4 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}

                  {/* GIF Picker */}
                  {showGifPicker && (
                    <div className="absolute bottom-20 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                      <div className="p-2 border-b dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Search GIFs</h3>
                        <button
                          onClick={() => setShowGifPicker(false)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <GifPicker
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyDhxw8zC0jVZsGP0y1rF7y3x0Y1rYqkLQc"}
                        onGifClick={handleGifSelect}
                        width={300}
                        height={400}
                      />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={uploading || blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowGifPicker(false);
                      }}
                      disabled={uploading || blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        setShowGifPicker(!showGifPicker);
                        setShowEmojiPicker(false);
                      }}
                      disabled={uploading || blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                    >
                      GIF
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        blockedUsers.has(
                          selectedMatch.user_id_1 === user?.id
                            ? selectedMatch.user_id_2
                            : selectedMatch.user_id_1
                        )
                          ? "Unblock to send messages..."
                          : "Type a message..."
                      }
                      onKeyPress={(e) =>
                        e.key === "Enter" && !uploading && handleSendMessage()
                      }
                      disabled={uploading || blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedImage) || uploading || blockedUsers.has(
                        selectedMatch.user_id_1 === user?.id
                          ? selectedMatch.user_id_2
                          : selectedMatch.user_id_1
                      )}
                      className="shrink-0"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Report Dialog */}
                {showReportDialog && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Report User</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please describe why you're reporting this user. Our team will review your report.
                      </p>
                      <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Describe the issue..."
                        className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg p-3 mb-4 min-h-[100px]"
                        maxLength={500}
                      />
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReportDialog(false);
                            setReportReason("");
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleReportUser}
                          className="flex-1 bg-red-500 hover:bg-red-600"
                        >
                          Submit Report
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mt-1">
                    Choose from your matches to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
