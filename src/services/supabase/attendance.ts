import { supabase } from '../../lib/supabase';
import { AttendanceSession, AttendanceRecord, ExcuseSubmission } from '../../types';
import { Database } from '../../types/database';

type AttendanceSessionRow = Database['public']['Tables']['attendance_sessions']['Row'];
type AttendanceSessionInsert = Database['public']['Tables']['attendance_sessions']['Insert'];
type AttendanceRecordRow = Database['public']['Tables']['attendance_records']['Row'];
type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
type ExcuseSubmissionRow = Database['public']['Tables']['excuse_submissions']['Row'];
type ExcuseSubmissionInsert = Database['public']['Tables']['excuse_submissions']['Insert'];

class SupabaseAttendanceService {
  // Set current user context for RLS - with fallback
  private async setUserContext(userAddress: string) {
    try {
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_address',
        setting_value: userAddress,
        is_local: true
      });
      
      if (error) {
        console.warn('Could not set user context (this is expected if function does not exist):', error);
      }
    } catch (error) {
      console.warn('Error setting user context:', error);
      // Continue execution - this is not critical for basic functionality
    }
  }

  // Convert database row to AttendanceSession type
  private dbRowToAttendanceSession(row: AttendanceSessionRow): AttendanceSession {
    return {
      id: row.id,
      courseCode: row.course_code,
      courseName: row.course_name,
      description: row.description,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      isActive: row.is_active || false,
      createdBy: row.created_by,
      attendeeCount: row.attendee_count || 0,
      location: {
        latitude: Number(row.location_latitude),
        longitude: Number(row.location_longitude),
        address: row.location_address || undefined
      },
      declarationTime: new Date(row.declaration_time),
      allowedRadius: row.allowed_radius || 50,
      checkInWindow: row.check_in_window || 10,
      verifiedChecker: row.verified_checker || false,
      excuseDeadlineHours: row.excuse_deadline_hours || 48
    };
  }

  // Convert AttendanceSession to database insert format
  private attendanceSessionToDbInsert(session: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>): AttendanceSessionInsert {
    return {
      course_code: session.courseCode,
      course_name: session.courseName,
      description: session.description,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime.toISOString(),
      is_active: session.isActive,
      created_by: session.createdBy,
      location_latitude: session.location.latitude,
      location_longitude: session.location.longitude,
      location_address: session.location.address || null,
      declaration_time: session.declarationTime.toISOString(),
      allowed_radius: session.allowedRadius,
      check_in_window: session.checkInWindow,
      excuse_deadline_hours: session.excuseDeadlineHours
    };
  }

  // Convert database row to AttendanceRecord type
  private dbRowToAttendanceRecord(row: AttendanceRecordRow): AttendanceRecord {
    return {
      id: row.id,
      sessionId: row.session_id,
      studentAddress: row.student_address,
      timestamp: new Date(row.timestamp),
      transactionId: row.transaction_id,
      verified: row.verified || false,
      status: row.status,
      location: row.location_latitude && row.location_longitude ? {
        latitude: Number(row.location_latitude),
        longitude: Number(row.location_longitude)
      } : undefined,
      locationVerified: row.location_verified || false,
      distanceFromClass: row.distance_from_class || 0,
      checkInAttempts: row.check_in_attempts || 1
    };
  }

  // Convert database row to ExcuseSubmission type
  private dbRowToExcuseSubmission(row: ExcuseSubmissionRow): ExcuseSubmission {
    return {
      id: row.id,
      sessionId: row.session_id,
      studentAddress: row.student_address,
      reason: row.reason,
      submissionTime: new Date(row.submission_time),
      approvalStatus: row.approval_status || 'pending',
      reviewedBy: row.reviewed_by || undefined,
      reviewTime: row.review_time ? new Date(row.review_time) : undefined,
      reviewNotes: row.review_notes || undefined,
      transactionId: row.transaction_id,
      isWithinDeadline: row.is_within_deadline || false
    };
  }

  async createSession(sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>, userAddress: string): Promise<AttendanceSession> {
    try {
      await this.setUserContext(userAddress);

      const insertData = this.attendanceSessionToDbInsert(sessionData);
      
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.dbRowToAttendanceSession(data);
    } catch (error) {
      console.error('Error creating attendance session:', error);
      throw new Error('Failed to create attendance session');
    }
  }

  async getSessions(userAddress?: string): Promise<AttendanceSession[]> {
    try {
      if (userAddress) {
        await this.setUserContext(userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return (data || []).map(row => this.dbRowToAttendanceSession(row));
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
      return [];
    }
  }

  async recordAttendance(record: Omit<AttendanceRecord, 'id'>, userAddress: string): Promise<AttendanceRecord> {
    try {
      await this.setUserContext(userAddress);

      const insertData: AttendanceRecordInsert = {
        session_id: record.sessionId,
        student_address: record.studentAddress,
        timestamp: record.timestamp.toISOString(),
        transaction_id: record.transactionId,
        verified: record.verified,
        status: record.status,
        location_latitude: record.location?.latitude || null,
        location_longitude: record.location?.longitude || null,
        location_verified: record.locationVerified,
        distance_from_class: record.distanceFromClass,
        check_in_attempts: record.checkInAttempts
      };

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update session attendee count
      await supabase
        .from('attendance_sessions')
        .update({ 
          attendee_count: supabase.sql`attendee_count + 1`
        })
        .eq('id', record.sessionId);

      return this.dbRowToAttendanceRecord(data);
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error('Failed to record attendance');
    }
  }

  async getAttendanceRecords(userAddress?: string): Promise<AttendanceRecord[]> {
    try {
      if (userAddress) {
        await this.setUserContext(userAddress);
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching records:', error);
        return [];
      }

      return (data || []).map(row => this.dbRowToAttendanceRecord(row));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
  }

  async submitExcuse(excuse: Omit<ExcuseSubmission, 'id'>, userAddress: string): Promise<ExcuseSubmission> {
    try {
      await this.setUserContext(userAddress);

      const insertData: ExcuseSubmissionInsert = {
        session_id: excuse.sessionId,
        student_address: excuse.studentAddress,
        reason: excuse.reason,
        submission_time: excuse.submissionTime.toISOString(),
        transaction_id: excuse.transactionId,
        is_within_deadline: excuse.isWithinDeadline
      };

      const { data, error } = await supabase
        .from('excuse_submissions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.dbRowToExcuseSubmission(data);
    } catch (error) {
      console.error('Error submitting excuse:', error);
      throw new Error('Failed to submit excuse');
    }
  }

  async reviewExcuse(excuseId: string, status: 'approved' | 'rejected', reviewNotes: string | undefined, reviewerAddress: string): Promise<ExcuseSubmission> {
    try {
      await this.setUserContext(reviewerAddress);

      const { data, error } = await supabase
        .from('excuse_submissions')
        .update({
          approval_status: status,
          reviewed_by: reviewerAddress,
          review_time: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', excuseId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If approved, create or update attendance record
      if (status === 'approved') {
        const excuse = this.dbRowToExcuseSubmission(data);
        
        // Check if attendance record already exists
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('session_id', excuse.sessionId)
          .eq('student_address', excuse.studentAddress)
          .maybeSingle();

        if (existingRecord) {
          // Update existing record
          await supabase
            .from('attendance_records')
            .update({ status: 'excused' })
            .eq('id', existingRecord.id);
        } else {
          // Create new excused record
          await supabase
            .from('attendance_records')
            .insert({
              session_id: excuse.sessionId,
              student_address: excuse.studentAddress,
              timestamp: excuse.submissionTime.toISOString(),
              transaction_id: 'excused-' + excuse.id,
              verified: true,
              status: 'excused',
              location_verified: false,
              distance_from_class: 0,
              check_in_attempts: 0
            });
        }
      }

      return this.dbRowToExcuseSubmission(data);
    } catch (error) {
      console.error('Error reviewing excuse:', error);
      throw new Error('Failed to review excuse');
    }
  }

  async getExcuseSubmissions(userAddress?: string): Promise<ExcuseSubmission[]> {
    try {
      if (userAddress) {
        await this.setUserContext(userAddress);
      }

      const { data, error } = await supabase
        .from('excuse_submissions')
        .select('*')
        .order('submission_time', { ascending: false });

      if (error) {
        console.error('Error fetching excuses:', error);
        return [];
      }

      return (data || []).map(row => this.dbRowToExcuseSubmission(row));
    } catch (error) {
      console.error('Error fetching excuse submissions:', error);
      return [];
    }
  }
}

export const supabaseAttendanceService = new SupabaseAttendanceService();