import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserProfile, uploadPhoto, getUserProfile } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { UserProfile } from "@/lib/types";
import { Upload, X, Search, Music } from "lucide-react";
import toast from "react-hot-toast";

const SUGGESTED_INTERESTS = [
  "Travel",
  "Coffee",
  "Fitness",
  "Music",
  "Foodie",
  "Movies",
  "Hiking",
  "Photography",
  "Gaming",
  "Reading",
  "Yoga",
  "Cooking",
  "Art",
  "Dancing",
  "Sports",
  "Fashion",
  "Tech",
  "Nature",
];

interface ProfileFormProps {
  onSave?: () => void;
}

export function ProfileForm({ onSave }: ProfileFormProps = {}) {
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
    ethnicity: "",
    height: undefined,
    education: "",
    occupation: "",
    smoking: "",
    drinking: "",
    religion: "",
    relationship_type: "",
    looking_for: [],
    languages: [],
    children: "",
    location_city: "",
  });

  const [interestInput, setInterestInput] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);

  // Spotify search states
  const [spotifySearch, setSpotifySearch] = useState("");
  const [spotifySearchType, setSpotifySearchType] = useState<"artist" | "track">("artist");
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        setLoadingProfile(true);

        const data = await getUserProfile(user.id);
        if (data) {
          console.log("🔄 PROFILE-FORM DEBUG: Loaded profile data:", {
            hasSpotifyArtists: !!data.spotify_top_artists,
            spotifyArtistsLength: data.spotify_top_artists?.length || 0,
            hasSpotifyAnthem: !!data.spotify_anthem,
            spotifyAnthemType: typeof data.spotify_anthem
          });
          setProfile(data);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();

    // Check for Spotify callback success/error
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("spotify_success") === "true") {
        toast.success("Spotify connected successfully! 🎵");
        // Remove query param
        window.history.replaceState({}, "", window.location.pathname);
        // Reload profile to show Spotify data
        loadProfile();
      } else if (params.get("spotify_error")) {
        const error = params.get("spotify_error");
        console.error("Spotify error details:", error);

        // Provide user-friendly error messages
        let userMessage = "Spotify connection failed";
        if (error?.includes("Token exchange failed")) {
          userMessage = "Failed to connect to Spotify. Please try again.";
        } else if (error?.includes("Artists fetch failed")) {
          userMessage =
            "Connected to Spotify but failed to get your music data. Please try reconnecting.";
        } else if (error?.includes("Missing access token")) {
          userMessage = "Spotify authorization failed. Please try again.";
        } else if (error) {
          userMessage = `Spotify connection failed: ${decodeURIComponent(error)}`;
        }

        toast.error(userMessage);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [user?.id]);

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

      toast.dismiss(loadingToast);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error("Photo upload error:", error);

      let errorMessage = "Failed to upload photo";

      if (error.message?.includes("Storage bucket")) {
        errorMessage = "Storage not configured. Please contact support.";
      } else if (error.message?.includes("File size")) {
        errorMessage = error.message;
      } else if (error.message?.includes("format")) {
        errorMessage = error.message;
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setLoading(true);

      // AI Moderation check for bio (Phase 3)
      if (profile.bio && profile.bio.trim()) {
        const moderationResponse = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: profile.bio, type: "bio" }),
        });

        const moderationResult = await moderationResponse.json();

        if (!moderationResult.allowed) {
          toast.error(
            `Bio contains inappropriate content: ${moderationResult.reason || "Please revise your bio"}`
          );
          setLoading(false);
          return;
        }
      }

      await updateUserProfile(user.id, profile);

      // Refresh local profile state to reflect any server-side changes
      const updatedProfile = await getUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      toast.success("Profile updated successfully!");

      // Call onSave callback to refresh parent component
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
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

  const handleSpotifyConnect = () => {
    if (!user?.id) {
      toast.error("Please log in first");
      return;
    }

    // Redirect to Spotify OAuth flow
    window.location.href = `/api/spotify/auth?userId=${user.id}`;
  };

  const searchSpotify = async (query: string, type: "artist" | "track") => {
    if (!query.trim() || !user?.id) {
      setSpotifyResults([]);
      return;
    }

    try {
      setSearchingSpotify(true);
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query)}&type=${type}&userId=${user.id}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSpotifyResults(type === "artist" ? data.artists : data.tracks);
    } catch (error) {
      console.error("Error searching Spotify:", error);
      toast.error("Failed to search Spotify. Make sure you're connected.");
    } finally {
      setSearchingSpotify(false);
    }
  };

  const addSpotifyArtist = (artist: any) => {
    const currentArtists = profile.spotify_top_artists || [];
    if (currentArtists.length >= 5) {
      toast.error("Maximum 5 artists allowed");
      return;
    }

    if (currentArtists.includes(artist.name)) {
      toast.error("Artist already added");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      spotify_top_artists: [...currentArtists, artist.name],
    }));

    setSpotifySearch("");
    setSpotifyResults([]);
    toast.success(`Added ${artist.name}`);
  };

  const removeSpotifyArtist = (index: number) => {
    const currentArtists = [...(profile.spotify_top_artists || [])];
    currentArtists.splice(index, 1);
    setProfile((prev) => ({
      ...prev,
      spotify_top_artists: currentArtists,
    }));
    toast.success("Artist removed");
  };

  const setSpotifyAnthem = (track: any) => {
    const anthem = {
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artists[0]?.name || "Unknown",
      preview_url: track.preview_url,
      album_image: track.album?.images[0]?.url,
    };

    setProfile((prev) => ({
      ...prev,
      spotify_anthem: anthem,
    }));

    setSpotifySearch("");
    setSpotifyResults([]);
    setShowSpotifySearch(false);
    toast.success(`Anthem set to "${track.name}"`);
  };

  const searchGoogleBooks = async (query: string) => {
    if (!query.trim()) {
      setBookResults([]);
      return;
    }

    try {
      setSearchingBooks(true);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
      );

      if (!response.ok) throw new Error("Failed to search books");

      const data = await response.json();
      setBookResults(data.items || []);
    } catch (error) {
      console.error("Error searching books:", error);
      toast.error("Failed to search books");
    } finally {
      setSearchingBooks(false);
    }
  };

  const addBook = (book: any) => {
    const bookInfo = {
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.[0] || "Unknown",
      cover_url: book.volumeInfo.imageLinks?.thumbnail || null,
    };

    const currentBooks = profile.favorite_books || [];
    if (currentBooks.length >= 5) {
      toast.error("Maximum 5 books allowed");
      return;
    }

    if (currentBooks.some((b: any) => b.title === bookInfo.title)) {
      toast.error("Book already added");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      favorite_books: [...currentBooks, bookInfo],
    }));

    setBookSearch("");
    setBookResults([]);
    toast.success("Book added!");
  };

  const removeBook = (index: number) => {
    const currentBooks = [...(profile.favorite_books || [])];
    currentBooks.splice(index, 1);
    setProfile((prev) => ({
      ...prev,
      favorite_books: currentBooks,
    }));
    toast.success("Book removed");
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !profile.interests?.includes(interest.trim())) {
      const newInterests = [...(profile.interests || []), interest.trim()];
      setProfile((prev) => ({
        ...prev,
        interests: newInterests,
      }));
      setInterestInput("");
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = [...(profile.interests || [])];
    newInterests.splice(index, 1);
    setProfile((prev) => ({
      ...prev,
      interests: newInterests,
    }));
  };

  const toggleLookingFor = (value: string) => {
    const current = profile.looking_for || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setProfile((prev) => ({ ...prev, looking_for: updated }));
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setProfile((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="ethnicity">Ethnicity</Label>
            <Input
              id="ethnicity"
              value={profile.ethnicity || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, ethnicity: e.target.value }))
              }
              placeholder="e.g., Asian, Black, White, Hispanic..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={profile.height || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  height: parseInt(e.target.value) || undefined,
                }))
              }
              placeholder="175"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profile.location_city || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  location_city: e.target.value,
                }))
              }
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">About Me</h2>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio || ""}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, bio: e.target.value }))
            }
            className="h-32 resize-none"
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 text-right">
            {(profile.bio || "").length}/500
          </p>
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Photos</h2>
          <span className="text-sm text-gray-500">
            {profile.photos?.length || 0}/4 photos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {profile.photos?.map((photo, index) => (
            <div key={photo} className="relative aspect-square group">
              <img
                src={photo}
                alt={`Profile photo ${index + 1}`}
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                  Main
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(profile.photos?.length || 0) < 4 && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={loading}
              />
              {loading ? (
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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

      {/* Lifestyle */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Lifestyle</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={profile.occupation || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, occupation: e.target.value }))
              }
              placeholder="e.g., Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education</Label>
            <Input
              id="education"
              value={profile.education || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, education: e.target.value }))
              }
              placeholder="e.g., Bachelor's in Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smoking">Smoking</Label>
            <Select
              value={profile.smoking || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, smoking: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="occasionally">Occasionally</SelectItem>
                <SelectItem value="regularly">Regularly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drinking">Drinking</Label>
            <Select
              value={profile.drinking || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, drinking: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="occasionally">Socially</SelectItem>
                <SelectItem value="regularly">Regularly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Input
              id="religion"
              value={profile.religion || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, religion: e.target.value }))
              }
              placeholder="e.g., Christian, Muslim, Atheist..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="children">Children</Label>
            <Select
              value={profile.children || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, children: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="have_children">Have children</SelectItem>
                <SelectItem value="want_children">Want children</SelectItem>
                <SelectItem value="dont_want">Don't want children</SelectItem>
                <SelectItem value="open">Open to children</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Interests & Hobbies</h2>

        <div className="space-y-3">
          <div>
            <Label className="mb-2 block">Suggested Interests</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => addInterest(interest)}
                  disabled={profile.interests?.includes(interest)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    profile.interests?.includes(interest)
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-pink-100"
                  } disabled:opacity-50`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                (e.preventDefault(), addInterest(interestInput))
              }
              placeholder="Add custom interest..."
            />
            <Button type="button" onClick={() => addInterest(interestInput)}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.interests?.map((interest, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full flex items-center gap-2"
              >
                {interest}
                <button type="button" onClick={() => removeInterest(index)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Languages</h2>
        <div className="space-y-2">
          <Label htmlFor="languages">Languages (comma-separated)</Label>
          <Input
            id="languages"
            value={profile.languages?.join(", ") || ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                languages: e.target.value
                  .split(",")
                  .map((i) => i.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="English, Spanish, French..."
          />
        </div>
      </div>

      {/* Relationship Preferences */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          What I'm Looking For
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select
              value={profile.relationship_type || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, relationship_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select what you're looking for" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long-term">Long-term partner</SelectItem>
                <SelectItem value="casual">Short-term fun</SelectItem>
                <SelectItem value="friendship">Friends</SelectItem>
                <SelectItem value="figuring-out">
                  Still figuring it out
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>I'm interested in</Label>
            <div className="grid grid-cols-2 gap-3">
              {["Friendship", "Dating", "Relationship", "Networking"].map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleLookingFor(option.toLowerCase())}
                    className={`p-3 rounded-lg border-2 transition text-left ${
                      profile.looking_for?.includes(option.toLowerCase())
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Profile Fields - Phase 1 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">More About Me</h2>

        {/* Pets */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has_pets"
              checked={profile.has_pets || false}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, has_pets: e.target.checked }))
              }
              className="w-4 h-4 text-pink-600 rounded"
            />
            <Label htmlFor="has_pets" className="cursor-pointer">
              I have pets
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet_preference">Pet Preference</Label>
            <Select
              value={profile.pet_preference || ""}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, pet_preference: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your pet preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog_lover">Dog Lover 🐕</SelectItem>
                <SelectItem value="cat_lover">Cat Lover 🐈</SelectItem>
                <SelectItem value="both">Love Both 🐕🐈</SelectItem>
                <SelectItem value="none">Not a Pet Person</SelectItem>
                <SelectItem value="other">Other Animals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Spotify Integration */}
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-green-600" />
                Music Preferences
              </h3>
              <p className="text-sm text-gray-600">
                {profile.spotify_access_token
                  ? "Add your favorite artists and anthem"
                  : "Connect Spotify first to add music"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSpotifyConnect}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {profile.spotify_access_token ? "Reconnect" : "Connect Spotify"}
            </Button>
          </div>

          {profile.spotify_access_token && (
            <div className="mt-3 space-y-4">
              {/* Top Artists Section */}
              <div className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">
                    TOP ARTISTS (Max 5)
                  </p>
                  {(!profile.spotify_top_artists || profile.spotify_top_artists.length < 5) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSpotifySearchType("artist");
                        setShowSpotifySearch(!showSpotifySearch);
                        setSpotifyResults([]);
                      }}
                      className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      + Add Artist
                    </Button>
                  )}
                </div>

                {/* Artist Search */}
                {showSpotifySearch && spotifySearchType === "artist" && (
                  <div className="mb-3 relative">
                    <Input
                      placeholder="Search for artists..."
                      value={spotifySearch}
                      onChange={(e) => {
                        setSpotifySearch(e.target.value);
                        if (e.target.value.length > 1) {
                          searchSpotify(e.target.value, "artist");
                        } else {
                          setSpotifyResults([]);
                        }
                      }}
                      className="pr-10"
                    />
                    {searchingSpotify && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Artist Results */}
                    {spotifyResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {spotifyResults.map((artist: any) => (
                          <button
                            key={artist.id}
                            type="button"
                            onClick={() => addSpotifyArtist(artist)}
                            className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 text-left border-b last:border-b-0"
                          >
                            {artist.images?.[0]?.url && (
                              <img
                                src={artist.images[0].url}
                                alt={artist.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{artist.name}</p>
                              <p className="text-xs text-gray-500">
                                {artist.followers?.total.toLocaleString()} followers
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Artists */}
                {profile.spotify_top_artists && profile.spotify_top_artists.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.spotify_top_artists.map((artist: string, index: number) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {artist}
                        <button
                          type="button"
                          onClick={() => removeSpotifyArtist(index)}
                          className="hover:text-green-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No artists added yet</p>
                )}
              </div>

              {/* Anthem Section */}
              <div className="p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">
                    YOUR ANTHEM 🎵
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSpotifySearchType("track");
                      setShowSpotifySearch(!showSpotifySearch);
                      setSpotifyResults([]);
                    }}
                    className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {profile.spotify_anthem ? "Change" : "+ Add Anthem"}
                  </Button>
                </div>

                {/* Track Search */}
                {showSpotifySearch && spotifySearchType === "track" && (
                  <div className="mb-3 relative">
                    <Input
                      placeholder="Search for a song..."
                      value={spotifySearch}
                      onChange={(e) => {
                        setSpotifySearch(e.target.value);
                        if (e.target.value.length > 1) {
                          searchSpotify(e.target.value, "track");
                        } else {
                          setSpotifyResults([]);
                        }
                      }}
                      className="pr-10"
                    />
                    {searchingSpotify && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Track Results */}
                    {spotifyResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {spotifyResults.map((track: any) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => setSpotifyAnthem(track)}
                            className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 text-left border-b last:border-b-0"
                          >
                            {track.album?.images?.[0]?.url && (
                              <img
                                src={track.album.images[0].url}
                                alt={track.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{track.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {track.artists.map((a: any) => a.name).join(", ")}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Anthem */}
                {profile.spotify_anthem && typeof profile.spotify_anthem === 'object' ? (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    {profile.spotify_anthem.album_image && (
                      <img
                        src={profile.spotify_anthem.album_image}
                        alt="Album"
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile.spotify_anthem.track_name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {profile.spotify_anthem.artist_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No anthem set yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Favorite Books - Google Books Integration */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              📚 Favorite Books (Max 5)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Search and add your favorite books
            </p>

            {/* Current Books */}
            {profile.favorite_books && profile.favorite_books.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {profile.favorite_books.map((book: any, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📖
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBook(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs mt-1 text-center truncate">
                      {book.title}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Book Search */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search for books... (e.g., 'Atomic Habits')"
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      if (e.target.value.length > 2) {
                        searchGoogleBooks(e.target.value);
                      } else {
                        setBookResults([]);
                      }
                    }}
                    className="bg-white pr-10"
                  />
                  {searchingBooks && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Book Results Dropdown */}
              {bookResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {bookResults.map((book: any) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => addBook(book)}
                      className="w-full p-3 hover:bg-gray-50 flex items-start gap-3 text-left border-b last:border-b-0"
                    >
                      {book.volumeInfo.imageLinks?.thumbnail ? (
                        <img
                          src={book.volumeInfo.imageLinks.thumbnail}
                          alt={book.volumeInfo.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
                          📖
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {book.volumeInfo.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {book.volumeInfo.authors?.[0] || "Unknown Author"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
      >
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
