import { useState, useEffect } from 'react';
import { userProfileService } from '../services/supabase/userProfile';
import type { UserProfile } from '../types';

export const useSupabaseUserProfile = (address?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await userProfileService.getUserProfile(address);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [address]);

  const createProfile = async (profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const newProfile = await userProfileService.createUserProfile(profileData);
      if (newProfile) {
        setProfile(newProfile);
        return newProfile;
      }
      return null;
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!address) return null;

    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await userProfileService.updateUserProfile(address, updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
        return updatedProfile;
      }
      return null;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyProfile = async () => {
    if (!address) return false;

    try {
      const success = await userProfileService.verifyUserProfile(address);
      if (success && profile) {
        setProfile({ ...profile, verified: true });
      }
      return success;
    } catch (err) {
      console.error('Error verifying profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify profile');
      return false;
    }
  };

  const refresh = () => {
    loadProfile();
  };

  return {
    profile,
    loading,
    error,
    createProfile,
    updateProfile,
    verifyProfile,
    refresh
  };
};