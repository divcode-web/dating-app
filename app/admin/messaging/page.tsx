"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Users as UsersIcon,
  User,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
}

interface UserReply {
  id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  user_profile: {
    full_name: string;
  };
}

export default function AdminMessagingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminId, setAdminId] = useState<string>("");
  const [userReplies, setUserReplies] = useState<UserReply[]>([]);

  const [formData, setFormData] = useState({
    recipient: "all",
    recipientId: "",
    messageType: "announcement",
    subject: "",
    content: "",
  });

  useEffect(() => {
    checkAdmin();
    fetchUsers();
    fetchUserReplies();
  }, []);

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

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .order("full_name");

    setUsers(data || []);
  };

  const fetchUserReplies = async () => {
    // Fetch user replies (where admin_id is null)
    const { data } = await supabase
      .from("admin_messages")
      .select(`
        id,
        recipient_id,
        content,
        created_at,
        user_profile:user_profiles!recipient_id(full_name)
      `)
      .is("admin_id", null)
      .order("created_at", { ascending: false })
      .limit(20);

    setUserReplies(data as any || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // Create message content with subject and body
      const messageContent = formData.subject
        ? `**${formData.subject}**\n\n${formData.content}`
        : formData.content;

      if (formData.recipient === "all") {
        // Use the bulk message function
        console.log("Sending bulk message:", {
          admin_id_param: adminId,
          subject_param: formData.subject,
          content_param: formData.content,
          message_type_param: formData.messageType,
        });

        const { data, error } = await supabase.rpc("send_bulk_message", {
          admin_id_param: adminId,
          subject_param: formData.subject,
          content_param: formData.content,
          message_type_param: formData.messageType,
        });

        if (error) {
          console.error("Bulk message error:", error);
          throw error;
        }

        console.log("Bulk message result:", { data, error });
        toast.success(`Message sent to ${data || 0} users!`);
      } else {
        // Send to specific user
        if (!formData.recipientId) {
          toast.error("Please select a user");
          return;
        }

        const { error } = await supabase.from("admin_messages").insert({
          admin_id: adminId,
          recipient_id: formData.recipientId,
          message_type: formData.messageType,
          subject: formData.subject,
          content: formData.content,
        });

        if (error) {
          console.error("Error inserting admin message:", error);
          throw error;
        }

        console.log("Admin message inserted successfully:", {
          admin_id: adminId,
          recipient_id: formData.recipientId,
          message_type: formData.messageType,
          subject: formData.subject,
        });

        toast.success("Message sent!");
      }

      // Reset form
      setFormData({
        recipient: "all",
        recipientId: "",
        messageType: "announcement",
        subject: "",
        content: "",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Send Message to Users</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send announcements, welcome messages, or notifications
            </p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSendMessage} className="space-y-6">
            {/* Recipient Selection */}
            <div>
              <Label htmlFor="recipient">Send To</Label>
              <Select
                value={formData.recipient}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    recipient: value,
                    recipientId: "",
                  }))
                }
              >
                <SelectTrigger id="recipient" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Specific User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific User Selection */}
            {formData.recipient === "specific" && (
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={formData.recipientId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recipientId: value }))
                  }
                >
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Type */}
            <div>
              <Label htmlFor="messageType">Message Type</Label>
              <Select
                value={formData.messageType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, messageType: value }))
                }
              >
                <SelectTrigger id="messageType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="system">System Message</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Enter message subject..."
                required
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Write your message here..."
                rows={10}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                You can use line breaks and basic formatting
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Message"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* User Replies */}
        {userReplies.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Recent User Replies
            </h3>
            <div className="space-y-3">
              {userReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">
                      {reply.user_profile?.full_name || "Unknown User"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {reply.content}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        recipient: "specific",
                        recipientId: reply.recipient_id,
                        subject: "Re: Your Message",
                        content: "",
                      }));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Reply
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Templates */}
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Quick Templates
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-left justify-start"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  messageType: "welcome",
                  subject: "Welcome to DatingApp!",
                  content: `Welcome to our dating app! 🎉

We're excited to have you here. To get started:

1. Complete your profile with photos and bio
2. Set your preferences in Settings
3. Start swiping to find your perfect match!

If you need any help, feel free to reach out to our support team.

Happy matching! ❤️`,
                }))
              }
            >
              Welcome Message Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-left justify-start"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  messageType: "announcement",
                  subject: "New Features Available!",
                  content: `Hi there! 👋

We've just released some exciting new features:

• Feature 1: [Description]
• Feature 2: [Description]
• Feature 3: [Description]

Check them out and let us know what you think!

Best regards,
The DatingApp Team`,
                }))
              }
            >
              New Features Announcement
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
