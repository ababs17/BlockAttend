import { supabase } from '../../lib/supabase';
import type { AttendanceSession, AttendanceRecord, ExcuseSubmission } from '../../types';

export class SupabaseAttendanceService {
  private userAddress: string | null = null;

  async setUserContext(address: string): Promise<void> {
    try {
      this.userAddress = address;
      
      // Set the user context for RLS policies
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_address',
        setting_value: address,
        is_local: true
      });

      if (error) {
        console.warn('Could not set user context:', error);
        // Don't throw here as this might not be critical for all operations
      }
    } catch (error) {
      console.warn('Error setting user context:', error);
      // Continue execution as this might not be critical
    }
  }

  async getSessions(): Promise<AttendanceSession[]> {
    try {
      // First ensure user context is set if we have a user address
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessions:', error);
      return [];
    }
  }

  async getSessionById(id: string): Promise<AttendanceSession | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSessionById:', error);
      return null;
    }
  }

  async createSession(session: Omit<AttendanceSession, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceSession | null> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([session])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  async updateSession(id: string, updates: Partial<AttendanceSession>): Promise<AttendanceSession | null> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSession:', error);
      return null;
    }
  }

  async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching attendance records:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAttendanceRecords:', error);
      return [];
    }
  }

  async createAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceRecord | null> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createAttendanceRecord:', error);
      return null;
    }
  }

  async getExcuseSubmissions(sessionId?: string): Promise<ExcuseSubmission[]> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      let query = supabase
        .from('excuse_submissions')
        .select('*')
        .order('submission_time', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching excuse submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExcuseSubmissions:', error);
      return [];
    }
  }

  async createExcuseSubmission(excuse: Omit<ExcuseSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<ExcuseSubmission | null> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('excuse_submissions')
        .insert([excuse])
        .select()
        .single();

      if (error) {
        console.error('Error creating excuse submission:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createExcuseSubmission:', error);
      return null;
    }
  }

  async updateExcuseSubmission(id: string, updates: Partial<ExcuseSubmission>): Promise<ExcuseSubmission | null> {
    try {
      if (this.userAddress) {
        await this.setUserContext(this.userAddress);
      }

      const { data, error } = await supabase
        .from('excuse_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating excuse submission:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateExcuseSubmission:', error);
      return null;
    }
  }
}

export const attendanceService = new SupabaseAttendanceService();