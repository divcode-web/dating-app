import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useDarkMode(userId?: string) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // Sync with localStorage and DOM on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load from database if user is logged in
  useEffect(() => {
    if (userId) {
      loadDarkModeFromDB(userId);
    }
  }, [userId]);

  const loadDarkModeFromDB = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('dark_mode')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && data.dark_mode !== undefined) {
        toggleDarkMode(data.dark_mode, userId);
      }
    } catch (error) {
      console.error('Error loading dark mode:', error);
    }
  };

  const toggleDarkMode = async (value?: boolean, saveToDb: boolean | string = false) => {
    const newValue = value !== undefined ? value : !isDarkMode;

    // Update state
    setIsDarkMode(newValue);

    // Update DOM
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Save to database if user is logged in
    if (saveToDb) {
      const userIdToSave = typeof saveToDb === 'string' ? saveToDb : userId;
      if (userIdToSave) {
        try {
          await supabase
            .from('user_settings')
            .upsert({
              user_id: userIdToSave,
              dark_mode: newValue,
            }, {
              onConflict: 'user_id'
            });
        } catch (error) {
          console.error('Error saving dark mode:', error);
        }
      }
    }

    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode: newValue } }));
  };

  // Listen for dark mode changes from other components
  useEffect(() => {
    const handleDarkModeChange = (e: CustomEvent) => {
      setIsDarkMode(e.detail.isDarkMode);
    };

    window.addEventListener('darkModeChanged', handleDarkModeChange as EventListener);
    return () => {
      window.removeEventListener('darkModeChanged', handleDarkModeChange as EventListener);
    };
  }, []);

  return { isDarkMode, toggleDarkMode };
}
