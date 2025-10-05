"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heart, Calendar, Eye, Tag, Search, Flame } from "lucide-react";
import { format } from "date-fns";
import GoogleAdSense from "@/components/google-adsense";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  view_count: number;
  like_count: number;
  category: {
    name: string;
    slug: string;
    color: string;
  };
  author: {
    id: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          category:blog_categories(name, slug, color),
          author:admin_users(id)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPost = posts.find(post => post.view_count > 100) || posts[0];
  const regularPosts = posts.filter(post => post.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Flame className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Dating Blog</h1>
            <p className="text-xl opacity-90">
              Expert advice, success stories, and tips for modern dating
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="pl-12 h-14 text-lg bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-pink-500" : ""}
            >
              All Posts
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.slug)}
                className={selectedCategory === category.slug ? "bg-pink-500" : ""}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-pink-500" />
                  Featured Article
                </h2>
                <Link href={`/blog/${featuredPost.slug}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition cursor-pointer">
                    <div className="md:flex">
                      <div className="md:w-1/2">
                        {featuredPost.featured_image && (
                          <img
                            src={featuredPost.featured_image}
                            alt={featuredPost.title}
                            className="w-full h-64 md:h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="md:w-1/2 p-8">
                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: featuredPost.category?.color }}
                          >
                            {featuredPost.category?.name}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{featuredPost.title}</h3>
                        <p className="text-gray-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(featuredPost.published_at), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredPost.view_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {featuredPost.like_count} likes
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            )}

            {/* Google AdSense - After Featured Post */}
            <div className="my-12 flex justify-center">
              <GoogleAdSense
                adSlot="1111111111"
                adFormat="horizontal"
                style={{ display: "block", minHeight: "100px", maxWidth: "970px", width: "100%" }}
              />
            </div>

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post, index) => (
                  <>
                    {/* Insert ad after every 6 posts */}
                    {index > 0 && index % 6 === 0 && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center my-4">
                        <GoogleAdSense
                          adSlot="2222222222"
                          adFormat="fluid"
                          style={{ display: "block", minHeight: "200px", width: "100%", maxWidth: "970px" }}
                        />
                      </div>
                    )}
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition cursor-pointer h-full">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: post.category?.color }}
                          >
                            {post.category?.name}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.published_at), "MMM dd")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.like_count}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                  </>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No posts found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Love?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of singles finding meaningful connections
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-white text-pink-500 hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Read More Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
