"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn(
        "Supabase client not initialized. Please configure your environment variables."
      );
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase!.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Skip all auth-provider logic for admin portal
      const isAdminPortal = window.location.pathname.startsWith("/admin");

      if (event === "SIGNED_IN" && session?.user && !isAdminPortal) {
        // Check if user is blocked by admin (only if columns exist)
        const { data: profile, error: profileError } = await supabase!
          .from("user_profiles")
          .select("blocked_by_admin, blocked_until, block_reason")
          .eq("id", session.user.id)
          .single();

        // Only check block status if columns exist (no error)
        if (!profileError && profile?.blocked_by_admin) {
          // Check if block is still active
          const isBlockActive = !profile.blocked_until || new Date(profile.blocked_until) > new Date();

          if (isBlockActive) {
            await supabase!.auth.signOut();
            toast.error(profile.block_reason || "Your account has been blocked. Please contact support.");
            window.location.href = "/";
            return;
          }
        }

        toast.success("Welcome back!");
        // Small delay to let the login page handle its own redirect first
        setTimeout(() => {
          // Only redirect if still on auth page
          if (window.location.pathname === "/auth") {
            router.push("/home");
          }
        }, 100);
      } else if (event === "SIGNED_OUT") {
        // Redirect to admin login if signing out from admin
        const isAdminPortal = window.location.pathname.startsWith("/admin");
        toast.success("Signed out successfully");
        window.location.href = isAdminPortal ? "/admin/login" : "/";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    // Check if email can be used for signup
    try {
      const { data: checkResult, error: checkError } = await supabase.rpc('can_signup_with_email', {
        email_to_check: email
      });

      if (checkError) {
        console.error('Signup check error:', checkError);
        // Continue with signup if check fails (fallback)
      } else if (checkResult && !checkResult.can_signup) {
        return {
          error: {
            message: checkResult.message || 'Cannot signup with this email',
            status: 400
          } as AuthError
        };
      }
    } catch (err) {
      console.error('Error checking signup eligibility:', err);
      // Continue with signup if check fails
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    // Log signup attempt
    if (supabase) {
      const { error: logError } = await supabase.rpc('log_signup_attempt', {
        email_param: email,
        success_param: !error,
        reason_param: error?.message || null
      });
      if (logError) console.error('Error logging signup:', logError);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) {
      toast.error("Supabase not configured");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
      console.error("Error signing out:", error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
