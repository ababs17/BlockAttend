import { supabase, getUserProfile } from '../../lib/supabase';
import type { UserProfile } from '../../types';

export class SupabaseUserProfileService {
  async getUserProfile(address: string): Promise<UserProfile | null> {
    try {
      return await getUserProfile(address);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return null;
    }
  }

  async updateUserProfile(address: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // Set user context for RLS
      const { error: contextError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_address',
        setting_value: address,
        is_local: true
      });

      if (contextError) {
        console.warn('Could not set user context:', contextError);
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('address', address)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return null;
    }
  }

  async verifyUserProfile(address: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ verified: true })
        .eq('address', address);

      if (error) {
        console.error('Error verifying user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in verifyUserProfile:', error);
      return false;
    }
  }

  async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all user profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUserProfiles:', error);
      return [];
    }
  }
}

export const userProfileService = new SupabaseUserProfileService();