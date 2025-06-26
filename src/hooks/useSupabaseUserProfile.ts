import { useState, useCallback, useEffect } from 'react';
import { supabaseUserProfileService } from '../services/supabase/userProfile';
import { walletService } from '../services/wallet';
import { UserProfile } from '../types';

export const useSupabaseUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (walletAddress: string) => {
    if (!walletAddress) {
      setUserProfile(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const profile = await supabaseUserProfileService.getProfileByWalletAddress(walletAddress);
      setUserProfile(profile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Error loading profile:', err);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);

    try {
      const createdProfile = await supabaseUserProfileService.createProfile(profile);
      setUserProfile(createdProfile);
      return createdProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userProfile) {
      throw new Error('No profile to update');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await supabaseUserProfileService.updateProfile(userProfile.address, updates);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  const deleteProfile = useCallback(async () => {
    if (!userProfile) {
      throw new Error('No profile to delete');
    }

    setIsLoading(true);
    setError(null);

    try {
      await supabaseUserProfileService.deleteProfile(userProfile.address);
      setUserProfile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile]);

  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setError(null);
  }, []);

  const hasProfile = useCallback((walletAddress: string): boolean => {
    return userProfile !== null && userProfile.address === walletAddress;
  }, [userProfile]);

  const refreshProfile = useCallback(async () => {
    if (userProfile) {
      await loadProfile(userProfile.address);
    }
  }, [userProfile, loadProfile]);

  const resetAll = useCallback(() => {
    setUserProfile(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    userProfile,
    isLoading,
    error,
    loadProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    clearProfile,
    hasProfile,
    refreshProfile,
    resetAll,
    clearError: () => setError(null)
  };
};