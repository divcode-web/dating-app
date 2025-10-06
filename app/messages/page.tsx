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
import { Send, Image, MessageCircle, X, Flag, UserX, Eye, Bell, ArrowDown, ArrowLeft } from "lucide-react";
import { encryptMessage, decryptMessage } from "@/lib/encryption";

interface MatchWithProfile extends Match {
  profile: UserProfile;
  lastMessage?: Message;
}

function DecryptedMessage({ content, className }: { content: string; className?: string }) {
  const [decrypted, setDecrypted] = useState(content);

  useEffect(() => {
    decryptMessage(content)
      .then(setDecrypted)
      .catch(() => setDecrypted(content)); // Fallback to original if decryption fails
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
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);
  const adminMessagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadMatches();
      loadAdminMessages();
    }
  }, [user?.id]);

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
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
      // Subscribe to real-time updates
      const subscription = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${selectedMatch.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedMatch?.id]);

  const loadMatches = async () => {
    try {
      setLoading(true);
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
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...match,
            profile,
            lastMessage,
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (matchId: string) => {
    try {
      const messages = await getMessages(matchId);
      setMessages(messages);
    } catch (error) {
      console.error("Error loading messages:", error);
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
      const encrypted = await encryptMessage(messageContent);

      // Send message with optional image URL
      const { error } = await supabase.from("messages").insert({
        match_id: selectedMatch.id,
        sender_id: user.id,
        content: encrypted,
        image_url: imageUrl,
      });

      if (error) throw error;

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.message?.includes("Daily message limit")) {
        toast.error("Daily message limit reached. Upgrade to premium!");
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
      });

      if (error) throw error;

      toast.success("User blocked successfully");
      setSelectedMatch(null);
      loadMatches();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
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
    return format(new Date(date), "HH:mm");
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-2rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Matches List */}
          <div className={`border-r h-full ${selectedMatch || selectedAdminMessage ? 'hidden md:block' : 'block'}`}>
            <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Messages</h2>
              {/* Admin Notification Bell */}
              {adminMessages.length > 0 && (
                <div className="relative">
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
                    <div className="absolute right-0 top-12 w-80 bg-white border shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 bg-blue-50 border-b font-semibold text-sm text-blue-900 sticky top-0">
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
                          className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${
                            !msg.is_read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={msg.sender?.photos?.[0] || "/default-avatar.png"}
                              alt={msg.sender?.full_name || "Admin"}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-900 truncate">
                                {msg.sender?.full_name || "System Message"}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {msg.content.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </div>
                            </div>
                            {!msg.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">

              {/* User Matches */}
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => {
                    setSelectedMatch(match);
                    setSelectedAdminMessage(null);
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedMatch?.id === match.id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.profile.photos?.[0] || "/default-avatar.png"}
                      alt={match.profile.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{match.profile.full_name}</h3>
                      {match.lastMessage && (
                        <DecryptedMessage
                          content={match.lastMessage.content}
                          className="text-sm text-gray-500 truncate"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`col-span-1 md:col-span-2 h-full flex-col overflow-hidden ${selectedMatch || selectedAdminMessage ? 'flex' : 'hidden md:flex'}`}>
            {/* Mobile Header with Bell Icon */}
            <div className="md:hidden p-4 border-b flex items-center justify-between bg-white">
              {(selectedMatch || selectedAdminMessage) && (
                <button
                  onClick={() => {
                    setSelectedMatch(null);
                    setSelectedAdminMessage(null);
                  }}
                  className="mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-semibold">Messages</h2>
              {adminMessages.length > 0 && (
                <div className="relative">
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
                    <div className="absolute right-0 top-12 w-80 bg-white border shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 bg-blue-50 border-b font-semibold text-sm text-blue-900 sticky top-0">
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
                          className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${
                            !msg.is_read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={msg.sender?.photos?.[0] || "/default-avatar.png"}
                              alt={msg.sender?.full_name || "Admin"}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-900 truncate">
                                {msg.sender?.full_name || "System Message"}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {msg.content.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </div>
                            </div>
                            {!msg.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
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
                <div className="p-4 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          selectedMatch.profile.photos?.[0] ||
                          "/default-avatar.png"
                        }
                        alt={selectedMatch.profile.full_name}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80"
                        onClick={handleViewProfile}
                      />
                      <div>
                        <h3 className="font-medium cursor-pointer hover:text-pink-600" onClick={handleViewProfile}>
                          {selectedMatch.profile.full_name}
                        </h3>
                        <p className="text-sm text-gray-500">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBlockUser}
                        title="Block User"
                      >
                        <UserX className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
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
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
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
                </div>

                {/* Message Input */}
                <div className="p-4 border-t flex-shrink-0">
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
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={uploading}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) =>
                        e.key === "Enter" && !uploading && handleSendMessage()
                      }
                      disabled={uploading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedImage) || uploading}
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
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                      <h3 className="text-xl font-bold mb-4">Report User</h3>
                      <p className="text-gray-600 mb-4">
                        Please describe why you're reporting this user. Our team will review your report.
                      </p>
                      <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Describe the issue..."
                        className="w-full border rounded-lg p-3 mb-4 min-h-[100px]"
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
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-600">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 mt-1">
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
