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
  const [isTestNet, setIsTestNet] = useState(true);

  // Load data from blockchain on mount
  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      const account = walletService.getConnectedAccount();
      if (!account) return;

      setIsLoading(true);
      
      // Get transactions from blockchain
      const transactions = await algorandService.getTransactionsByAddress(account);
      
      // Parse transactions to extract sessions, records, and excuses
      const parsedSessions: AttendanceSession[] = [];
      const parsedRecords: AttendanceRecord[] = [];
      const parsedExcuses: ExcuseSubmission[] = [];

      for (const tx of transactions) {
        if (tx.note) {
          const noteData = algorandService.parseTransactionNote(tx.note);
          if (noteData) {
            switch (noteData.type) {
              case 'DECLARE_CLASS_SESSION':
                parsedSessions.push({
                  id: tx.id,
                  courseCode: noteData.courseCode,
                  courseName: noteData.courseName,
                  description: noteData.description,
                  startTime: new Date(noteData.startTime),
                  endTime: new Date(noteData.endTime),
                  isActive: noteData.isActive,
                  createdBy: noteData.checkerAddress,
                  attendeeCount: 0, // Will be calculated
                  location: noteData.location,
                  declarationTime: new Date(noteData.declarationTime),
                  allowedRadius: noteData.allowedRadius || 50,
                  checkInWindow: noteData.checkInWindow || 10,
                  verifiedChecker: true,
                  excuseDeadlineHours: noteData.excuseDeadlineHours || 48
                });
                break;
              
              case 'RECORD_ATTENDANCE':
                parsedRecords.push({
                  id: tx.id,
                  sessionId: noteData.sessionId,
                  studentAddress: noteData.studentAddress,
                  timestamp: new Date(noteData.timestamp),
                  transactionId: tx.id,
                  verified: true,
                  status: 'present', // Will be determined by timing
                  location: noteData.studentLocation,
                  locationVerified: true,
                  distanceFromClass: 0, // Will be calculated
                  checkInAttempts: 1
                });
                break;
              
              case 'SUBMIT_EXCUSE':
                parsedExcuses.push({
                  id: tx.id,
                  sessionId: noteData.sessionId,
                  studentAddress: noteData.studentAddress,
                  reason: noteData.reason,
                  submissionTime: new Date(noteData.timestamp),
                  approvalStatus: 'pending',
                  transactionId: tx.id,
                  isWithinDeadline: true // Will be calculated
                });
                break;
            }
          }
        }
      }

      setSessions(parsedSessions);
      setRecords(parsedRecords);
      setExcuses(parsedExcuses);

    } catch (error) {
      console.error('Error loading blockchain data:', error);
      // Fall back to demo data if blockchain loading fails
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    // Keep existing demo data as fallback
    const demoSessions: AttendanceSession[] = [
      {
        id: 'demo-1',
        courseCode: 'CS101',
        courseName: 'Computer Science 101',
        description: 'Introduction to Programming',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 90 * 60 * 1000),
        isActive: true,
        createdBy: 'demo-teacher',
        attendeeCount: 3,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Computer Science Building, Room 101, New York, NY'
        },
        declarationTime: new Date(Date.now() - 45 * 60 * 1000),
        allowedRadius: 50,
        checkInWindow: 10,
        verifiedChecker: true,
        excuseDeadlineHours: 48
      }
    ];

    setSessions(demoSessions);
    setRecords([]);
    setExcuses([]);
  };

  const createSession = useCallback(async (sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const account = walletService.getConnectedAccount();
      if (!account) {
        throw new Error('No wallet connected');
      }

      // Check account balance
      const hasSufficientBalance = await algorandService.checkSufficientBalance(account);
      if (!hasSufficientBalance) {
        throw new Error('Insufficient ALGO balance. You need at least 0.002 ALGO to create a session.');
      }

      // Verify checker authorization
      const isVerifiedChecker = verificationService.verifyChecker(account);
      if (!isVerifiedChecker) {
        throw new Error('Only verified checkers can declare class sessions');
      }

      // Create transaction
      const txn = await algorandService.createAttendanceSession(account, sessionData);
      
      // Sign and submit transaction
      const signedTxn = await walletService.signTransaction(txn);
      const txId = await algorandService.submitTransaction(signedTxn);

      // Create session object
      const newSession: AttendanceSession = {
        ...sessionData,
        id: txId,
        attendeeCount: 0,
        createdBy: account,
        verifiedChecker: isVerifiedChecker
      };

      setSessions(prev => [...prev, newSession]);
      
      return { session: newSession, transactionId: txId };
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

      // Check account balance
      const hasSufficientBalance = await algorandService.checkSufficientBalance(account);
      if (!hasSufficientBalance) {
        throw new Error('Insufficient ALGO balance. You need at least 0.002 ALGO to record attendance.');
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

      // Create and submit transaction
      const txn = await algorandService.recordAttendance(
        account,
        sessionId,
        studentLocation,
        session.createdBy
      );
      
      const signedTxn = await walletService.signTransaction(txn);
      const txId = await algorandService.submitTransaction(signedTxn);
      
      const newRecord: AttendanceRecord = {
        id: txId,
        sessionId,
        studentAddress: account,
        timestamp: new Date(),
        transactionId: txId,
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

      return { record: newRecord, transactionId: txId };
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

      // Check account balance
      const hasSufficientBalance = await algorandService.checkSufficientBalance(account);
      if (!hasSufficientBalance) {
        throw new Error('Insufficient ALGO balance. You need at least 0.002 ALGO to submit an excuse.');
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

      // Create and submit transaction
      const txn = await algorandService.submitExcuse(
        account,
        sessionId,
        reason,
        session.createdBy
      );
      
      const signedTxn = await walletService.signTransaction(txn);
      const txId = await algorandService.submitTransaction(signedTxn);
      
      const newExcuse: ExcuseSubmission = {
        id: txId,
        sessionId,
        studentAddress: account,
        reason: reason.trim(),
        submissionTime: now,
        approvalStatus: 'pending',
        transactionId: txId,
        isWithinDeadline
      };

      setExcuses(prev => [...prev, newExcuse]);

      return { excuse: newExcuse, transactionId: txId };
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

      // Check account balance
      const hasSufficientBalance = await algorandService.checkSufficientBalance(account);
      if (!hasSufficientBalance) {
        throw new Error('Insufficient ALGO balance. You need at least 0.002 ALGO to review an excuse.');
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

      // Create and submit transaction
      const txn = await algorandService.reviewExcuse(
        account,
        excuseId,
        status,
        reviewNotes
      );
      
      const signedTxn = await walletService.signTransaction(txn);
      const txId = await algorandService.submitTransaction(signedTxn);

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
          setRecords(prev => prev.map(record => 
            record.id === existingRecord.id 
              ? { ...record, status: 'excused' as const }
              : record
          ));
        } else {
          const excusedRecord: AttendanceRecord = {
            id: 'excused-record-' + Date.now(),
            sessionId: excuse.sessionId,
            studentAddress: excuse.studentAddress,
            timestamp: excuse.submissionTime,
            transactionId: txId,
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
    const requiredPercentage = 75;

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
      const courseSession = courseSessions[0];
      
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
    isTestNet,
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
    loadBlockchainData,
    clearError: () => setError(null)
  };
};