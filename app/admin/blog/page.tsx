"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Calendar, Heart,
  FileText, CheckCircle, XCircle, Clock
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string;
  view_count: number;
  like_count: number;
  category: {
    name: string;
    color: string;
  };
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    checkAdmin();
    fetchPosts();
  }, [filter]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(name, color)
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";

    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: newStatus,
          published_at: newStatus === "published" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Post ${newStatus === "published" ? "published" : "unpublished"}`);
      fetchPosts();
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredPosts = posts;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-gray-600 mt-1">Manage your blog posts and content</p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold">{posts.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold">
                {posts.filter(p => p.status === "published").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold">
                {posts.filter(p => p.status === "draft").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + (p.view_count || 0), 0)}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Posts
        </Button>
        <Button
          variant={filter === "published" ? "default" : "outline"}
          onClick={() => setFilter("published")}
        >
          Published
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "outline"}
          onClick={() => setFilter("draft")}
        >
          Drafts
        </Button>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-4">Create your first blog post to get started</p>
          <Link href="/admin/blog/new">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(post.status)}
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: post.category?.color }}
                    >
                      {post.category?.name}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">{post.status}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(post.published_at), "MMM dd, yyyy")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.like_count} likes
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(post.id, post.status)}
                  >
                    {post.status === "published" ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Link href={`/admin/blog/new?id=${post.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
