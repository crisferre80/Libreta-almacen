import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let authConfig = {};

if (Capacitor.isNativePlatform()) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    authConfig = {
      auth: {
        storage: {
          getItem: async (key: string) => {
            try {
              const { value } = await Preferences.get({ key });
              return value;
            } catch (error) {
              console.warn('Error getting item from Preferences:', error);
              return null;
            }
          },
          setItem: async (key: string, value: string) => {
            try {
              await Preferences.set({ key, value });
            } catch (error) {
              console.warn('Error setting item in Preferences:', error);
            }
          },
          removeItem: async (key: string) => {
            try {
              await Preferences.remove({ key });
            } catch (error) {
              console.warn('Error removing item from Preferences:', error);
            }
          },
        },
      },
    };
  } catch (error) {
    console.warn('Failed to load Preferences plugin, using default storage:', error);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, authConfig);
