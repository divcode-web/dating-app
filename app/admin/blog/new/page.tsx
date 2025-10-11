"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Upload, X, Sparkles, Loader2 } from "lucide-react";
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
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");

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
    if (editId) {
      fetchPost();
    }
  }, [editId]);

  const fetchPost = async () => {
    if (!editId) return;

    try {
      const { data: post, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          tags:blog_post_tags(tag_id)
        `)
        .eq("id", editId)
        .single();

      if (error) throw error;

      if (post) {
        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          content: post.content,
          featured_image: post.featured_image || "",
          category_id: post.category_id,
          status: post.status,
          meta_title: post.meta_title || "",
          meta_description: post.meta_description || "",
        });
        setSelectedTags(post.tags?.map((t: any) => t.tag_id) || []);
      }
    } catch (error) {
      // console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    }
  };

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

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    try {
      setGeneratingAI(true);

      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          length: aiLength,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate blog post");
      }

      // Fill form with AI-generated content
      setFormData((prev) => ({
        ...prev,
        title: data.blog.title,
        slug: generateSlug(data.blog.title),
        excerpt: data.blog.excerpt,
        content: data.blog.content,
        featured_image: data.blog.featured_image || prev.featured_image,
        meta_title: data.blog.title,
        meta_description: data.blog.meta_description,
      }));

      // Auto-select matching tags if they exist
      if (data.blog.tags && data.blog.tags.length > 0) {
        const matchingTags = tags
          .filter((tag) =>
            data.blog.tags.some((aiTag: string) =>
              tag.name.toLowerCase().includes(aiTag.toLowerCase())
            )
          )
          .map((tag) => tag.id);
        setSelectedTags(matchingTags);
      }

      setShowAIDialog(false);
      toast.success("Blog post generated! Review and edit as needed.");
    } catch (error: any) {
      // console.error("AI generation error:", error);
      toast.error(error.message || "Failed to generate blog post");
    } finally {
      setGeneratingAI(false);
    }
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

      if (editId) {
        // Update existing post
        const { error: postError } = await supabase
          .from("blog_posts")
          .update({
            ...formData,
            status,
            published_at: status === "published" && !formData.status ? new Date().toISOString() : undefined,
          })
          .eq("id", editId);

        if (postError) throw postError;

        // Delete old tags and insert new ones
        await supabase.from("blog_post_tags").delete().eq("post_id", editId);

        if (selectedTags.length > 0) {
          const tagRelations = selectedTags.map((tagId) => ({
            post_id: editId,
            tag_id: tagId,
          }));

          const { error: tagError } = await supabase
            .from("blog_post_tags")
            .insert(tagRelations);

          if (tagError) throw tagError;
        }

        toast.success("Post updated successfully!");
      } else {
        // Create new post
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
      }

      router.push("/admin/blog");
    } catch (error: any) {
      // console.error("Error saving post:", error);
      toast.error(error.message || "Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{editId ? "Edit Post" : "Create New Post"}</h1>
            <p className="text-gray-600">Write and publish a new blog post</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAIDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
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
                  <br />
                  <span className="text-amber-600 font-medium">Note:</span> When using AI generation, the content is automatically filled. Don't paste the JSON response manually.
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
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
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
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Generation Dialog */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-6 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
                Generate Blog with AI
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIDialog(false)}
                disabled={generatingAI}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-topic">Topic *</Label>
                <Input
                  id="ai-topic"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., First date tips, Online dating safety, etc."
                  disabled={generatingAI}
                />
              </div>

              <div>
                <Label htmlFor="ai-tone">Tone</Label>
                <Select
                  value={aiTone}
                  onValueChange={setAiTone}
                >
                  <SelectTrigger id="ai-tone" disabled={generatingAI}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ai-length">Length</Label>
                <Select
                  value={aiLength}
                  onValueChange={setAiLength}
                >
                  <SelectTrigger id="ai-length" disabled={generatingAI}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (300-500 words)</SelectItem>
                    <SelectItem value="medium">Medium (600-800 words)</SelectItem>
                    <SelectItem value="long">Long (1000-1500 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={generateWithAI}
                  disabled={generatingAI || !aiTopic.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIDialog(false)}
                  disabled={generatingAI}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                AI will generate a complete blog post based on your topic. You can edit the
                generated content before publishing.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
