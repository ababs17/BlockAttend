export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  address: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  institution: string;
  department?: string;
  studentId?: string;
  employeeId?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  description: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdBy: string;
  attendeeCount: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  declarationTime: Date;
  allowedRadius: number;
  checkInWindow: number;
  verifiedChecker: boolean;
  excuseDeadlineHours: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentAddress: string;
  timestamp: Date;
  transactionId: string;
  verified: boolean;
  status: 'present' | 'late' | 'absent' | 'excused';
  location?: {
    latitude: number;
    longitude: number;
  };
  locationVerified: boolean;
  distanceFromClass: number;
  checkInAttempts: number;
}

export interface ExcuseSubmission {
  id: string;
  sessionId: string;
  studentAddress: string;
  reason: string;
  submissionTime: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewTime?: Date;
  reviewNotes?: string;
  transactionId: string;
  isWithinDeadline: boolean;
}

export interface ExamEligibility {
  studentAddress: string;
  courseCode: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  requiredPercentage: number;
  isEligible: boolean;
  status: 'eligible' | 'not-eligible' | 'at-risk';
  sessionsNeeded?: number;
  lastCalculated: Date;
}

export interface CourseAttendanceSummary {
  courseCode: string;
  courseName: string;
  totalSessions: number;
  attendedSessions: number;
  excusedSessions: number;
  missedSessions: number;
  attendancePercentage: number;
  examEligibility: ExamEligibility;
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  balance?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
}

export interface AlgorandConfig {
  server: string;
  port: number;
  token: string;
  network: 'MainNet' | 'TestNet' | 'BetaNet';
}

export interface VeracityCheck {
  locationMatch: boolean;
  timeWindow: boolean;
  noDuplicates: boolean;
  walletVerified: boolean;
  overallValid: boolean;
  errors: string[];
}