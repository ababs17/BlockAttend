import { UserProfile } from '../types';

class UserProfileService {
  // Demo profiles storage - reset on each page load
  private demoProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    // Only initialize with demo student profile if needed for testing
    // In production, this would be empty initially
  }

  async getProfileByWalletAddress(walletAddress: string): Promise<UserProfile | null> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return this.demoProfiles.get(walletAddress) || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if profile already exists
      if (this.demoProfiles.has(profile.address)) {
        throw new Error('Profile already exists for this wallet address');
      }

      // Check if email is already taken
      for (const existingProfile of this.demoProfiles.values()) {
        if (existingProfile.email === profile.email) {
          throw new Error('Email address is already registered');
        }
      }

      const newProfile: UserProfile = {
        ...profile,
        id: 'profile-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.demoProfiles.set(profile.address, newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create user profile');
    }
  }

  async updateProfile(walletAddress: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const existingProfile = this.demoProfiles.get(walletAddress);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        address: walletAddress, // Ensure address doesn't change
        id: existingProfile.id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      this.demoProfiles.set(walletAddress, updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update user profile');
    }
  }

  async deleteProfile(walletAddress: string): Promise<void> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!this.demoProfiles.has(walletAddress)) {
        throw new Error('Profile not found');
      }

      this.demoProfiles.delete(walletAddress);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete user profile');
    }
  }

  async verifyProfile(walletAddress: string, verified: boolean = true): Promise<UserProfile> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existingProfile = this.demoProfiles.get(walletAddress);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        verified,
        updatedAt: new Date()
      };

      this.demoProfiles.set(walletAddress, updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error verifying user profile:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to verify user profile');
    }
  }

  async getProfilesByInstitution(institution: string): Promise<UserProfile[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const profiles = Array.from(this.demoProfiles.values())
        .filter(profile => profile.institution === institution)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return profiles;
    } catch (error) {
      console.error('Error fetching profiles by institution:', error);
      return [];
    }
  }

  async getUnverifiedProfiles(): Promise<UserProfile[]> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const profiles = Array.from(this.demoProfiles.values())
        .filter(profile => !profile.verified)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return profiles;
    } catch (error) {
      console.error('Error fetching unverified profiles:', error);
      return [];
    }
  }

  // Method to clear all demo data (for testing/reset purposes)
  clearAllProfiles(): void {
    this.demoProfiles.clear();
  }

  // Method to test connectivity (always returns true in demo mode)
  async testConnection(): Promise<boolean> {
    return true;
  }
}

export const userProfileService = new UserProfileService();