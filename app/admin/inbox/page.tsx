"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Inbox as InboxIcon } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface ConversationMessage {
  id: string;
  admin_id: string | null;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface UserConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function AdminInboxPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string>("");
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (adminId) {
      loadConversations();
    }
  }, [adminId]);

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId);
    }
  }, [selectedUserId]);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const { data } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) {
      toast.error("Unauthorized");
      router.push("/");
      return;
    }

    setAdminId(user.id);
  };

  const loadConversations = async () => {
    // Get all users who have sent messages
    const { data: userReplies } = await supabase
      .from("admin_messages")
      .select(`
        recipient_id,
        content,
        created_at,
        is_read,
        user_profile:user_profiles!recipient_id(full_name)
      `)
      .order("created_at", { ascending: false });

    if (!userReplies) return;

    // Group by user and get latest message
    const userMap = new Map<string, UserConversation>();

    userReplies.forEach((msg: any) => {
      if (!userMap.has(msg.recipient_id)) {
        userMap.set(msg.recipient_id, {
          userId: msg.recipient_id,
          userName: msg.user_profile?.full_name || "Unknown User",
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        });
      }
    });

    setConversations(Array.from(userMap.values()));
  };

  const loadConversation = async (userId: string) => {
    const { data } = await supabase
      .from("admin_messages")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark as read
    await supabase
      .from("admin_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .is("admin_id", null)
      .eq("is_read", false);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !adminId) return;

    try {
      setLoading(true);

      const { error } = await supabase.from("admin_messages").insert({
        admin_id: adminId,
        recipient_id: selectedUserId,
        message_type: "reply",
        subject: "Reply from Admin",
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage("");
      await loadConversation(selectedUserId);
      toast.success("Message sent");
    } catch (error) {
      // console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Messages Inbox</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and respond to user messages
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="p-4 overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <InboxIcon className="w-4 h-4" />
              Conversations ({conversations.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.userId}
                  onClick={() => setSelectedUserId(conv.userId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUserId === conv.userId
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  } border`}
                >
                  <div className="font-medium text-sm">{conv.userName}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                    {conv.lastMessage.substring(0, 50)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(conv.lastMessageTime), "MMM d, h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Conversation View */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {selectedUserId ? (
              <>
                <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <h3 className="font-semibold">
                    {conversations.find((c) => c.userId === selectedUserId)
                      ?.userName || "User"}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
                  {messages.map((msg) => {
                    const isFromAdmin = msg.admin_id !== null;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isFromAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isFromAdmin
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-sm"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">
                            {msg.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isFromAdmin ? "text-pink-100" : "text-gray-500"
                            }`}
                          >
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-800">
                  <div className="flex items-end space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your reply..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || loading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <InboxIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
