"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, Settings } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        // Invalid JSON, show banner again
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());

    // Apply preferences
    if (!prefs.analytics) {
      // Disable analytics cookies
      document.cookie.split(";").forEach((c) => {
        const cookie = c.trim();
        if (cookie.startsWith('_ga') || cookie.startsWith('_gid')) {
          document.cookie = cookie.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      });
    }

    if (!prefs.marketing) {
      // Disable marketing cookies
      document.cookie.split(";").forEach((c) => {
        const cookie = c.trim();
        if (cookie.startsWith('_fbp') || cookie.startsWith('fr')) {
          document.cookie = cookie.split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      });
    }

    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    savePreferences(necessaryOnly);
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-white shadow-2xl">
          {!showSettings ? (
            // Main Banner
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Cookie className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3">We value your privacy</h2>
                  <p className="text-gray-700 mb-4">
                    We use cookies to enhance your browsing experience, serve personalized content,
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    You can customize your preferences or learn more in our{' '}
                    <Link href="/cookie-policy" className="text-purple-600 hover:underline font-medium">
                      Cookie Policy
                    </Link>
                    .
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Compliance:</strong> This site complies with GDPR (EU), UK GDPR,
                      CCPA (California), and other international privacy regulations.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={acceptAll}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Accept All
                    </Button>
                    <Button
                      onClick={acceptNecessary}
                      variant="outline"
                    >
                      Necessary Only
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      variant="outline"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Cookie Preferences</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Necessary Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Necessary Cookies</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">Always Active</span>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 text-purple-600 rounded cursor-not-allowed opacity-50"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies are essential for the website to function properly. They enable
                    core functionality such as security, authentication, and accessibility.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Analytics Cookies</h3>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies help us understand how visitors interact with our website by
                    collecting and reporting information anonymously.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Marketing Cookies</h3>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies are used to track visitors across websites to display relevant
                    advertisements and measure campaign effectiveness.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={saveCustom}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={acceptAll}
                  variant="outline"
                >
                  Accept All
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                >
                  Necessary Only
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                For more information, please read our{' '}
                <Link href="/cookie-policy" className="text-purple-600 hover:underline">
                  Cookie Policy
                </Link>
                {' '}and{' '}
                <Link href="/privacy-policy" className="text-purple-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
