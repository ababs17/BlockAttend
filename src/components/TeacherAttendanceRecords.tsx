import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  User, 
  Calendar, 
  Filter,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceSession, AttendanceRecord } from '../types';

interface TeacherAttendanceRecordsProps {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  getSessionRecords: (sessionId: string) => AttendanceRecord[];
}

export const TeacherAttendanceRecords: React.FC<TeacherAttendanceRecordsProps> = ({
  sessions,
  records,
  getSessionRecords
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'session' | 'student'>('session');

  // Get unique students
  const uniqueStudents = [...new Set(records.map(r => r.studentAddress))];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'late':
        return <AlertTriangle size={14} className="text-orange-600" />;
      case 'excused':
        return <CheckCircle size={14} className="text-blue-600" />;
      default:
        return <XCircle size={14} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'late':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'excused':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: AttendanceRecord['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSessionInfo = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const getStudentAttendanceRate = (studentAddress: string) => {
    const studentRecords = records.filter(r => r.studentAddress === studentAddress);
    const attendedRecords = studentRecords.filter(r => 
      r.status === 'present' || r.status === 'late' || r.status === 'excused'
    );
    return studentRecords.length > 0 ? (attendedRecords.length / sessions.length) * 100 : 0;
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const studentMatch = selectedStudent === 'all' || record.studentAddress === selectedStudent;
    const sessionMatch = selectedSession === 'all' || record.sessionId === selectedSession;
    return studentMatch && sessionMatch;
  });

  if (records.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">Attendance Records</h2>
        <div className="card p-8 text-center">
          <History size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-black mb-1">No attendance records yet</h3>
          <p className="text-gray-500 text-sm">Records will appear here once students mark attendance</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-black" />
        <h2 className="text-xl font-semibold text-black">Attendance Records</h2>
        <span className="text-sm text-gray-500">({filteredRecords.length} records)</span>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('session')}
            className={`px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
              viewMode === 'session'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            By Session
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
              viewMode === 'student'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            By Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>
        </div>
        
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="input text-sm"
        >
          <option value="all">All Students</option>
          {uniqueStudents.map(student => (
            <option key={student} value={student}>{formatAddress(student)}</option>
          ))}
        </select>
        
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="input text-sm"
        >
          <option value="all">All Sessions</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.courseCode} - {format(session.startTime, 'MMM dd')}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => {
            setSelectedStudent('all');
            setSelectedSession('all');
          }}
          className="btn-secondary text-sm"
        >
          Clear
        </button>
      </div>

      {viewMode === 'student' ? (
        /* Student View */
        <div className="space-y-4">
          {uniqueStudents.map((studentAddress) => {
            const studentRecords = filteredRecords.filter(r => r.studentAddress === studentAddress);
            const attendanceRate = getStudentAttendanceRate(studentAddress);
            
            if (studentRecords.length === 0) return null;
            
            return (
              <motion.div
                key={studentAddress}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-black">
                          {formatAddress(studentAddress)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {studentRecords.length} attendance records
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-black">
                        {attendanceRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">attendance rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {studentRecords.map((record) => {
                    const session = getSessionInfo(record.sessionId);
                    
                    return (
                      <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                              {getStatusIcon(record.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-black">
                                  {session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session'}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                  {getStatusText(record.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{format(record.timestamp, 'MMM dd, yyyy at HH:mm')}</span>
                                {record.locationVerified && (
                                  <span>{record.distanceFromClass}m from class</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openTransaction(record.transactionId)}
                            className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span className="hidden sm:inline">View TX</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Session View */
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((record, index) => {
              const session = getSessionInfo(record.sessionId);
              
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-black">
                            {formatAddress(record.studentAddress)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session'}
                          </span>
                          <span>{format(record.timestamp, 'MMM dd, yyyy at HH:mm')}</span>
                          {record.locationVerified && (
                            <span>{record.distanceFromClass}m from class</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openTransaction(record.transactionId)}
                      className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">View TX</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};