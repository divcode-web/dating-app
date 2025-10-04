"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, Video, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be less than 50MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }

      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleSubmitVerification = async () => {
    if (!videoFile || !user) return;

    setUploading(true);

    try {
      // Upload video to storage
      const fileName = `verification-${user.id}-${Date.now()}.${videoFile.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          verification_video_url: publicUrl,
          verification_status: "pending",
          verification_submitted_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Verification submitted! We'll review it within 24-48 hours.");
      setVerificationStatus("pending");

      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Profile</h1>
            <p className="text-gray-600">
              Get the verified badge to increase trust and get more matches!
            </p>
          </div>

          {verificationStatus === "pending" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Verification Pending
              </h3>
              <p className="text-yellow-700">
                Your verification video is under review. We'll notify you within 24-48 hours.
              </p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Verification Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Record a short video (5-10 seconds) of yourself</li>
                  <li>Hold your ID or make a specific gesture (peace sign)</li>
                  <li>Say "I'm verifying my profile for [Your Name]"</li>
                  <li>Make sure your face is clearly visible</li>
                  <li>Video should be well-lit and stable</li>
                  <li>Maximum file size: 50MB</li>
                </ol>
              </div>

              {/* Video Upload */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!videoPreview ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-purple-500 transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload verification video</p>
                    <p className="text-sm text-gray-500 mt-1">MP4, MOV, or WebM (max 50MB)</p>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full rounded-lg"
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }}
                        className="flex-1"
                      >
                        Remove Video
                      </Button>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="flex-1"
                      >
                        Change Video
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Benefits of Verification</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Stand out with a verified badge ✓ on your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Increase trust and get 3x more matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Show you're a real person, not a fake profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Contribute to a safer dating community</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile")}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={handleSubmitVerification}
                  disabled={!videoFile || uploading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting, you agree that we may use AI to verify your identity.
                Your video will be deleted after verification.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
