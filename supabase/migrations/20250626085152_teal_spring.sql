/*
  # Initial BlockAttend Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `address` (text, unique) - Algorand wallet address
      - `role` (enum) - teacher or student
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `institution` (text)
      - `department` (text, optional)
      - `student_id` (text, optional)
      - `employee_id` (text, optional)
      - `verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `attendance_sessions`
      - `id` (uuid, primary key)
      - `course_code` (text)
      - `course_name` (text)
      - `description` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `is_active` (boolean)
      - `created_by` (text) - references user wallet address
      - `attendee_count` (integer)
      - `location_latitude` (numeric)
      - `location_longitude` (numeric)
      - `location_address` (text, optional)
      - `declaration_time` (timestamp)
      - `allowed_radius` (integer)
      - `check_in_window` (integer)
      - `verified_checker` (boolean)
      - `excuse_deadline_hours` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `attendance_records`
      - `id` (uuid, primary key)
      - `session_id` (uuid) - references attendance_sessions
      - `student_address` (text) - references user wallet address
      - `timestamp` (timestamp)
      - `transaction_id` (text) - Algorand transaction ID
      - `verified` (boolean)
      - `status` (enum) - present, late, absent, excused
      - `location_latitude` (numeric, optional)
      - `location_longitude` (numeric, optional)
      - `location_verified` (boolean)
      - `distance_from_class` (integer)
      - `check_in_attempts` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `excuse_submissions`
      - `id` (uuid, primary key)
      - `session_id` (uuid) - references attendance_sessions
      - `student_address` (text) - references user wallet address
      - `reason` (text)
      - `submission_time` (timestamp)
      - `approval_status` (enum) - pending, approved, rejected
      - `reviewed_by` (text, optional) - references user wallet address
      - `review_time` (timestamp, optional)
      - `review_notes` (text, optional)
      - `transaction_id` (text) - Algorand transaction ID
      - `is_within_deadline` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control based on roles
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'excused');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  role user_role NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  institution text NOT NULL,
  department text,
  student_id text,
  employee_id text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  course_name text NOT NULL,
  description text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by text NOT NULL,
  attendee_count integer DEFAULT 0,
  location_latitude numeric NOT NULL,
  location_longitude numeric NOT NULL,
  location_address text,
  declaration_time timestamptz NOT NULL,
  allowed_radius integer DEFAULT 50,
  check_in_window integer DEFAULT 10,
  verified_checker boolean DEFAULT false,
  excuse_deadline_hours integer DEFAULT 48,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_address text NOT NULL,
  timestamp timestamptz NOT NULL,
  transaction_id text NOT NULL,
  verified boolean DEFAULT false,
  status attendance_status NOT NULL,
  location_latitude numeric,
  location_longitude numeric,
  location_verified boolean DEFAULT false,
  distance_from_class integer DEFAULT 0,
  check_in_attempts integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create excuse_submissions table
CREATE TABLE IF NOT EXISTS excuse_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_address text NOT NULL,
  reason text NOT NULL,
  submission_time timestamptz NOT NULL,
  approval_status approval_status DEFAULT 'pending',
  reviewed_by text,
  review_time timestamptz,
  review_notes text,
  transaction_id text NOT NULL,
  is_within_deadline boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_address ON user_profiles(address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_institution ON user_profiles(institution);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_created_by ON attendance_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_course_code ON attendance_sessions(course_code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_start_time ON attendance_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_active ON attendance_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_address ON attendance_records(student_address);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_timestamp ON attendance_records(timestamp);

CREATE INDEX IF NOT EXISTS idx_excuse_submissions_session_id ON excuse_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_excuse_submissions_student_address ON excuse_submissions(student_address);
CREATE INDEX IF NOT EXISTS idx_excuse_submissions_approval_status ON excuse_submissions(approval_status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuse_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (address = current_setting('app.current_user_address', true));

CREATE POLICY "Anyone can create profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for attendance_sessions
CREATE POLICY "Anyone can read active sessions"
  ON attendance_sessions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Teachers can create sessions"
  ON attendance_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE address = created_by 
      AND role = 'teacher' 
      AND verified = true
    )
  );

CREATE POLICY "Session creators can update their sessions"
  ON attendance_sessions
  FOR UPDATE
  USING (created_by = current_setting('app.current_user_address', true));

-- RLS Policies for attendance_records
CREATE POLICY "Students can read own records"
  ON attendance_records
  FOR SELECT
  USING (student_address = current_setting('app.current_user_address', true));

CREATE POLICY "Teachers can read records for their sessions"
  ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions 
      WHERE id = session_id 
      AND created_by = current_setting('app.current_user_address', true)
    )
  );

CREATE POLICY "Students can create own attendance records"
  ON attendance_records
  FOR INSERT
  WITH CHECK (student_address = current_setting('app.current_user_address', true));

-- RLS Policies for excuse_submissions
CREATE POLICY "Students can read own excuses"
  ON excuse_submissions
  FOR SELECT
  USING (student_address = current_setting('app.current_user_address', true));

CREATE POLICY "Teachers can read excuses for their sessions"
  ON excuse_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions 
      WHERE id = session_id 
      AND created_by = current_setting('app.current_user_address', true)
    )
  );

CREATE POLICY "Students can create own excuses"
  ON excuse_submissions
  FOR INSERT
  WITH CHECK (student_address = current_setting('app.current_user_address', true));

CREATE POLICY "Teachers can update excuses for their sessions"
  ON excuse_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions 
      WHERE id = session_id 
      AND created_by = current_setting('app.current_user_address', true)
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at
  BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_excuse_submissions_updated_at
  BEFORE UPDATE ON excuse_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();