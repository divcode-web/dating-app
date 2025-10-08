"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";

export default function ClearCachePage() {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearCache = async () => {
    setClearing(true);

    try {
      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear service worker caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear IndexedDB if needed
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }

      // Call cache-bust API
      await fetch('/api/cache-bust', {
        cache: 'no-store',
      });

      setCleared(true);

      // Reload after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      setClearing(false);
      // Still reload on error
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="p-8 max-w-md text-center">
        {!cleared ? (
          <>
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-pink-500" />
            <h1 className="text-2xl font-bold mb-4">Clear App Cache</h1>
            <p className="text-gray-600 mb-6">
              If the app is stuck or showing old content, clear the cache to fix it.
            </p>
            <Button
              onClick={clearCache}
              disabled={clearing}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
            >
              {clearing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Clearing Cache...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache & Reload
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              This will clear all cached data and reload the app.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-4 text-green-600">
              Cache Cleared!
            </h1>
            <p className="text-gray-600">
              Redirecting to home page...
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
