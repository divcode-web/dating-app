"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Edit, Shield } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewUserId = searchParams.get("userId");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          throw error || new Error("No user found");
        }
        setUser(user);

        // Determine which profile to load
        const profileIdToLoad = viewUserId || user.id;
        setIsOwnProfile(!viewUserId || viewUserId === user.id);

        await loadProfile(profileIdToLoad);
      } catch (error) {
        console.error("Error:", error);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, viewUserId]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfileData(data);

      // Calculate completion percentage
      const { data: completionData } = await supabase.rpc(
        "calculate_profile_completion",
        { user_uuid: userId }
      );

      setCompletionPercentage(completionData || 0);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  // Viewing someone else's profile
  if (!isOwnProfile && profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-6">
            <div className="flex items-start gap-6">
              {/* Profile Picture with Verified Badge */}
              <div className="relative">
                <img
                  src={profileData.photos?.[0] || "/default-avatar.png"}
                  alt={profileData.full_name}
                  className="w-32 h-32 rounded-full object-cover"
                />
                {profileData.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  {profileData.full_name}
                  {profileData.is_verified && (
                    <span className="text-2xl" title="Verified">
                      ✓
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-2">{profileData.bio}</p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {profileData.location_city && (
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{profileData.location_city}</p>
                    </div>
                  )}
                  {profileData.occupation && (
                    <div>
                      <p className="text-sm text-gray-500">Occupation</p>
                      <p className="font-medium">{profileData.occupation}</p>
                    </div>
                  )}
                  {profileData.education && (
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium">{profileData.education}</p>
                    </div>
                  )}
                  {profileData.height && (
                    <div>
                      <p className="text-sm text-gray-500">Height</p>
                      <p className="font-medium">{profileData.height} cm</p>
                    </div>
                  )}
                </div>

                {profileData.interests && profileData.interests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {profileData.interests.map((interest: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            {profileData.photos && profileData.photos.length > 1 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Photos</p>
                <div className="grid grid-cols-3 gap-3">
                  {profileData.photos.slice(1).map((photo: string, i: number) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Photo ${i + 2}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Own profile view
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              My Profile
              {profileData?.is_verified && (
                <span className="text-2xl" title="Verified">
                  ✓
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-2">
              Complete your profile to start matching with people
            </p>
          </div>

          {/* Profile Completion Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{completionPercentage}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Profile Complete</p>
          </div>
        </div>
      </div>

      {/* Verification Card */}
      {!profileData?.is_verified && profileData?.verification_status !== "pending" && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-full">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Get Verified</h3>
                <p className="text-sm text-gray-600">
                  Verified profiles get 3x more matches and build trust
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/profile/verify")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Now
            </Button>
          </div>
        </Card>
      )}

      {profileData?.verification_status === "pending" && (
        <Card className="p-6 bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-full">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Verification Pending</h3>
              <p className="text-sm text-gray-600">
                We're reviewing your verification video. You'll be notified within 24-48 hours.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <ProfileForm />
      </div>
    </div>
  );
}

