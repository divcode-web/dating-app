"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the session from the URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        router.push("/auth?error=confirmation_failed");
        return;
      }

      if (session) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        // Redirect based on profile completion
        if (!profile || !profile.full_name || !profile.gender || !profile.date_of_birth) {
          router.push("/onboarding");
        } else {
          router.push("/home");
        }
      } else {
        router.push("/auth");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-2">Email Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Your email has been verified. Redirecting you...
        </p>
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
