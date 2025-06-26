import { useState, useCallback, useEffect } from 'react';
import { supabaseAttendanceService } from '../services/supabase/attendance';
import { walletService } from '../services/wallet';
import { locationService } from '../services/location';
import { verificationService } from '../services/verification';
import { AttendanceSession, AttendanceRecord, ExcuseSubmission, ExamEligibility, CourseAttendanceSummary } from '../types';

export const useSupabaseAttendance = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<ExcuseSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const account = walletService.getConnectedAccount();
      const [sessionsData, recordsData, excusesData] = await Promise.all([
        supabaseAttendanceService.getSessions(account || undefined),
        supabaseAttendanceService.getAttendanceRecords(account || undefined),
        supabaseAttendanceService.getExcuseSubmissions(account || undefined)
      ]);

      setSessions(sessionsData);
      setRecords(recordsData);
      setExcuses(excusesData);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const createSession = useCallback(async (sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      const newSession = await supabaseAttendanceService.createSession(sessionData, account);
      setSessions(prev => [newSession, ...prev]);
      
      return { session: newSession, transactionId: 'session-tx-' + Date.now() };
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

      const mockTxId = 'attendance-tx-' + Date.now();
      
      const newRecord: Omit<AttendanceRecord, 'id'> = {
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

      const createdRecord = await supabaseAttendanceService.recordAttendance(newRecord, account);
      setRecords(prev => [createdRecord, ...prev]);
      
      // Update session attendee count locally
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, attendeeCount: session.attendeeCount + 1 }
          : session
      ));

      return { record: createdRecord, transactionId: mockTxId };
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

      const mockTxId = 'excuse-tx-' + Date.now();
      
      const newExcuse: Omit<ExcuseSubmission, 'id'> = {
        sessionId,
        studentAddress: account,
        reason: reason.trim(),
        submissionTime: now,
        approvalStatus: 'pending',
        transactionId: mockTxId,
        isWithinDeadline
      };

      const createdExcuse = await supabaseAttendanceService.submitExcuse(newExcuse, account);
      setExcuses(prev => [createdExcuse, ...prev]);

      return { excuse: createdExcuse, transactionId: mockTxId };
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

      const updatedExcuse = await supabaseAttendanceService.reviewExcuse(excuseId, status, reviewNotes, account);
      setExcuses(prev => prev.map(e => e.id === excuseId ? updatedExcuse : e));

      // Reload records to get updated attendance status
      await loadData();

      return { excuse: updatedExcuse };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to review excuse';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    loadData,
    clearError: () => setError(null)
  };
};