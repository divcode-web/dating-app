"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Calendar, Eye, Tag, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import GoogleAdSense from "@/components/google-adsense";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  view_count: number;
  like_count: number;
  meta_title: string;
  meta_description: string;
  category: {
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    name: string;
    slug: string;
  }>;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(name, slug, color)
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (postError) throw postError;

      // Fetch tags for this post
      const { data: tagsData } = await supabase
        .from("blog_post_tags")
        .select(`
          tag:blog_tags(name, slug)
        `)
        .eq("post_id", postData.id);

      const post = {
        ...postData,
        tags: tagsData?.map(t => t.tag) || [],
      };

      setPost(post);

      // Increment view count
      await supabase.rpc("increment_post_views", { post_uuid: post.id });

      // Fetch related posts
      if (post.category) {
        const { data: related } = await supabase
          .from("blog_posts")
          .select(`
            *,
            category:blog_categories(name, slug, color)
          `)
          .eq("status", "published")
          .eq("category_id", postData.category_id)
          .neq("id", post.id)
          .limit(3);

        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Post not found");
      router.push("/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }

      const { data, error } = await supabase.rpc("toggle_post_like", {
        post_uuid: post.id,
        user_uuid: user.id,
      });

      if (error) throw error;

      setHasLiked(data);
      setPost(prev => prev ? {
        ...prev,
        like_count: prev.like_count + (data ? 1 : -1)
      } : null);

      toast.success(data ? "Post liked!" : "Like removed");
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/blog")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="w-full h-96 relative">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Article Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 -mt-32 relative z-10 bg-white/95 backdrop-blur">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: post.category?.color }}
              >
                {post.category?.name}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-8 border-b">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), "MMMM dd, yyyy")}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {post.view_count} views
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {post.like_count} likes
              </span>
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Google AdSense - In-Article Ad */}
            <div className="my-8 flex justify-center">
              <GoogleAdSense
                adSlot="1234567890"
                adFormat="fluid"
                style={{ display: "block", textAlign: "center", minHeight: "250px" }}
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/blog?tag=${tag.slug}`}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t">
              <Button
                onClick={handleLike}
                variant={hasLiked ? "default" : "outline"}
                className={hasLiked ? "bg-pink-500" : ""}
              >
                <Heart className={`w-4 h-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                {hasLiked ? "Liked" : "Like"} ({post.like_count})
              </Button>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>

          {/* Google AdSense - Display Ad */}
          <div className="my-8 flex justify-center">
            <GoogleAdSense
              adSlot="0987654321"
              adFormat="horizontal"
              style={{ display: "block", minHeight: "100px", maxWidth: "970px", width: "100%" }}
            />
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition cursor-pointer h-full">
                      {relatedPost.featured_image && (
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold text-white inline-block mb-2"
                          style={{ backgroundColor: relatedPost.category?.color }}
                        >
                          {relatedPost.category?.name}
                        </span>
                        <h3 className="font-bold mb-2 line-clamp-2">{relatedPost.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{relatedPost.excerpt}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Love?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of singles finding meaningful connections
          </p>
          <Link href="/">
            <Button size="lg" className="bg-white text-pink-500 hover:bg-gray-100">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
