"use client";

import { useEffect } from 'react';

export function CacheCleaner() {
  useEffect(() => {
    // Only clean cache in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const cleanCache = () => {
      // Clear only old/stale caches, not all caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          // Only delete caches older than 24 hours
          const cachesToDelete = names.filter(name => {
            // Keep Next.js and Workbox caches
            if (name.includes('next') || name.includes('workbox')) {
              return false;
            }
            return true;
          });

          cachesToDelete.forEach((name) => {
            caches.delete(name);
          });
        });
      }
    };

    // Clean cache only once when app first loads, not on every mount
    const hasCleanedCache = sessionStorage.getItem('cache_cleaned');
    if (!hasCleanedCache) {
      cleanCache();
      sessionStorage.setItem('cache_cleaned', 'true');
    }

    // No interval - only clean once per session
  }, []);

  return null; // This component doesn't render anything
}
