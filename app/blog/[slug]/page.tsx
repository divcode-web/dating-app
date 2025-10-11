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

// Function to sanitize and parse content
function sanitizeContent(content: string): string {
  if (!content) return '';

  let parsedContent = content;

  // Check if content looks like a full JSON blog post object
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('```json') && trimmed.includes('```'))) {
    try {
      // Remove markdown code blocks if present
      let jsonContent = trimmed;
      if (trimmed.startsWith('```json') || trimmed.startsWith('```')) {
        jsonContent = trimmed
          .replace(/^```json\s*\n?/i, '')
          .replace(/^```\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();
      }

      // Try to parse as JSON
      const parsed = JSON.parse(jsonContent);

      // If it has a content field, use that
      if (parsed.content) {
        parsedContent = parsed.content;
      }
    } catch (e) {
      // If parsing fails, check if it's double-stringified
      try {
        if (content.startsWith('"') && content.endsWith('"')) {
          parsedContent = JSON.parse(content);
        }
      } catch (e2) {
        // Use content as-is
      }
    }
  }

  // Unescape HTML entities
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = parsedContent;
    parsedContent = textarea.value;
  }

  return parsedContent;
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
      const { data: tagsData, error: tagsError } = await supabase
        .from("blog_post_tags")
        .select(`
          tag:blog_tags(name, slug)
        `)
        .eq("post_id", postData.id);

      if (tagsError) {
        console.error("Error fetching tags:", tagsError);
      }

      const post = {
        ...postData,
        tags: tagsData?.map(t => t.tag).filter(Boolean) || [],
      };

      console.log("Post data loaded:", {
        id: post.id,
        title: post.title,
        hasCategory: !!post.category,
        categoryData: post.category,
        tagsCount: post.tags.length,
        tagsData: post.tags
      });

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
      {/* Back Arrow */}
      <div className="container mx-auto px-4 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>
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
          <Card className="p-6 md:p-10 lg:p-14 -mt-32 relative z-10 bg-white/95 backdrop-blur shadow-2xl">
            {/* Category Badge */}
            {post.category && post.category.name && (
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-md"
                  style={{ backgroundColor: post.category.color || '#6b7280' }}
                >
                  {post.category.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-gray-900 dark:text-white">
              {post.title}
            </h1>

            {/* Excerpt/Summary */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-light">
                {post.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 text-sm mb-10 pb-6 border-b-2 border-gray-100 dark:border-gray-800">
              <span className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-pink-500" />
                {format(new Date(post.published_at), "MMMM dd, yyyy")}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                {post.view_count.toLocaleString()} views
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                {post.like_count.toLocaleString()} likes
              </span>
            </div>

            {/* Content - Maximum readability like Medium */}
            <article
              className="prose prose-xl max-w-none mb-16
                prose-headings:scroll-mt-24
                prose-headings:font-bold prose-headings:tracking-tight

                prose-h1:text-4xl prose-h1:mt-16 prose-h1:mb-10 prose-h1:leading-tight
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-4
                prose-h3:text-2xl prose-h3:mt-14 prose-h3:mb-6 prose-h3:text-gray-800 dark:prose-h3:text-gray-200
                prose-h4:text-xl prose-h4:mt-12 prose-h4:mb-5 prose-h4:text-gray-700 dark:prose-h4:text-gray-300

                prose-p:text-gray-700 dark:prose-p:text-gray-300
                prose-p:text-[1.25rem] prose-p:leading-[2]
                prose-p:mb-10 prose-p:mt-0

                prose-ul:my-10 prose-ul:space-y-5 prose-ul:pl-8
                prose-ol:my-10 prose-ol:space-y-5 prose-ol:pl-8
                prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:text-[1.125rem] prose-li:leading-[1.9] prose-li:marker:text-pink-500 prose-li:pl-3

                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-em:italic

                prose-a:text-pink-600 dark:prose-a:text-pink-400 prose-a:no-underline prose-a:font-medium prose-a:border-b-2 prose-a:border-pink-300 dark:prose-a:border-pink-700 hover:prose-a:text-purple-600 hover:prose-a:border-purple-400 prose-a:transition-colors

                prose-blockquote:border-l-4 prose-blockquote:border-pink-500 prose-blockquote:bg-gradient-to-r prose-blockquote:from-pink-50/50 prose-blockquote:to-transparent dark:prose-blockquote:from-pink-900/10 dark:prose-blockquote:to-transparent prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:my-12 prose-blockquote:text-[1.125rem] prose-blockquote:leading-[1.8]

                prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-900/20 prose-code:px-2.5 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 prose-pre:rounded-2xl prose-pre:shadow-2xl prose-pre:my-12 prose-pre:p-8 prose-pre:border prose-pre:border-gray-700

                prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-12 prose-img:w-full
                prose-hr:border-gray-200 dark:prose-hr:border-gray-800 prose-hr:my-16

                first:prose-p:text-[1.375rem] first:prose-p:leading-[1.9] first:prose-p:text-gray-600 dark:first:prose-p:text-gray-400 first:prose-p:font-light first:prose-p:mb-12"
              dangerouslySetInnerHTML={{ __html: sanitizeContent(post.content) }}
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
              <div className="pt-8 border-t-2 border-gray-100 dark:border-gray-800 mb-8">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Topics
                </h3>
                <div className="flex flex-wrap gap-3">
                  {post.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/blog?tag=${tag.slug}`}
                      className="group px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30 border border-pink-200 dark:border-pink-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105"
                    >
                      <Tag className="w-3.5 h-3.5 text-pink-500 group-hover:text-purple-500 transition-colors" />
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t-2 border-gray-100 dark:border-gray-800">
              <Button
                onClick={handleLike}
                variant={hasLiked ? "default" : "outline"}
                size="lg"
                className={hasLiked
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                  : "border-2 border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-gray-700 dark:text-gray-300"}
              >
                <Heart className={`w-5 h-5 mr-2 ${hasLiked ? "fill-current animate-pulse" : ""}`} />
                {hasLiked ? "Liked" : "Like this post"}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  hasLiked
                    ? "bg-white/30 text-white"
                    : "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300"
                }`}>
                  {post.like_count.toLocaleString()}
                </span>
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Share2 className="w-5 h-5 mr-2" />
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
