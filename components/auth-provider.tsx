"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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

      if (event === "SIGNED_IN") {
        // Don't redirect if already on admin portal
        const isAdminPortal = window.location.pathname.startsWith("/admin");
        if (!isAdminPortal) {
          toast.success("Welcome back!");
          // Small delay to allow any route changes to complete
          setTimeout(() => {
            if (!window.location.pathname.startsWith("/admin")) {
              window.location.href = "/home";
            }
          }, 100);
        }
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    // If signup successful and we have profile data, create user profile
    if (!error && data.user && metadata) {
      try {
        // Wait a moment for the auth session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            full_name: metadata.full_name,
            date_of_birth: metadata.age
              ? (() => {
                  const birthYear = new Date().getFullYear() - metadata.age;
                  return `${birthYear}-01-01`;
                })()
              : null,
            gender: metadata.gender,
            bio: metadata.bio,
            location_city: metadata.location,
            interests: metadata.interests,
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          console.error("Profile creation failed, but auth signup succeeded");
          console.error("User may need to complete profile manually");
        } else {
          console.log("User profile created successfully");
        }
      } catch (profileError) {
        console.error("Error creating user profile:", profileError);
      }
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
