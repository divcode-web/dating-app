"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Menu,
  X,
  Sun,
  Moon,
  Heart,
  MessageCircle,
  Settings,
  User,
  Home,
  Users,
  Star,
  BookOpen,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { useDarkMode } from "@/lib/use-dark-mode";
import { supabase } from "@/lib/supabase";

interface NavigationProps {
  showBackButton?: boolean;
  title?: string;
}

export function Navigation({ showBackButton = false, title }: NavigationProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode(user?.id);
  const router = useRouter();
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newMatches, setNewMatches] = useState(0);

  // Load counts with polling (checks every 5 seconds)
  useEffect(() => {
    if (!user?.id) return;

    const loadCounts = async () => {
      // Get unread messages count
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (matches) {
        const matchIds = matches.map((m: any) => m.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("match_id", matchIds)
          .neq("sender_id", user.id)
          .is("read_at", null);

        setUnreadMessages(count || 0);
      }

      // Get new matches count (matches user hasn't viewed yet)
      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .eq("viewed", false);

      setNewMatches(matchCount || 0);
    };

    loadCounts();

    // Poll for updates every 5 seconds
    const countsInterval = setInterval(() => {
      loadCounts();
    }, 5000);

    return () => {
      clearInterval(countsInterval);
    };
  }, [user?.id]);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Don't show navigation if user is not logged in
  if (!user) {
    return null;
  }

  const handleToggleDarkMode = () => {
    toggleDarkMode(undefined, user?.id); // Pass user ID to save to DB
  };

  const handleBack = () => {
    router.back();
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "Home", path: "/" }];

    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const fullPath = "/" + paths.slice(0, index + 1).join("/");
        const name = path.charAt(0).toUpperCase() + path.slice(1);
        breadcrumbs.push({ name, path: fullPath });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left side - Back button and breadcrumbs */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center">
                  {index > 0 && <ChevronLeft className="h-3 w-3 mx-1" />}
                  <Link
                    href={crumb.path}
                    className={`hover:text-foreground transition-colors ${
                      index === breadcrumbs.length - 1
                        ? "text-foreground font-medium"
                        : ""
                    }`}
                  >
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>

            {/* Title for mobile */}
            {title && (
              <div className="md:hidden">
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleDarkMode}
              className="p-2 hover:bg-accent"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-accent"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/home" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/swipe" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Swipe</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/matches" className="flex items-center space-x-2 relative">
                  <Users className="h-4 w-4" />
                  <span>Matches</span>
                  {newMatches > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {newMatches > 99 ? '99+' : newMatches}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/likes" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Likes</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/messages" className="flex items-center space-x-2 relative">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/blog" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Blog</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu - slides from right */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop - White opaque */}
            <div
              className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu panel */}
            <div
              className={`absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              {/* Close button */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Menu items */}
              <div className="px-4 py-2 space-y-1 pb-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/home" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start relative"
                  onClick={() => {
                    // Could open notifications here
                    setIsMenuOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadMessages > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/swipe" className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Swipe</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/matches" className="flex items-center space-x-2 relative">
                    <Users className="h-4 w-4" />
                    <span>Matches</span>
                    {newMatches > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {newMatches > 99 ? '99+' : newMatches}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/likes" className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Likes</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link
                    href="/messages"
                    className="flex items-center space-x-2 relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/profile" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/blog" className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Blog</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

