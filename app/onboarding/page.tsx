"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { updateUserProfile, uploadPhoto, getUserProfile, addProfileUpdateListener } from "@/lib/api";
import { Upload, X, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form data - synced with profile edit
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    bio: "",
    interests: [] as string[],
    photos: [] as string[],
    ethnicity: "",
    height: undefined as number | undefined,
    education: "",
    occupation: "",
    smoking: "",
    drinking: "",
    religion: "",
    relationship_type: "",
    looking_for: [] as string[],
    languages: [] as string[],
    children: "",
    location_city: "",
  });

  const [interestInput, setInterestInput] = useState("");

  // Load existing profile data on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) return;

      try {
        const profile = await getUserProfile(user.id);
        console.log("🔄 ONBOARDING DEBUG: Loaded profile data:", profile);

        if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            date_of_birth: profile.date_of_birth || "",
            gender: profile.gender || "",
            bio: profile.bio || "",
            interests: profile.interests || [],
            photos: profile.photos || [],
            ethnicity: profile.ethnicity || "",
            height: profile.height || undefined,
            education: profile.education || "",
            occupation: profile.occupation || "",
            smoking: profile.smoking || "",
            drinking: profile.drinking || "",
            religion: profile.religion || "",
            relationship_type: profile.relationship_type || "",
            looking_for: profile.looking_for || [],
            languages: profile.languages || [],
            children: profile.children || "",
            location_city: profile.location_city || "",
          });

          // Calculate which step to start on based on what's missing
          const startStep = calculateStartStep(profile);
          console.log("🔄 ONBOARDING DEBUG: Starting at step:", startStep);

          // Check if user has completed onboarding before (has extended profile data)
          const hasExtendedProfile = profile.ethnicity || profile.height || profile.education ||
                                   profile.occupation || profile.location_city || profile.smoking ||
                                   profile.drinking || profile.religion || profile.children ||
                                   profile.relationship_type || (profile.looking_for && profile.looking_for.length > 0);

          // If profile has extended data, redirect to home (completed both onboarding and profile-setup)
          if (hasExtendedProfile) {
            console.log("✅ ONBOARDING DEBUG: Profile has extended data, redirecting to home");
            router.push("/home");
            return;
          }

          // If only basic data exists, continue with onboarding
          console.log("🔄 ONBOARDING DEBUG: Profile has basic data only, continuing with onboarding");

          setCurrentStep(startStep);
        } else {
          console.log("⚠️ ONBOARDING DEBUG: No profile found for user:", user.id);
        }
      } catch (error) {
        console.error("❌ ONBOARDING DEBUG: Failed to load profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingProfile();

    // Listen for profile updates from other pages
    const handleProfileUpdate = (updatedUserId: string) => {
      if (updatedUserId === user?.id) {
        console.log("🔄 ONBOARDING DEBUG: Profile updated from another page, reloading...");
        loadExistingProfile();
      }
    };

    const removeListener = addProfileUpdateListener(handleProfileUpdate);

    return () => {
      removeListener();
    };
  }, [user?.id]);

  // Determine which step to start on based on missing data
  const calculateStartStep = (profile: any) => {
    if (!profile.full_name) return 1;
    if (!profile.date_of_birth || !profile.gender) return 2;
    if (!profile.photos || profile.photos.length === 0) return 3;

    // Check if user already completed extended profile fields
    const hasExtendedInfo = profile.ethnicity || profile.height || profile.education ||
                           profile.occupation || profile.location_city;
    if (!hasExtendedInfo) return 4;

    const hasLifestyleInfo = profile.smoking || profile.drinking || profile.religion ||
                            profile.children || profile.relationship_type;
    if (!hasLifestyleInfo) return 5;

    return 6; // Bio and interests (final step)
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1 && !formData.full_name) {
      toast.error("Please enter your name");
      return;
    }
    if (currentStep === 2 && (!formData.date_of_birth || !formData.gender)) {
      toast.error("Please complete all fields");
      return;
    }
    if (currentStep === 3 && formData.photos.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Uploading photo...");

      // Compress image before upload
      const compressedFile = await compressImage(file);
      const photoUrl = await uploadPhoto(compressedFile);

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, photoUrl],
      }));

      toast.dismiss(loadingToast);
      toast.success("Photo uploaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8 // 80% quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && formData.interests.length < 10) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()],
      }));
      setInterestInput("");
    }
  };

  const removeInterest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      console.log("💾 ONBOARDING DEBUG: Completing onboarding with data:", formData);

      await updateUserProfile(user?.id!, formData);

      console.log("✅ ONBOARDING DEBUG: Basic profile saved, redirecting to profile-setup");
      toast.success("Basic profile created! Let's add more details...");

      // Redirect to profile-setup instead of home to complete the full profile
      router.push("/profile-setup");
    } catch (error) {
      console.error("❌ ONBOARDING DEBUG: Failed to save profile:", error);
      toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">What's your name?</h2>
              <p className="text-gray-600">This is how you'll appear to others</p>
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Enter your full name"
                className="text-lg p-6"
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">About you</h2>
              <p className="text-gray-600">Help us show you to the right people</p>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))
                }
                className="text-lg p-6"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => {
                  console.log("Gender selected:", value);
                  setFormData((prev) => ({ ...prev, gender: value }));
                }}
              >
                <SelectTrigger className="w-full text-lg h-14">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Add your photos</h2>
              <p className="text-gray-600">Upload at least 1 photo (max 6)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 6 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  {loading ? (
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Add Photo</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">More about you</h2>
              <p className="text-gray-600">Help others know you better</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ethnicity">Ethnicity (Optional)</Label>
                <Input
                  id="ethnicity"
                  value={formData.ethnicity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ethnicity: e.target.value }))}
                  placeholder="e.g., Asian, Hispanic..."
                />
              </div>
              <div>
                <Label htmlFor="height">Height in cm (Optional)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="e.g., 170"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="education">Education (Optional)</Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData((prev) => ({ ...prev, education: e.target.value }))}
                  placeholder="e.g., Bachelor's Degree"
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation (Optional)</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location_city">City (Optional)</Label>
              <Input
                id="location_city"
                value={formData.location_city}
                onChange={(e) => setFormData((prev) => ({ ...prev, location_city: e.target.value }))}
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Lifestyle</h2>
              <p className="text-gray-600">Share your preferences</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smoking">Smoking (Optional)</Label>
                <Select value={formData.smoking} onValueChange={(value) => setFormData((prev) => ({ ...prev, smoking: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasionally">Occasionally</SelectItem>
                    <SelectItem value="regularly">Regularly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="drinking">Drinking (Optional)</Label>
                <Select value={formData.drinking} onValueChange={(value) => setFormData((prev) => ({ ...prev, drinking: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasionally">Occasionally</SelectItem>
                    <SelectItem value="regularly">Regularly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="religion">Religion (Optional)</Label>
                <Input
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, religion: e.target.value }))}
                  placeholder="e.g., Christian, Muslim..."
                />
              </div>
              <div>
                <Label htmlFor="children">Children (Optional)</Label>
                <Select value={formData.children} onValueChange={(value) => setFormData((prev) => ({ ...prev, children: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="have_children">Have children</SelectItem>
                    <SelectItem value="want_children">Want children</SelectItem>
                    <SelectItem value="dont_want">Don't want</SelectItem>
                    <SelectItem value="open">Open to it</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="relationship_type">Looking for (Optional)</Label>
              <Select value={formData.relationship_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, relationship_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual dating</SelectItem>
                  <SelectItem value="serious">Serious relationship</SelectItem>
                  <SelectItem value="friendship">Friendship</SelectItem>
                  <SelectItem value="not_sure">Not sure yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Your interests</h2>
              <p className="text-gray-600">Add up to 10 interests</p>
            </div>
            <div>
              <Label htmlFor="bio">Tell us about yourself</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full px-4 py-3 border rounded-md h-32"
                placeholder="Share a bit about yourself..."
              />
            </div>
            <div>
              <Label htmlFor="interests">Interests</Label>
              <div className="flex gap-2">
                <Input
                  id="interests"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  placeholder="e.g., Hiking, Music, Travel..."
                  disabled={formData.interests.length >= 10}
                />
                <Button onClick={addInterest} disabled={formData.interests.length >= 10}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.interests.map((interest, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full flex items-center gap-2"
                  >
                    {interest}
                    <button onClick={() => removeInterest(index)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <Progress value={progress} className="mb-4" />
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        {renderStep()}

        <div className="flex gap-4 mt-8">
          {currentStep > 1 && (
            <Button onClick={handleBack} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            {currentStep === TOTAL_STEPS ? "Complete" : "Next"}
            {currentStep < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/home")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>
        </div>
      </Card>
    </div>
  );
}
