import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Database } from '../../types/database';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

class SupabaseUserProfileService {
  // Set current user context for RLS
  private async setUserContext(userAddress: string) {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_address',
      setting_value: userAddress,
      is_local: true
    });
  }

  // Convert database row to UserProfile type
  private dbRowToUserProfile(row: UserProfileRow): UserProfile {
    return {
      id: row.id,
      address: row.address,
      role: row.role,
      name: row.name,
      email: row.email,
      phone: row.phone,
      institution: row.institution,
      department: row.department || undefined,
      studentId: row.student_id || undefined,
      employeeId: row.employee_id || undefined,
      verified: row.verified,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // Convert UserProfile to database insert format
  private userProfileToDbInsert(profile: UserProfile): UserProfileInsert {
    return {
      address: profile.address,
      role: profile.role,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      institution: profile.institution,
      department: profile.department || null,
      student_id: profile.studentId || null,
      employee_id: profile.employeeId || null,
      verified: profile.verified
    };
  }

  async getProfileByWalletAddress(walletAddress: string): Promise<UserProfile | null> {
    try {
      await this.setUserContext(walletAddress);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return this.dbRowToUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async createProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getProfileByWalletAddress(profile.address);
      if (existingProfile) {
        throw new Error('Profile already exists for this wallet address');
      }

      // Check if email is already taken
      const { data: emailCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', profile.email)
        .single();

      if (emailCheck) {
        throw new Error('Email address is already registered');
      }

      const insertData = this.userProfileToDbInsert(profile);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.dbRowToUserProfile(data);
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
      await this.setUserContext(walletAddress);

      const updateData: UserProfileUpdate = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.institution) updateData.institution = updates.institution;
      if (updates.department !== undefined) updateData.department = updates.department || null;
      if (updates.studentId !== undefined) updateData.student_id = updates.studentId || null;
      if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId || null;
      if (updates.verified !== undefined) updateData.verified = updates.verified;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('address', walletAddress)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.dbRowToUserProfile(data);
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
      await this.setUserContext(walletAddress);

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('address', walletAddress);

      if (error) {
        throw error;
      }
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
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ verified })
        .eq('address', walletAddress)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.dbRowToUserProfile(data);
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('institution', institution)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(row => this.dbRowToUserProfile(row));
    } catch (error) {
      console.error('Error fetching profiles by institution:', error);
      return [];
    }
  }

  async getUnverifiedProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('verified', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(row => this.dbRowToUserProfile(row));
    } catch (error) {
      console.error('Error fetching unverified profiles:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_profiles').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

export const supabaseUserProfileService = new SupabaseUserProfileService();