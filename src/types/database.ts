export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          address: string
          role: 'teacher' | 'student'
          name: string
          email: string
          phone: string
          institution: string
          department: string | null
          student_id: string | null
          employee_id: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          role: 'teacher' | 'student'
          name: string
          email: string
          phone: string
          institution: string
          department?: string | null
          student_id?: string | null
          employee_id?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          role?: 'teacher' | 'student'
          name?: string
          email?: string
          phone?: string
          institution?: string
          department?: string | null
          student_id?: string | null
          employee_id?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      attendance_sessions: {
        Row: {
          id: string
          course_code: string
          course_name: string
          description: string
          start_time: string
          end_time: string
          is_active: boolean
          created_by: string
          attendee_count: number
          location_latitude: number
          location_longitude: number
          location_address: string | null
          declaration_time: string
          allowed_radius: number
          check_in_window: number
          verified_checker: boolean
          excuse_deadline_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_code: string
          course_name: string
          description: string
          start_time: string
          end_time: string
          is_active?: boolean
          created_by: string
          attendee_count?: number
          location_latitude: number
          location_longitude: number
          location_address?: string | null
          declaration_time: string
          allowed_radius?: number
          check_in_window?: number
          verified_checker?: boolean
          excuse_deadline_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_code?: string
          course_name?: string
          description?: string
          start_time?: string
          end_time?: string
          is_active?: boolean
          created_by?: string
          attendee_count?: number
          location_latitude?: number
          location_longitude?: number
          location_address?: string | null
          declaration_time?: string
          allowed_radius?: number
          check_in_window?: number
          verified_checker?: boolean
          excuse_deadline_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_address: string
          timestamp: string
          transaction_id: string
          verified: boolean
          status: 'present' | 'late' | 'absent' | 'excused'
          location_latitude: number | null
          location_longitude: number | null
          location_verified: boolean
          distance_from_class: number
          check_in_attempts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_address: string
          timestamp: string
          transaction_id: string
          verified?: boolean
          status: 'present' | 'late' | 'absent' | 'excused'
          location_latitude?: number | null
          location_longitude?: number | null
          location_verified?: boolean
          distance_from_class: number
          check_in_attempts?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_address?: string
          timestamp?: string
          transaction_id?: string
          verified?: boolean
          status?: 'present' | 'late' | 'absent' | 'excused'
          location_latitude?: number | null
          location_longitude?: number | null
          location_verified?: boolean
          distance_from_class?: number
          check_in_attempts?: number
          created_at?: string
          updated_at?: string
        }
      }
      excuse_submissions: {
        Row: {
          id: string
          session_id: string
          student_address: string
          reason: string
          submission_time: string
          approval_status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          review_time: string | null
          review_notes: string | null
          transaction_id: string
          is_within_deadline: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_address: string
          reason: string
          submission_time: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_time?: string | null
          review_notes?: string | null
          transaction_id: string
          is_within_deadline: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_address?: string
          reason?: string
          submission_time?: string
          approval_status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_time?: string | null
          review_notes?: string | null
          transaction_id?: string
          is_within_deadline?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'teacher' | 'student'
      attendance_status: 'present' | 'late' | 'absent' | 'excused'
      approval_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}