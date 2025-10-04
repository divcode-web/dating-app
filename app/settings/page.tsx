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

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: true,
    distanceRange: 50,
    ageRange: [18, 50],
    darkMode: false,
  });

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
      } catch (error) {
        console.error("Error:", error);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // Apply dark mode on mount
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

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
          profileVisibility: data.profile_visibility,
          distanceRange: data.distance_range,
          ageRange: data.age_range,
          darkMode: data.dark_mode,
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

  const saveSettings = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        profile_visibility: settings.profileVisibility,
        distance_range: settings.distanceRange,
        age_range: settings.ageRange,
        dark_mode: settings.darkMode,
      });

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Error saving settings");
      console.error("Error:", error);
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
              <h3 className="text-lg font-semibold mb-4">Discovery Preferences</h3>
              <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border">
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
                    max={100}
                    step={1}
                    className="w-full"
                  />
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
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="premium" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Premium Membership</h3>
              <div className="p-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Unlock Premium Features</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <span>See who likes you</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <span>Unlimited swipes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <span>Advanced filters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full bg-white text-pink-500 hover:bg-gray-100 font-semibold">
                  Upgrade to Premium
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
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({ ...prev, darkMode: checked }));
                      // Apply dark mode immediately
                      if (checked) {
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('theme', 'dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                        localStorage.setItem('theme', 'light');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  {loading ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t">
        <Button onClick={saveSettings} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          {loading ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
