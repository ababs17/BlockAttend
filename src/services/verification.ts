import { AttendanceSession, AttendanceRecord, VeracityCheck } from '../types';
import { locationService } from './location';

class VerificationService {
  /**
   * Comprehensive veracity check for student attendance
   */
  async performVeracityCheck(
    session: AttendanceSession,
    studentAddress: string,
    studentLocation: { latitude: number; longitude: number },
    existingRecords: AttendanceRecord[]
  ): Promise<VeracityCheck> {
    const errors: string[] = [];
    let locationMatch = false;
    let timeWindow = false;
    let noDuplicates = false;
    let walletVerified = false;

    // 1. Location Verification
    const locationCheck = locationService.verifyLocationProximity(
      studentLocation.latitude,
      studentLocation.longitude,
      session.location.latitude,
      session.location.longitude,
      session.allowedRadius
    );

    if (locationCheck.isValid) {
      locationMatch = true;
    } else {
      errors.push(`You are ${locationCheck.distance}m away from class location. Maximum allowed distance is ${session.allowedRadius}m.`);
    }

    // 2. Time Window Verification
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const checkInDeadline = new Date(sessionStart.getTime() + (session.checkInWindow * 60 * 1000));

    if (now >= sessionStart && now <= checkInDeadline) {
      timeWindow = true;
    } else if (now < sessionStart) {
      errors.push(`Class hasn't started yet. Check-in opens at ${sessionStart.toLocaleTimeString()}.`);
    } else {
      errors.push(`Check-in window closed. You had ${session.checkInWindow} minutes from ${sessionStart.toLocaleTimeString()}.`);
    }

    // 3. Duplicate Check-in Prevention
    const existingRecord = existingRecords.find(
      record => record.sessionId === session.id && record.studentAddress === studentAddress
    );

    if (!existingRecord) {
      noDuplicates = true;
    } else {
      errors.push('You have already checked in for this session.');
    }

    // 4. Wallet Verification (simplified - in production would check against verified addresses)
    if (studentAddress && studentAddress.length === 58) { // Basic Algorand address validation
      walletVerified = true;
    } else {
      errors.push('Invalid wallet address.');
    }

    const overallValid = locationMatch && timeWindow && noDuplicates && walletVerified;

    return {
      locationMatch,
      timeWindow,
      noDuplicates,
      walletVerified,
      overallValid,
      errors
    };
  }

  /**
   * Verify checker authorization (simplified implementation)
   */
  verifyChecker(checkerAddress: string): boolean {
    // In production, this would check against a registry of verified educators
    // For demo purposes, we'll assume all connected wallets are verified
    return checkerAddress && checkerAddress.length === 58;
  }

  /**
   * Generate attendance status based on check-in time
   */
  determineAttendanceStatus(
    checkInTime: Date,
    sessionStart: Date,
    lateThresholdMinutes: number = 5
  ): 'present' | 'late' | 'absent' {
    const timeDiff = (checkInTime.getTime() - sessionStart.getTime()) / (1000 * 60);
    
    if (timeDiff <= lateThresholdMinutes) {
      return 'present';
    } else {
      return 'late';
    }
  }
}

export const verificationService = new VerificationService();