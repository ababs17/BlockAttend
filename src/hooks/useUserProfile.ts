import { useState } from 'react';
import { UserProfile } from '../types';
import { userProfileService } from '../services/userProfile';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (walletAddress: string) => {
    if (!walletAddress) {
      setUserProfile(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const profile = await userProfileService.getProfileByWalletAddress(walletAddress);
      setUserProfile(profile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Error loading profile:', err);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);

    try {
      const createdProfile = await userProfileService.createProfile(profile);
      setUserProfile(createdProfile);
      return createdProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) {
      throw new Error('No profile to update');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await userProfileService.updateProfile(userProfile.address, updates);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfile = async () => {
    if (!userProfile) {
      throw new Error('No profile to delete');
    }

    setIsLoading(true);
    setError(null);

    try {
      await userProfileService.deleteProfile(userProfile.address);
      setUserProfile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearProfile = () => {
    setUserProfile(null);
    setError(null);
  };

  const hasProfile = (walletAddress: string): boolean => {
    return userProfile !== null && userProfile.address === walletAddress;
  };

  const refreshProfile = async () => {
    if (userProfile) {
      await loadProfile(userProfile.address);
    }
  };

  const resetAll = () => {
    setUserProfile(null);
    setIsLoading(false);
    setError(null);
  };

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