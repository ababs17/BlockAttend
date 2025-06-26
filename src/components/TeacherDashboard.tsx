import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp,
  Filter,
  Download,
  MapPin,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceSession, AttendanceRecord, ExcuseSubmission, CourseAttendanceSummary, UserProfile } from '../types';
import { CreateSession } from './CreateSession';
import { LiveSessionMonitor } from './LiveSessionMonitor';
import { TeacherAttendanceRecords } from './TeacherAttendanceRecords';
import { TeacherExcuseManagement } from './TeacherExcuseManagement';

interface TeacherDashboardProps {
  account: string;
  userProfile: UserProfile;
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  excuses: ExcuseSubmission[];
  courseSummaries: CourseAttendanceSummary[];
  getSessionRecords: (sessionId: string) => AttendanceRecord[];
  getSessionExcuses: (sessionId: string) => ExcuseSubmission[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  account,
  userProfile,
  sessions,
  records,
  excuses,
  courseSummaries,
  getSessionRecords,
  getSessionExcuses
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check geolocation permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Filter sessions by teacher
  const teacherSessions = sessions.filter(session => session.createdBy === account);

  // Get active sessions (currently running)
  const activeSessions = teacherSessions.filter(session => {
    const now = new Date();
    return session.isActive && now >= session.startTime && now <= session.endTime;
  });

  // Get upcoming sessions
  const upcomingSessions = teacherSessions.filter(session => {
    const now = new Date();
    return session.isActive && now < session.startTime;
  });

  // Get unique courses
  const uniqueCourses = [...new Set(teacherSessions.map(s => s.courseCode))];

  // Filter sessions based on selected filters
  const filteredSessions = teacherSessions.filter(session => {
    const courseMatch = selectedCourse === 'all' || session.courseCode === selectedCourse;
    const dateMatch = !selectedDate || format(session.startTime, 'yyyy-MM-dd') === selectedDate;
    return courseMatch && dateMatch;
  });

  // Calculate overall stats
  const totalSessions = teacherSessions.length;
  const totalAttendees = records.filter(r => 
    teacherSessions.some(s => s.id === r.sessionId)
  ).length;
  const pendingExcuses = excuses.filter(e => e.approvalStatus === 'pending').length;
  const averageAttendance = teacherSessions.length > 0 
    ? teacherSessions.reduce((acc, session) => acc + session.attendeeCount, 0) / teacherSessions.length 
    : 0;

  const exportSessionData = (sessionId: string) => {
    const session = teacherSessions.find(s => s.id === sessionId);
    const sessionRecords = getSessionRecords(sessionId);
    
    if (!session) return;

    const csvData = [
      ['Student Address', 'Status', 'Timestamp', 'Distance (m)', 'Verified', 'Transaction ID'],
      ...sessionRecords.map(record => [
        record.studentAddress,
        record.status,
        format(record.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        record.distanceFromClass.toString(),
        record.verified ? 'Yes' : 'No',
        record.transactionId
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.courseCode}_${format(session.startTime, 'yyyy-MM-dd')}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
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
          
          <CreateSession />
        </div>

        {/* Security Alert */}
        {locationPermission !== 'granted' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Geolocation permissions are required to declare class sessions
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Please enable location access in your browser settings to ensure accurate GPS verification.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Total Sessions</span>
            </div>
            <div className="text-2xl font-semibold text-black">{totalSessions}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Total Attendees</span>
            </div>
            <div className="text-2xl font-semibold text-blue-600">{totalAttendees}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">Avg Attendance</span>
            </div>
            <div className="text-2xl font-semibold text-green-600">{averageAttendance.toFixed(1)}</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Pending Excuses</span>
            </div>
            <div className="text-2xl font-semibold text-orange-600">{pendingExcuses}</div>
          </div>
        </div>
      </div>

      {/* Live Session Monitoring */}
      {activeSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold text-black">Live Session Monitoring</h2>
          </div>
          
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <LiveSessionMonitor
                key={session.id}
                session={session}
                records={getSessionRecords(session.id)}
                onExportCSV={() => exportSessionData(session.id)}
                currentTime={currentTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Filter by:</span>
        </div>
        
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input text-sm"
        >
          <option value="all">All Courses</option>
          {uniqueCourses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
        
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input text-sm"
        />
        
        <button
          onClick={() => {
            setSelectedCourse('all');
            setSelectedDate('');
          }}
          className="btn-secondary text-sm"
        >
          Clear Filters
        </button>
      </div>

      {/* Declared Sessions Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">Declared Sessions</h2>
          <span className="text-sm text-gray-500">
            {filteredSessions.length} of {totalSessions} sessions
          </span>
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-black mb-1">
              {totalSessions === 0 ? 'No sessions declared yet' : 'No sessions match your filters'}
            </h3>
            <p className="text-gray-500 text-sm">
              {totalSessions === 0 
                ? 'Declare your first class session to get started'
                : 'Try adjusting your filters to see more sessions'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSessions.map((session) => {
              const sessionRecords = getSessionRecords(session.id);
              const now = new Date();
              const isActive = now >= session.startTime && now <= session.endTime;
              const isPast = now > session.endTime;
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        isActive ? 'bg-green-50 border-green-200' :
                        isPast ? 'bg-gray-50 border-gray-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        {isActive ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        ) : isPast ? (
                          <CheckCircle size={16} className="text-gray-600" />
                        ) : (
                          <Clock size={16} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-black">
                          {session.courseCode} - {session.courseName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {format(session.startTime, 'MMM dd, yyyy • HH:mm')} - {format(session.endTime, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-black">
                          {sessionRecords.length}
                        </div>
                        <div className="text-xs text-gray-500">attendees</div>
                      </div>
                      
                      <button
                        onClick={() => exportSessionData(session.id)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                        title="Export CSV"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{session.location.address || 'GPS Location Set'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield size={12} />
                      <span>{session.allowedRadius}m radius</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{session.checkInWindow}min window</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-black mb-4">Upcoming Sessions</h2>
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
                  <div className="text-sm text-gray-600">
                    {format(session.startTime, 'MMM dd')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <TeacherAttendanceRecords 
        sessions={teacherSessions}
        records={records}
        getSessionRecords={getSessionRecords}
      />

      {/* Course Overview */}
      {courseSummaries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-black" />
            <h2 className="text-xl font-semibold text-black">Course Overview</h2>
          </div>
          
          <div className="grid gap-4">
            {courseSummaries.map((course) => (
              <motion.div
                key={course.courseCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-black">
                      {course.courseCode} - {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {course.totalSessions} sessions declared
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-black">
                      {course.attendancePercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">avg attendance</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {course.attendedSessions}
                    </div>
                    <div className="text-xs text-green-600">Present</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {course.excusedSessions}
                    </div>
                    <div className="text-xs text-blue-600">Excused</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {course.missedSessions}
                    </div>
                    <div className="text-xs text-red-600">Missed</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Excuse Management */}
      <TeacherExcuseManagement 
        excuses={excuses}
        sessions={teacherSessions}
        getSessionExcuses={getSessionExcuses}
      />

      {/* Blockchain Verification Footer */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield size={16} className="text-black" />
          <span className="font-medium">Blockchain-Verified System</span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          All session declarations and attendance records are immutably stored on the Algorand blockchain
        </p>
      </div>
    </div>
  );
};