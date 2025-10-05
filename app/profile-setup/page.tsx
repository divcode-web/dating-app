"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile, uploadPhoto } from "@/lib/api";
import { Upload, X, ArrowLeft, ArrowRight, Check, Flame, Camera, User, Heart, MapPin, Briefcase, GraduationCap, Music } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

const TOTAL_STEPS = 7;

const SUGGESTED_INTERESTS = [
  "Travel", "Coffee", "Fitness", "Music", "Foodie", "Movies",
  "Hiking", "Photography", "Gaming", "Reading", "Yoga", "Cooking",
  "Art", "Dancing", "Sports", "Fashion", "Tech", "Nature"
];

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    bio: "",
    interests: [] as string[],
    photos: [] as string[],
    occupation: "",
    education: "",
    location_city: "",
    height: "",
    relationship_type: "",
    looking_for: [] as string[],
  });

  const [interestInput, setInterestInput] = useState("");
  const profileCompletion = calculateProgress();

  function calculateProgress() {
    let score = 0;
    const weights = {
      photos: 30, // Most important
      bio: 15,
      interests: 10,
      basic: 20, // name, age, gender
      lifestyle: 15, // occupation, education
      preferences: 10, // relationship type, looking for
    };

    // Photos (up to 30%)
    if (formData.photos.length > 0) score += 10;
    if (formData.photos.length >= 3) score += 10;
    if (formData.photos.length >= 5) score += 10;

    // Bio (15%)
    if (formData.bio && formData.bio.length >= 50) score += 15;

    // Interests (10%)
    if (formData.interests.length >= 5) score += 10;

    // Basic info (20%)
    if (formData.full_name) score += 7;
    if (formData.date_of_birth) score += 7;
    if (formData.gender) score += 6;

    // Lifestyle (15%)
    if (formData.occupation) score += 8;
    if (formData.education) score += 7;

    // Preferences (10%)
    if (formData.relationship_type) score += 5;
    if (formData.looking_for.length > 0) score += 5;

    return Math.min(100, score);
  }

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
            0.8
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

  const addInterest = (interest: string) => {
    if (interest.trim() && formData.interests.length < 10 && !formData.interests.includes(interest.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, interest.trim()],
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

  const toggleLookingFor = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(value)
        ? prev.looking_for.filter(v => v !== value)
        : [...prev.looking_for, value],
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await updateUserProfile(user?.id!, formData);
      toast.success("Profile created successfully!");
      router.push("/home");
    } catch (error) {
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
              <Flame className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Let's Get Started!</h2>
              <p className="text-gray-600">First impressions matter — let's make yours count</p>
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
              <User className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">About You</h2>
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
                  setFormData((prev) => ({ ...prev, gender: value }));
                }}
              >
                <SelectTrigger className="w-full text-lg h-14">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="height">Height (cm) - Optional</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, height: e.target.value }))
                }
                placeholder="175"
                className="text-lg p-6"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Camera className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Add Your Photos</h2>
              <p className="text-gray-600">Photos are the most important part! Add up to 4 quality pics</p>
              <div className="mt-4 p-4 bg-pink-50 rounded-lg text-left text-sm">
                <p className="font-semibold text-pink-700 mb-2">📸 Pro Tips:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>✓ Main photo: clear headshot, smiling</li>
                  <li>✓ Full-body shot showing confidence</li>
                  <li>✓ Lifestyle: doing something you enjoy</li>
                  <li>✗ No sunglasses in every pic</li>
                  <li>✗ Avoid overly edited/mirror selfies</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      Main
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 4 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition">
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
            <p className="text-center text-sm text-gray-500">{formData.photos.length}/4 photos</p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Your Bio</h2>
              <p className="text-gray-600">Keep it short, fun, and authentic (3-4 lines max)</p>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg text-left text-sm">
                <p className="font-semibold text-purple-700 mb-2">✍️ Good Bio Structure:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>1. Hook about your personality/interests</li>
                  <li>2. What you like doing</li>
                  <li>3. What you're looking for (light tone)</li>
                  <li>4. Optional emoji for vibe ✨</li>
                </ul>
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Tell us about yourself</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full px-4 py-3 border rounded-md h-40 resize-none"
                placeholder="🌍 Always planning my next trip | 🐶 Dog dad | 🍣 Sushi > Pizza&#10;Looking for someone who can match my sarcasm and Spotify energy."
                maxLength={300}
              />
              <p className="text-right text-sm text-gray-500 mt-1">{formData.bio.length}/300</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Music className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Your Passions</h2>
              <p className="text-gray-600">Pick 5-10 interests that describe you</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Suggested Interests</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => addInterest(interest)}
                      disabled={formData.interests.includes(interest) || formData.interests.length >= 10}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        formData.interests.includes(interest)
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-pink-100"
                      } disabled:opacity-50`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="custom-interest">Or add your own</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-interest"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest(interestInput))}
                    placeholder="Type and press Enter..."
                    disabled={formData.interests.length >= 10}
                  />
                  <Button onClick={() => addInterest(interestInput)} disabled={formData.interests.length >= 10}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Your Interests ({formData.interests.length}/10)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Briefcase className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Lifestyle</h2>
              <p className="text-gray-600">Add credibility and conversation starters</p>
            </div>
            <div>
              <Label htmlFor="occupation">Job Title (Optional)</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occupation: e.target.value }))
                }
                placeholder="e.g., Marketing at Spotify, Engineer, Creator"
                className="text-lg p-6"
              />
            </div>
            <div>
              <Label htmlFor="education">Education (Optional)</Label>
              <Input
                id="education"
                value={formData.education}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, education: e.target.value }))
                }
                placeholder="e.g., UCLA, Computer Science"
                className="text-lg p-6"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location_city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location_city: e.target.value }))
                  }
                  placeholder="City, Country"
                  className="text-lg p-6 pl-12"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">What Are You Looking For?</h2>
              <p className="text-gray-600">Be honest — it helps match expectations</p>
            </div>
            <div>
              <Label>Relationship Type</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, relationship_type: value }))
                }
              >
                <SelectTrigger className="w-full text-lg h-14">
                  <SelectValue placeholder="Select what you're looking for" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long-term">Long-term partner</SelectItem>
                  <SelectItem value="casual">Short-term fun</SelectItem>
                  <SelectItem value="friendship">Friends</SelectItem>
                  <SelectItem value="figuring-out">Still figuring it out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>I'm interested in (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["Friendship", "Dating", "Relationship", "Networking"].map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleLookingFor(option.toLowerCase())}
                    className={`p-4 rounded-xl border-2 transition ${
                      formData.looking_for.includes(option.toLowerCase())
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.looking_for.includes(option.toLowerCase())
                          ? "border-pink-500 bg-pink-500"
                          : "border-gray-300"
                      }`}>
                        {formData.looking_for.includes(option.toLowerCase()) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600">Profile Completion</h3>
              <p className="text-2xl font-bold text-pink-600">{profileCompletion}%</p>
            </div>
            <Flame className="w-8 h-8 text-pink-500" />
          </div>
          <Progress value={profileCompletion} className="mb-2 h-3" />
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
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <>
                {currentStep === TOTAL_STEPS ? "Complete Profile" : "Next"}
                {currentStep < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-2" />}
              </>
            )}
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
