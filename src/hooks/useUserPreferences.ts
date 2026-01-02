import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPreferences {
  id: string;
  user_id: string;
  language_code: string;
  language_name: string;
  voice_enabled: boolean;
  voice_auto_speak: boolean;
  voice_speed: number;
  conversation_history_enabled: boolean;
  conversation_retention_days: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  language_code: 'en',
  language_name: 'English',
  voice_enabled: true,
  voice_auto_speak: false,
  voice_speed: 1.0,
  conversation_history_enabled: true,
  conversation_retention_days: 30,
};

export function useUserPreferences() {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences for new user
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
        } else if (newData) {
          setPreferences(newData as UserPreferences);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [isAuthenticated, user, loadPreferences]);

  const savePreferences = useCallback(
    async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }

      if (data) {
        setPreferences(data as UserPreferences);
      }

      return data;
    },
    [user]
  );

  return {
    preferences,
    loading,
    savePreferences,
    reload: loadPreferences,
  };
}
