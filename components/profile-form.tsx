import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile, uploadPhoto, getUserProfile } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { UserProfile } from "@/lib/types";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

export function ProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    full_name: "",
    date_of_birth: "",
    gender: "",
    bio: "",
    interests: [],
    photos: [],
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        setLoadingProfile(true);
        const data = await getUserProfile(user.id);
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    // Validate file before upload
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    try {
      setLoading(true);

      // Show loading toast
      const loadingToast = toast.loading("Uploading photo...");

      const photoUrl = await uploadPhoto(file);

      setProfile((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), photoUrl],
      }));

      if (user?.id) {
        await updateUserProfile(user.id, {
          photos: [...(profile.photos || []), photoUrl],
        });
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error('Photo upload error:', error);

      // Provide specific error messages
      let errorMessage = "Failed to upload photo";

      if (error.message?.includes('Storage bucket')) {
        errorMessage = "Storage not configured. Please contact support.";
      } else if (error.message?.includes('File size')) {
        errorMessage = error.message;
      } else if (error.message?.includes('format')) {
        errorMessage = error.message;
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setLoading(true);
      await updateUserProfile(user.id, profile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (index: number) => {
    if (!user?.id) return;

    try {
      const newPhotos = [...(profile.photos || [])];
      newPhotos.splice(index, 1);

      setProfile((prev) => ({
        ...prev,
        photos: newPhotos,
      }));

      await updateUserProfile(user.id, { photos: newPhotos });
      toast.success("Photo removed");
    } catch (error) {
      toast.error("Failed to remove photo");
      console.error(error);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={profile.full_name || ""}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, full_name: e.target.value }))
          }
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={profile.date_of_birth || ""}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, date_of_birth: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          value={profile.gender || ""}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, gender: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-md"
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          value={profile.bio || ""}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, bio: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-md h-24"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Photos</Label>
          <span className="text-sm text-gray-500">
            {(profile.photos?.length || 0)}/6 photos
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {profile.photos?.map((photo, index) => (
            <div key={photo} className="relative aspect-square group">
              <img
                src={photo}
                alt={`Profile photo ${index + 1}`}
                className="w-full h-full object-cover rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-xl" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Photo {index + 1}
              </div>
            </div>
          ))}

          {(profile.photos?.length || 0) < 6 && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={loading}
              />
              <div className="flex flex-col items-center space-y-2">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                )}
                <span className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors duration-200">
                  {loading ? 'Uploading...' : 'Add Photo'}
                </span>
              </div>
            </label>
          )}
        </div>

        {(profile.photos?.length || 0) >= 6 && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            You've reached the maximum of 6 photos. Remove some photos to add new ones.
          </p>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Upload high-quality photos (JPEG, PNG, or WebP)</p>
          <p>• Maximum file size: 5MB per photo</p>
          <p>• First photo will be your profile picture</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interests">Interests (comma-separated)</Label>
        <Input
          id="interests"
          value={profile.interests?.join(", ") || ""}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              interests: e.target.value.split(",").map((i) => i.trim()),
            }))
          }
          placeholder="Travel, Music, Sports..."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
