"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Trash2, AlertCircle, Heart, Megaphone, Info } from "lucide-react";
import toast from "react-hot-toast";

interface AdminMessage {
  id: string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  admin_id: string | null;
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [user?.id]);

  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching admin messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("admin_messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("recipient_id", user?.id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const { error } = await supabase
        .from("admin_messages")
        .delete()
        .eq("id", messageId)
        .eq("recipient_id", user?.id);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      toast.success("Message deleted");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleMessageClick = (message: AdminMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "welcome":
        return <Heart className="w-5 h-5 text-pink-500" />;
      case "announcement":
        return <Megaphone className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "welcome":
        return "bg-pink-100 text-pink-700 border-pink-300";
      case "announcement":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "warning":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation title="Admin Messages" />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation title="Admin Messages" />

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Important messages and announcements from the admin team
          </p>
          {unreadCount > 0 && (
            <Badge className="mt-2 bg-pink-500">
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-3">
            {messages.length === 0 ? (
              <Card className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
              </Card>
            ) : (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedMessage?.id === message.id
                      ? "ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/20"
                      : ""
                  } ${!message.is_read ? "border-l-4 border-l-pink-500" : ""}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getMessageIcon(message.message_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold truncate ${
                            !message.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {message.subject}
                        </h3>
                        {!message.is_read ? (
                          <MailOpen className="w-4 h-4 text-pink-500 flex-shrink-0" />
                        ) : (
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {message.content.substring(0, 60)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getMessageTypeColor(message.message_type)}`}
                        >
                          {message.message_type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getMessageIcon(selectedMessage.message_type)}</div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedMessage.subject}</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <Badge
                          variant="outline"
                          className={getMessageTypeColor(selectedMessage.message_type)}
                        >
                          {selectedMessage.message_type}
                        </Badge>
                        <span>
                          {new Date(selectedMessage.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedMessage.content}
                  </div>
                </div>

                {selectedMessage.read_at && (
                  <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                    Read on{" "}
                    {new Date(selectedMessage.read_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  Select a message to read
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Choose a message from the list to view its full content
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
