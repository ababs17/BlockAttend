import { useState, useEffect } from 'react';
import { attendanceService } from '../services/supabase/attendance';
import type { AttendanceSession, AttendanceRecord, ExcuseSubmission } from '../types';

export const useSupabaseAttendance = (userAddress?: string) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [excuseSubmissions, setExcuseSubmissions] = useState<ExcuseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set user context
      await attendanceService.setUserContext(userAddress);

      // Load data in parallel with error handling for each
      const [sessionsResult, excusesResult] = await Promise.allSettled([
        attendanceService.getSessions(),
        attendanceService.getExcuseSubmissions()
      ]);

      // Handle sessions result
      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value);
      } else {
        console.error('Failed to load sessions:', sessionsResult.reason);
        setSessions([]);
      }

      // Handle excuses result
      if (excusesResult.status === 'fulfilled') {
        setExcuseSubmissions(excusesResult.value);
      } else {
        console.error('Failed to load excuse submissions:', excusesResult.reason);
        setExcuseSubmissions([]);
      }

    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userAddress]);

  const createSession = async (sessionData: Omit<AttendanceSession, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSession = await attendanceService.createSession(sessionData);
      if (newSession) {
        setSessions(prev => [newSession, ...prev]);
        return newSession;
      }
      return null;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  };

  const updateSession = async (id: string, updates: Partial<AttendanceSession>) => {
    try {
      const updatedSession = await attendanceService.updateSession(id, updates);
      if (updatedSession) {
        setSessions(prev => prev.map(s => s.id === id ? updatedSession : s));
        return updatedSession;
      }
      return null;
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to update session');
      return null;
    }
  };

  const loadAttendanceRecords = async (sessionId: string) => {
    try {
      const records = await attendanceService.getAttendanceRecords(sessionId);
      setAttendanceRecords(records);
      return records;
    } catch (err) {
      console.error('Error loading attendance records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
      return [];
    }
  };

  const createAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRecord = await attendanceService.createAttendanceRecord(recordData);
      if (newRecord) {
        setAttendanceRecords(prev => [newRecord, ...prev]);
        return newRecord;
      }
      return null;
    } catch (err) {
      console.error('Error creating attendance record:', err);
      setError(err instanceof Error ? err.message : 'Failed to create attendance record');
      return null;
    }
  };

  const createExcuseSubmission = async (excuseData: Omit<ExcuseSubmission, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newExcuse = await attendanceService.createExcuseSubmission(excuseData);
      if (newExcuse) {
        setExcuseSubmissions(prev => [newExcuse, ...prev]);
        return newExcuse;
      }
      return null;
    } catch (err) {
      console.error('Error creating excuse submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to create excuse submission');
      return null;
    }
  };

  const updateExcuseSubmission = async (id: string, updates: Partial<ExcuseSubmission>) => {
    try {
      const updatedExcuse = await attendanceService.updateExcuseSubmission(id, updates);
      if (updatedExcuse) {
        setExcuseSubmissions(prev => prev.map(e => e.id === id ? updatedExcuse : e));
        return updatedExcuse;
      }
      return null;
    } catch (err) {
      console.error('Error updating excuse submission:', err);
      setError(err instanceof Error ? err.message : 'Failed to update excuse submission');
      return null;
    }
  };

  const refresh = () => {
    loadData();
  };

  return {
    sessions,
    attendanceRecords,
    excuseSubmissions,
    loading,
    error,
    createSession,
    updateSession,
    loadAttendanceRecords,
    createAttendanceRecord,
    createExcuseSubmission,
    updateExcuseSubmission,
    refresh
  };
};