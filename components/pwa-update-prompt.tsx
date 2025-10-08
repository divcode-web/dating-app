"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          }
        });
      });

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5" />
              <h3 className="font-semibold">Update Available!</h3>
            </div>
            <p className="text-sm text-white/90 mb-3">
              A new version of the app is ready. Update now for the latest features and improvements.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={updateServiceWorker}
                size="sm"
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Now
              </Button>
              <Button
                onClick={() => setShowPrompt(false)}
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
