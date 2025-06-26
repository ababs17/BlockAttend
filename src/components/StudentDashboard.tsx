import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  FileText,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceSession, AttendanceRecord, ExcuseSubmission, CourseAttendanceSummary, UserProfile } from '../types';
import { LiveAttendanceCheckIn } from './LiveAttendanceCheckIn';
import { StudentAttendanceHistory } from './StudentAttendanceHistory';
import { StudentExcuseSubmission } from './StudentExcuseSubmission';

interface StudentDashboardProps {
  account: string;
  userProfile: UserProfile;
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  excuses: ExcuseSubmission[];
  courseSummaries: CourseAttendanceSummary[];
  onMarkAttendance: (sessionId: string) => Promise<void>;
  hasAttended: (sessionId: string, studentAddress: string) => boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  account,
  userProfile,
  sessions,
  records,
  excuses,
  courseSummaries,
  onMarkAttendance,
  hasAttended
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get active sessions (can check in now)
  const activeSessions = sessions.filter(session => {
    const now = new Date();
    const checkInDeadline = new Date(session.startTime.getTime() + (session.checkInWindow * 60 * 1000));
    return session.isActive && now >= session.startTime && now <= checkInDeadline && !hasAttended(session.id, account);
  });

  // Get upcoming sessions
  const upcomingSessions = sessions.filter(session => {
    const now = new Date();
    return session.isActive && now < session.startTime;
  });

  // Get recent sessions (last 7 days)
  const recentSessions = sessions.filter(session => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return session.startTime >= sevenDaysAgo && session.startTime <= now;
  });

  // Calculate overall stats
  const totalSessions = sessions.length;
  const attendedSessions = records.filter(r => r.studentAddress === account && (r.status === 'present' || r.status === 'late' || r.status === 'excused')).length;
  const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  const eligibleCourses = courseSummaries.filter(c => c.examEligibility.isEligible).length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-full border border-gray-200">
            <User size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-black">
              Welcome back, {userProfile.name}
            </h1>
            <p className="text-gray-600">
              {format(currentTime, 'EEEE, MMMM do, yyyy • HH:mm')}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Total Classes</span>
            </div>
            <div className="text-2xl font-semibold text-black">{totalSessions}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">Attended</span>
            </div>
            <div className="text-2xl font-semibold text-green-600">{attendedSessions}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Attendance</span>
            </div>
            <div className="text-2xl font-semibold text-blue-600">{attendancePercentage.toFixed(1)}%</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Eligible</span>
            </div>
            <div className="text-2xl font-semibold text-purple-600">
              {eligibleCourses}/{courseSummaries.length}
            </div>
          </div>
        </div>
      </div>

      {/* Live Check-In Section */}
      {activeSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-black" />
            <h2 className="text-xl font-semibold text-black">Live Check-In</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <LiveAttendanceCheckIn
                key={session.id}
                session={session}
                onMarkAttendance={onMarkAttendance}
                currentTime={currentTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Recent Classes</h2>
          <span className="text-sm text-gray-500">{recentSessions.length} classes this week</span>
        </div>
        
        {recentSessions.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-black mb-1">No recent classes</h3>
            <p className="text-gray-500 text-sm">Classes from the past week will appear here</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentSessions.map((session) => {
              const attended = hasAttended(session.id, account);
              const now = new Date();
              const isPast = now > session.endTime;
              const canCheckIn = now >= session.startTime && now <= new Date(session.startTime.getTime() + (session.checkInWindow * 60 * 1000));
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        attended ? 'bg-green-50 border border-green-200' : 
                        canCheckIn ? 'bg-orange-50 border border-orange-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        {attended ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : canCheckIn ? (
                          <Clock size={16} className="text-orange-600" />
                        ) : (
                          <XCircle size={16} className="text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-black">
                          {session.courseCode} - {session.courseName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {format(session.startTime, 'MMM dd • HH:mm')} - {format(session.endTime, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attended ? 'bg-green-50 text-green-700 border border-green-200' :
                        canCheckIn ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        isPast ? 'bg-gray-50 text-gray-700 border border-gray-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {attended ? 'Attended' : canCheckIn ? 'Check-in Open' : isPast ? 'Ended' : 'Upcoming'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Classes */}
      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-black mb-4">Upcoming Classes</h2>
          <div className="grid gap-3">
            {upcomingSessions.slice(0, 3).map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">
                        {session.courseCode} - {session.courseName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(session.startTime, 'MMM dd • HH:mm')} - {format(session.endTime, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {format(session.startTime, 'MMM dd')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Eligibility Status */}
      {courseSummaries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-black" />
            <h2 className="text-xl font-semibold text-black">Exam Eligibility Status</h2>
          </div>
          
          <div className="grid gap-4">
            {courseSummaries.map((course) => (
              <motion.div
                key={course.courseCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card p-4 border-l-4 ${
                  course.examEligibility.status === 'eligible' ? 'border-l-green-500' :
                  course.examEligibility.status === 'at-risk' ? 'border-l-orange-500' :
                  'border-l-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-black">
                      {course.courseCode} - {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {course.attendedSessions + course.excusedSessions} of {course.totalSessions} classes attended
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-black">
                      {course.attendancePercentage.toFixed(1)}%
                    </div>
                    <div className={`text-xs font-medium ${
                      course.examEligibility.status === 'eligible' ? 'text-green-600' :
                      course.examEligibility.status === 'at-risk' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {course.examEligibility.status === 'eligible' ? 'Eligible' :
                       course.examEligibility.status === 'at-risk' ? 'At Risk' : 'Not Eligible'}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        course.examEligibility.status === 'eligible' ? 'bg-green-500' :
                        course.examEligibility.status === 'at-risk' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(course.attendancePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                {course.examEligibility.sessionsNeeded && course.examEligibility.sessionsNeeded > 0 && (
                  <p className="text-sm text-gray-600">
                    Need {course.examEligibility.sessionsNeeded} more session{course.examEligibility.sessionsNeeded > 1 ? 's' : ''} to become eligible
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <StudentAttendanceHistory 
        records={records.filter(r => r.studentAddress === account)}
        sessions={sessions}
      />

      {/* Excuse Management */}
      <StudentExcuseSubmission 
        excuses={excuses}
        sessions={sessions}
        account={account}
      />

      {/* Blockchain Verification Footer */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield size={16} className="text-black" />
          <span className="font-medium">Blockchain-Verified Data</span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          All attendance records are immutably stored on the Algorand blockchain with GPS verification
        </p>
      </div>
    </div>
  );
};