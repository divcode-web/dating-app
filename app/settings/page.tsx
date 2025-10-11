"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/components/geolocation-provider";
import { MapPin, CheckCircle2, Download, Trash2, AlertTriangle, RefreshCw, Crown, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getLocationAccuracy } from "@/lib/matching-score";
import { useDarkMode } from "@/lib/use-dark-mode";

export default function SettingsPage() {
  const router = useRouter();
  const { location, requestLocation, locationPermission } = useGeolocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notifyOnMatch: true,
    notifyOnLike: true,
    notifyOnMessage: true,
    profileVisibility: true,
    distanceRange: 50,
    ageRange: [18, 50],
    useCustomLocation: false,
    customLocationCity: "",
    customLocationState: "",
    customLocationCountry: "",
    showMeGender: ["Male", "Female", "Non-binary", "Other"],
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteCategory, setDeleteCategory] = useState("other");
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);

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
        await fetchSettings(user.id);
        await fetchUserProfile(user.id);
      } catch (error) {
        console.error("Error:", error);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("location, location_city")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };


  const fetchSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          notifyOnMatch: data.notify_on_match !== false,
          notifyOnLike: data.notify_on_like !== false,
          notifyOnMessage: data.notify_on_message !== false,
          profileVisibility: data.profile_visibility,
          distanceRange: data.distance_range,
          ageRange: data.age_range,
          useCustomLocation: data.use_custom_location || false,
          customLocationCity: data.custom_location_city || "",
          customLocationState: data.custom_location_state || "",
          customLocationCountry: data.custom_location_country || "",
          showMeGender: data.show_me_gender || ["Male", "Female", "Non-binary", "Other"],
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Error signing out");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      toast("Preparing your data...", { icon: "📦" });

      // Fetch user's data from Supabase directly
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id_1.eq.${user?.id},user_id_2.eq.${user?.id}`);

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Create JSON export
      const exportData = {
        export_date: new Date().toISOString(),
        account: {
          email: user?.email,
          user_id: user?.id,
          created_at: user?.created_at,
        },
        profile: profile || { message: 'Profile not yet created' },
        matches: {
          total: matches?.length || 0,
          list: matches || [],
        },
        settings: userSettings || {},
      };

      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Data downloaded successfully!");
    } catch (error) {
      console.error("Error downloading data:", error);
      toast.error("Failed to download data");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          reason: deleteReason,
          category: deleteCategory,
          feedback: deleteFeedback || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success("Account deleted successfully");

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    try {
      setIsRedeemingPromo(true);

      const response = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          promoCode: promoCode.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`🎉 ${result.message}`);
        setPromoCode('');
        // Refresh user profile to show updated subscription
        await fetchUserProfile(user?.id);
      } else {
        toast.error(result.error || 'Failed to redeem promo code');
      }
    } catch (error) {
      console.error('Promo redemption error:', error);
      toast.error('An error occurred while redeeming the promo code');
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          notify_on_match: settings.notifyOnMatch,
          notify_on_like: settings.notifyOnLike,
          notify_on_message: settings.notifyOnMessage,
          profile_visibility: settings.profileVisibility,
          distance_range: settings.distanceRange,
          age_range: settings.ageRange,
          use_custom_location: settings.useCustomLocation,
          custom_location_city: settings.customLocationCity,
          custom_location_state: settings.customLocationState,
          custom_location_country: settings.customLocationCountry,
          show_me_gender: settings.showMeGender,
          dark_mode: isDarkMode,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Save error:", error);
        throw error;
      }

      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error?.message || "Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Location & Matching</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                {(() => {
                  const accuracy = getLocationAccuracy({
                    location: location ? { lat: location.lat, lng: location.lng } : null,
                    location_city: userProfile?.location_city
                  });

                  return (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-pink-500" />
                            <span className="font-medium">Location Accuracy</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {accuracy.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${accuracy.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {accuracy.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {locationPermission !== 'granted' && (
                        <Button
                          onClick={() => {
                            localStorage.removeItem('location-permission');
                            sessionStorage.removeItem('location-asked');
                            requestLocation();
                          }}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Enable GPS Location for Better Matches
                        </Button>
                      )}

                      {locationPermission === 'granted' && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm">GPS location enabled - Best matching accuracy!</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Discovery Preferences</h3>
              <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border">
                {/* Custom Location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Search in Different Location</label>
                      <p className="text-xs text-gray-500">Override your profile location for discovery</p>
                    </div>
                    <Switch
                      checked={settings.useCustomLocation}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          useCustomLocation: checked,
                        }))
                      }
                    />
                  </div>

                  {settings.useCustomLocation && (
                    <div className="space-y-3 pl-4 border-l-2 border-pink-300">
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">City</label>
                        <Input
                          value={settings.customLocationCity}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customLocationCity: e.target.value,
                            }))
                          }
                          placeholder="e.g., Lagos"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">State/Region (Optional)</label>
                        <Input
                          value={settings.customLocationState}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customLocationState: e.target.value,
                            }))
                          }
                          placeholder="e.g., Lagos State"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Country</label>
                        <Input
                          value={settings.customLocationCountry}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customLocationCountry: e.target.value,
                            }))
                          }
                          placeholder="e.g., Nigeria"
                          className="mt-1"
                        />
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        Tip: Turn this off to return to your profile location
                      </p>
                    </div>
                  )}

                  {!settings.useCustomLocation && userProfile?.location_city && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        Currently searching in: <span className="font-semibold">{userProfile.location_city}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Distance Range</label>
                    <span className="text-sm text-gray-500">{settings.distanceRange} km</span>
                  </div>
                  <Slider
                    value={[settings.distanceRange]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, distanceRange: value }))
                    }
                    max={500}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Search for people within {settings.distanceRange} km of your {settings.useCustomLocation ? 'custom' : 'profile'} location
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Age Range</label>
                    <span className="text-sm text-gray-500">{settings.ageRange[0]} - {settings.ageRange[1]} years</span>
                  </div>
                  <Slider
                    value={settings.ageRange}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, ageRange: value }))
                    }
                    max={100}
                    min={18}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Show Me</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Male", "Female", "Non-binary", "Other"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => {
                          const current = settings.showMeGender;
                          const updated = current.includes(gender)
                            ? current.filter(g => g !== gender)
                            : [...current, gender];
                          setSettings((prev) => ({ ...prev, showMeGender: updated.length > 0 ? updated : current }));
                        }}
                        className={`p-3 rounded-lg border-2 transition text-sm ${
                          settings.showMeGender.includes(gender)
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 font-medium"
                            : "border-gray-200 hover:border-pink-300"
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Select at least one gender</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Profile Visibility</label>
                    <p className="text-xs text-gray-500">Make your profile visible to others</p>
                  </div>
                  <Switch
                    checked={settings.profileVisibility}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        profileVisibility: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-xs text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Push Notifications</label>
                    <p className="text-xs text-gray-500">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        pushNotifications: checked,
                      }))
                    }
                  />
                </div>

                {/* Specific Notification Types */}
                {settings.emailNotifications && (
                  <div className="ml-4 space-y-3 border-l-2 border-pink-200 pl-4">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Email Notification Types</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Match Notifications</label>
                        <p className="text-xs text-gray-500">Get notified when you match with someone</p>
                      </div>
                      <Switch
                        checked={settings.notifyOnMatch}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifyOnMatch: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Like Notifications</label>
                        <p className="text-xs text-gray-500">Get notified when someone likes you</p>
                      </div>
                      <Switch
                        checked={settings.notifyOnLike}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifyOnLike: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Message Notifications</label>
                        <p className="text-xs text-gray-500">Get notified when you receive a message</p>
                      </div>
                      <Switch
                        checked={settings.notifyOnMessage}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifyOnMessage: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="premium" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Subscription & Billing</h3>

              {/* Current Plan */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</h4>
                    <p className="text-2xl font-bold mt-1">
                      {(!userProfile?.subscription_tier_id || userProfile?.subscription_tier_id === 'free') && 'Free Plan'}
                      {userProfile?.subscription_tier_id === 'basic_monthly' && 'Basic Monthly'}
                      {userProfile?.subscription_tier_id === 'standard_3month' && 'Standard (3 Months)'}
                      {userProfile?.subscription_tier_id === 'premium_yearly' && 'Premium VIP'}
                    </p>
                  </div>
                  {userProfile?.subscription_tier_id && userProfile?.subscription_tier_id !== 'free' && (
                    <div className="flex items-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                    </div>
                  )}
                </div>

                {(!userProfile?.subscription_tier_id || userProfile?.subscription_tier_id === 'free') ? (
                  <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white">
                    <p className="text-sm mb-3">Unlock premium features and get more matches!</p>
                    <Button
                      onClick={() => router.push('/premium')}
                      className="w-full bg-white text-pink-500 hover:bg-gray-100 font-semibold"
                    >
                      View All Plans
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span className="font-medium">Premium Active</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => router.push('/premium')}
                        variant="outline"
                        className="flex-1"
                      >
                        Change Plan
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Code Redemption */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-pink-500" />
                  <h4 className="font-semibold">Have a Promo Code?</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter your promotional code to unlock premium features
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase"
                    disabled={isRedeemingPromo}
                  />
                  <Button
                    onClick={handleRedeemPromo}
                    disabled={isRedeemingPromo || !promoCode.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    {isRedeemingPromo ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Redeeming...
                      </div>
                    ) : (
                      'Redeem'
                    )}
                  </Button>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h4 className="font-semibold mb-4">All Available Plans</h4>
                <div className="space-y-3">
                  {/* Free */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div>
                      <p className="font-medium">Free</p>
                      <p className="text-xs text-gray-500">10 swipes/day • 11 messages/day</p>
                    </div>
                    <span className="text-lg font-bold">$0</span>
                  </div>

                  {/* Basic */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        Basic Monthly
                        <span className="text-xs bg-pink-600 text-white px-2 py-0.5 rounded-full">POPULAR</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">50 swipes/day • Unlimited messages • Ad-free</p>
                    </div>
                    <span className="text-lg font-bold">$9.99/mo</span>
                  </div>

                  {/* Standard */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        Standard
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">SAVE 20%</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited • See who likes • AI matching</p>
                    </div>
                    <span className="text-lg font-bold">$8/mo</span>
                  </div>

                  {/* Premium */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        Premium VIP
                        <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">BEST VALUE</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">All features • Priority support</p>
                    </div>
                    <span className="text-lg font-bold">$8.33/mo</span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/premium')}
                  className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  See Full Comparison
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input type="email" value={user?.email || ""} disabled className="bg-gray-50 dark:bg-gray-900" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Appearance</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Dark Mode</label>
                    <p className="text-xs text-gray-500">Switch between light and dark theme</p>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={(checked) => {
                      toggleDarkMode(checked, user?.id);
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">App Performance</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Clear App Cache</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    If the app is stuck showing old content or not loading properly, clear the cache to fix it.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/clear-cache')}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache & Reload
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Download Your Data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Get a copy of all your data including profile, messages, matches, and activity
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleDownloadData}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data (JSON)
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-red-200 dark:border-red-800 space-y-4">
                <div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-red-200">
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              We're sad to see you go. Please help us improve by telling us why you're leaving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Why are you deleting your account? *
              </label>
              <select
                value={deleteCategory}
                onChange={(e) => setDeleteCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="found_match">I found a match</option>
                <option value="privacy_concerns">Privacy concerns</option>
                <option value="not_useful">App not useful</option>
                <option value="too_expensive">Too expensive</option>
                <option value="technical_issues">Technical issues</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Please explain (required) *
              </label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Tell us more about your reason..."
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Any additional feedback? (optional)
              </label>
              <Textarea
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                placeholder="How could we have made your experience better?"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This will permanently delete all your data including:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 ml-4">
                <li>• Profile and photos</li>
                <li>• All messages and matches</li>
                <li>• Likes and activity history</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Account Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t">
        <Button onClick={saveSettings} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
          {loading ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
