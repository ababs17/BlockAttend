import { useState, useCallback, useEffect } from 'react';
import { algorandService } from '../services/algorand';
import { walletService } from '../services/wallet';
import { locationService } from '../services/location';
import { verificationService } from '../services/verification';
import { AttendanceSession, AttendanceRecord, ExcuseSubmission, ExamEligibility, CourseAttendanceSummary } from '../types';

export const useAttendance = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<ExcuseSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load demo data on mount
  useEffect(() => {
    const demoSessions: AttendanceSession[] = [
      {
        id: 'demo-1',
        courseCode: 'CS101',
        courseName: 'Computer Science 101',
        description: 'Introduction to Programming',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        endTime: new Date(Date.now() + 90 * 60 * 1000), // 90 minutes from now
        isActive: true,
        createdBy: 'demo-teacher',
        attendeeCount: 3,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Computer Science Building, Room 101, New York, NY'
        },
        declarationTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        allowedRadius: 50, // 50 meters
        checkInWindow: 10, // 10 minutes
        verifiedChecker: true,
        excuseDeadlineHours: 48 // 48 hours to submit excuse
      },
      {
        id: 'demo-2',
        courseCode: 'MATH201',
        courseName: 'Advanced Mathematics',
        description: 'Advanced Calculus and Linear Algebra',
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 150 * 60 * 1000), // 2.5 hours from now
        isActive: true,
        createdBy: 'demo-teacher',
        attendeeCount: 0,
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Mathematics Hall, Room 205, New York, NY'
        },
        declarationTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        allowedRadius: 30, // 30 meters
        checkInWindow: 15, // 15 minutes
        verifiedChecker: true,
        excuseDeadlineHours: 48 // 48 hours to submit excuse
      },
      {
        id: 'demo-3',
        courseCode: 'PHYS301',
        courseName: 'Advanced Physics',
        description: 'Quantum Mechanics and Relativity',
        startTime: new Date(Date.now() - 180 * 60 * 1000), // 3 hours ago
        endTime: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago (ended)
        isActive: false,
        createdBy: 'demo-teacher',
        attendeeCount: 2,
        location: {
          latitude: 40.7505,
          longitude: -73.9934,
          address: 'Physics Laboratory, Room 301, New York, NY'
        },
        declarationTime: new Date(Date.now() - 200 * 60 * 1000), // 3.3 hours ago
        allowedRadius: 40,
        checkInWindow: 10,
        verifiedChecker: true,
        excuseDeadlineHours: 48
      },
      // Additional demo sessions for better exam eligibility demonstration
      {
        id: 'demo-4',
        courseCode: 'CS101',
        courseName: 'Computer Science 101',
        description: 'Data Structures and Algorithms',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        isActive: false,
        createdBy: 'demo-teacher',
        attendeeCount: 4,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Computer Science Building, Room 102, New York, NY'
        },
        declarationTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
        allowedRadius: 50,
        checkInWindow: 10,
        verifiedChecker: true,
        excuseDeadlineHours: 48
      },
      {
        id: 'demo-5',
        courseCode: 'MATH201',
        courseName: 'Advanced Mathematics',
        description: 'Differential Equations',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        isActive: false,
        createdBy: 'demo-teacher',
        attendeeCount: 3,
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: 'Mathematics Hall, Room 206, New York, NY'
        },
        declarationTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
        allowedRadius: 30,
        checkInWindow: 15,
        verifiedChecker: true,
        excuseDeadlineHours: 48
      }
    ];

    setSessions(demoSessions);

    // Demo attendance records
    const demoRecords: AttendanceRecord[] = [
      {
        id: 'record-1',
        sessionId: 'demo-3',
        studentAddress: 'DEMO_STUDENT_ADDRESS_1234567890ABCDEF1234567890ABCDEF12345678',
        timestamp: new Date(Date.now() - 180 * 60 * 1000),
        transactionId: 'attendance-tx-1',
        verified: true,
        status: 'present',
        location: {
          latitude: 40.7505,
          longitude: -73.9934
        },
        locationVerified: true,
        distanceFromClass: 15,
        checkInAttempts: 1
      },
      {
        id: 'record-2',
        sessionId: 'demo-4',
        studentAddress: 'DEMO_STUDENT_ADDRESS_1234567890ABCDEF1234567890ABCDEF12345678',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        transactionId: 'attendance-tx-2',
        verified: true,
        status: 'present',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        locationVerified: true,
        distanceFromClass: 12,
        checkInAttempts: 1
      },
      {
        id: 'record-3',
        sessionId: 'demo-5',
        studentAddress: 'DEMO_STUDENT_ADDRESS_1234567890ABCDEF1234567890ABCDEF12345678',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        transactionId: 'attendance-tx-3',
        verified: true,
        status: 'excused',
        locationVerified: false,
        distanceFromClass: 0,
        checkInAttempts: 0
      }
    ];

    setRecords(demoRecords);

    // Demo excuse submissions
    const demoExcuses: ExcuseSubmission[] = [
      {
        id: 'excuse-1',
        sessionId: 'demo-5',
        studentAddress: 'DEMO_STUDENT_ADDRESS_1234567890ABCDEF1234567890ABCDEF12345678',
        reason: 'Medical appointment - had to visit the doctor for a scheduled check-up',
        submissionTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        approvalStatus: 'approved',
        reviewedBy: 'demo-teacher',
        reviewTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        reviewNotes: 'Valid medical excuse with documentation provided.',
        transactionId: 'excuse-tx-1',
        isWithinDeadline: true
      }
    ];

    setExcuses(demoExcuses);
  }, []);

  const createSession = useCallback(async (sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      // Verify checker authorization
      const isVerifiedChecker = verificationService.verifyChecker(account);
      if (!isVerifiedChecker) {
        throw new Error('Only verified checkers can declare class sessions');
      }

      // For demo purposes, create session locally
      // In production, this would interact with the blockchain
      const newSession: AttendanceSession = {
        ...sessionData,
        id: algorandService.generateSessionId(),
        attendeeCount: 0,
        createdBy: account,
        verifiedChecker: isVerifiedChecker,
        allowedRadius: sessionData.allowedRadius || 50, // Default 50m radius
        checkInWindow: sessionData.checkInWindow || 10, // Default 10 minutes
        excuseDeadlineHours: sessionData.excuseDeadlineHours || 48 // Default 48 hours
      };

      setSessions(prev => [...prev, newSession]);
      
      // Simulate blockchain transaction
      const mockTxId = 'session-tx-' + Date.now();
      
      return { session: newSession, transactionId: mockTxId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordAttendance = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get current location for attendance verification
      const studentLocation = await locationService.getCurrentLocation();

      // Perform comprehensive veracity check
      const veracityCheck = await verificationService.performVeracityCheck(
        session,
        account,
        {
          latitude: studentLocation.latitude,
          longitude: studentLocation.longitude
        },
        records
      );

      if (!veracityCheck.overallValid) {
        throw new Error(veracityCheck.errors.join(' '));
      }

      // Calculate distance from class location
      const distance = locationService.calculateDistance(
        studentLocation.latitude,
        studentLocation.longitude,
        session.location.latitude,
        session.location.longitude
      );

      // Determine attendance status
      const status = verificationService.determineAttendanceStatus(
        new Date(),
        session.startTime
      );

      // For demo purposes, create record locally
      // In production, this would interact with the blockchain
      const mockTxId = 'attendance-tx-' + Date.now();
      
      const newRecord: AttendanceRecord = {
        id: 'record-' + Date.now(),
        sessionId,
        studentAddress: account,
        timestamp: new Date(),
        transactionId: mockTxId,
        verified: true,
        status,
        location: {
          latitude: studentLocation.latitude,
          longitude: studentLocation.longitude
        },
        locationVerified: veracityCheck.locationMatch,
        distanceFromClass: Math.round(distance),
        checkInAttempts: 1
      };

      setRecords(prev => [...prev, newRecord]);
      
      // Update session attendee count
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, attendeeCount: session.attendeeCount + 1 }
          : session
      ));

      return { record: newRecord, transactionId: mockTxId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record attendance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [records, sessions]);

  const submitExcuse = useCallback(async (sessionId: string, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if student already attended
      const existingRecord = records.find(
        record => record.sessionId === sessionId && record.studentAddress === account
      );

      if (existingRecord && existingRecord.status !== 'absent') {
        throw new Error('You have already attended this session');
      }

      // Check if excuse already submitted
      const existingExcuse = excuses.find(
        excuse => excuse.sessionId === sessionId && excuse.studentAddress === account
      );

      if (existingExcuse) {
        throw new Error('You have already submitted an excuse for this session');
      }

      // Check deadline
      const now = new Date();
      const excuseDeadline = new Date(session.endTime.getTime() + (session.excuseDeadlineHours * 60 * 60 * 1000));
      const isWithinDeadline = now <= excuseDeadline;

      if (!isWithinDeadline) {
        throw new Error(`Excuse submission deadline has passed. You had ${session.excuseDeadlineHours} hours after the session ended.`);
      }

      // Create excuse submission
      const mockTxId = 'excuse-tx-' + Date.now();
      
      const newExcuse: ExcuseSubmission = {
        id: 'excuse-' + Date.now(),
        sessionId,
        studentAddress: account,
        reason: reason.trim(),
        submissionTime: now,
        approvalStatus: 'pending',
        transactionId: mockTxId,
        isWithinDeadline
      };

      setExcuses(prev => [...prev, newExcuse]);

      return { excuse: newExcuse, transactionId: mockTxId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit excuse';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessions, records, excuses]);

  const reviewExcuse = useCallback(async (excuseId: string, status: 'approved' | 'rejected', reviewNotes?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      const excuse = excuses.find(e => e.id === excuseId);
      if (!excuse) {
        throw new Error('Excuse not found');
      }

      const session = sessions.find(s => s.id === excuse.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Verify reviewer is the session creator
      if (session.createdBy !== account) {
        throw new Error('Only the class checker can review excuses');
      }

      // Update excuse
      const updatedExcuse: ExcuseSubmission = {
        ...excuse,
        approvalStatus: status,
        reviewedBy: account,
        reviewTime: new Date(),
        reviewNotes: reviewNotes?.trim()
      };

      setExcuses(prev => prev.map(e => e.id === excuseId ? updatedExcuse : e));

      // If approved, update attendance record
      if (status === 'approved') {
        const existingRecord = records.find(
          record => record.sessionId === excuse.sessionId && record.studentAddress === excuse.studentAddress
        );

        if (existingRecord) {
          // Update existing record
          setRecords(prev => prev.map(record => 
            record.id === existingRecord.id 
              ? { ...record, status: 'excused' as const }
              : record
          ));
        } else {
          // Create new excused record
          const excusedRecord: AttendanceRecord = {
            id: 'excused-record-' + Date.now(),
            sessionId: excuse.sessionId,
            studentAddress: excuse.studentAddress,
            timestamp: excuse.submissionTime,
            transactionId: 'excused-tx-' + Date.now(),
            verified: true,
            status: 'excused',
            locationVerified: false,
            distanceFromClass: 0,
            checkInAttempts: 0
          };

          setRecords(prev => [...prev, excusedRecord]);
        }
      }

      return { excuse: updatedExcuse };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to review excuse';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [excuses, sessions, records]);

  const calculateExamEligibility = useCallback((studentAddress: string, courseCode: string): ExamEligibility => {
    const courseSessions = sessions.filter(s => s.courseCode === courseCode);
    const studentRecords = records.filter(r => 
      r.studentAddress === studentAddress && 
      courseSessions.some(s => s.id === r.sessionId)
    );

    const totalSessions = courseSessions.length;
    const attendedSessions = studentRecords.filter(r => 
      r.status === 'present' || r.status === 'late' || r.status === 'excused'
    ).length;

    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    const requiredPercentage = 75; // 75% attendance requirement

    const isEligible = attendancePercentage >= requiredPercentage;
    const sessionsNeeded = Math.max(0, Math.ceil((requiredPercentage / 100) * totalSessions) - attendedSessions);

    let status: 'eligible' | 'not-eligible' | 'at-risk';
    if (isEligible) {
      status = 'eligible';
    } else if (attendancePercentage >= requiredPercentage * 0.8) {
      status = 'at-risk';
    } else {
      status = 'not-eligible';
    }

    return {
      studentAddress,
      courseCode,
      totalSessions,
      attendedSessions,
      attendancePercentage,
      requiredPercentage,
      isEligible,
      status,
      sessionsNeeded: sessionsNeeded > 0 ? sessionsNeeded : undefined,
      lastCalculated: new Date()
    };
  }, [sessions, records]);

  const getCourseAttendanceSummary = useCallback((studentAddress: string): CourseAttendanceSummary[] => {
    const uniqueCourses = [...new Set(sessions.map(s => s.courseCode))];
    
    return uniqueCourses.map(courseCode => {
      const courseSessions = sessions.filter(s => s.courseCode === courseCode);
      const courseSession = courseSessions[0]; // Get course name from first session
      
      const studentRecords = records.filter(r => 
        r.studentAddress === studentAddress && 
        courseSessions.some(s => s.id === r.sessionId)
      );

      const attendedSessions = studentRecords.filter(r => 
        r.status === 'present' || r.status === 'late'
      ).length;

      const excusedSessions = studentRecords.filter(r => 
        r.status === 'excused'
      ).length;

      const totalSessions = courseSessions.length;
      const missedSessions = totalSessions - attendedSessions - excusedSessions;
      const attendancePercentage = totalSessions > 0 
        ? ((attendedSessions + excusedSessions) / totalSessions) * 100 
        : 0;

      const examEligibility = calculateExamEligibility(studentAddress, courseCode);

      return {
        courseCode,
        courseName: courseSession?.courseName || 'Unknown Course',
        totalSessions,
        attendedSessions,
        excusedSessions,
        missedSessions,
        attendancePercentage,
        examEligibility
      };
    });
  }, [sessions, records, calculateExamEligibility]);

  const getSessionRecords = useCallback((sessionId: string) => {
    return records.filter(record => record.sessionId === sessionId);
  }, [records]);

  const getStudentAttendanceHistory = useCallback((studentAddress: string) => {
    return records.filter(record => record.studentAddress === studentAddress);
  }, [records]);

  const getSessionExcuses = useCallback((sessionId: string) => {
    return excuses.filter(excuse => excuse.sessionId === sessionId);
  }, [excuses]);

  const getStudentExcuses = useCallback((studentAddress: string) => {
    return excuses.filter(excuse => excuse.studentAddress === studentAddress);
  }, [excuses]);

  const canSubmitExcuse = useCallback((sessionId: string, studentAddress: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return false;

    const now = new Date();
    const excuseDeadline = new Date(session.endTime.getTime() + (session.excuseDeadlineHours * 60 * 60 * 1000));
    const isWithinDeadline = now <= excuseDeadline;

    const hasAttended = records.some(
      record => record.sessionId === sessionId && record.studentAddress === studentAddress && record.status !== 'absent'
    );

    const hasExcuse = excuses.some(
      excuse => excuse.sessionId === sessionId && excuse.studentAddress === studentAddress
    );

    return isWithinDeadline && !hasAttended && !hasExcuse && now > session.endTime;
  }, [sessions, records, excuses]);

  return {
    sessions,
    records,
    excuses,
    isLoading,
    error,
    createSession,
    recordAttendance,
    submitExcuse,
    reviewExcuse,
    getSessionRecords,
    getStudentAttendanceHistory,
    getSessionExcuses,
    getStudentExcuses,
    canSubmitExcuse,
    calculateExamEligibility,
    getCourseAttendanceSummary,
    clearError: () => setError(null)
  };
};