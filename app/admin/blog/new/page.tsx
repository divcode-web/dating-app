"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    category_id: "",
    status: "draft",
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    checkAdmin();
    fetchCategories();
    fetchTags();
  }, []);

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

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("blog_tags")
      .select("*")
      .order("name");
    setTags(data || []);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, featured_image: publicUrl }));
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!formData.title || !formData.content || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the post
      const { data: post, error: postError } = await supabase
        .from("blog_posts")
        .insert({
          ...formData,
          status,
          author_id: user.id,
          published_at: status === "published" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags
      if (selectedTags.length > 0) {
        const tagRelations = selectedTags.map((tagId) => ({
          post_id: post.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from("blog_post_tags")
          .insert(tagRelations);

        if (tagError) throw tagError;
      }

      toast.success(`Post ${status === "published" ? "published" : "saved as draft"}!`);
      router.push("/admin/blog");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push("/admin/blog")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Post</h1>
          <p className="text-gray-600">Write and publish a new blog post</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preview: /blog/{formData.slug || "your-post-url"}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short summary for post previews..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content here... (HTML supported)"
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports HTML. Use headings, paragraphs, lists, etc.
                </p>
              </div>
            </div>
          </Card>

          {/* SEO Section */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (auto-filled from title)"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description for search engines..."
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Publish</h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleSubmit("published")}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
              <Button
                onClick={() => handleSubmit("draft")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </Card>

          {/* Featured Image */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            {formData.featured_image ? (
              <div className="relative">
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center cursor-pointer hover:border-pink-400">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload Image</span>
                  </>
                )}
              </label>
            )}
          </Card>

          {/* Category */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Category *</h3>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Tags */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedTags.includes(tag.id)
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
