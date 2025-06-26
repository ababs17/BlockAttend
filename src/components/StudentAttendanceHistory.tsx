import React from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  MapPin,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceRecord, AttendanceSession } from '../types';

interface StudentAttendanceHistoryProps {
  records: AttendanceRecord[];
  sessions: AttendanceSession[];
}

export const StudentAttendanceHistory: React.FC<StudentAttendanceHistoryProps> = ({
  records,
  sessions
}) => {
  const getSessionInfo = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'late':
        return <AlertTriangle size={16} className="text-orange-600" />;
      case 'excused':
        return <Clock size={16} className="text-blue-600" />;
      default:
        return <XCircle size={16} className="text-gray-600" />;
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

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

  if (records.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">Attendance History</h2>
        <div className="card p-8 text-center">
          <History size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-black mb-1">No attendance records yet</h3>
          <p className="text-gray-500 text-sm">Your attendance history will appear here</p>
        </div>
      </div>
    );
  }

  // Sort records by timestamp (most recent first)
  const sortedRecords = [...records].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-black" />
        <h2 className="text-xl font-semibold text-black">Attendance History</h2>
        <span className="text-sm text-gray-500">({records.length} records)</span>
      </div>
      
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {sortedRecords.map((record, index) => {
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
                        <h3 className="font-medium text-black">
                          {session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{format(record.timestamp, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{format(record.timestamp, 'HH:mm')}</span>
                        </div>
                        {record.location && record.locationVerified && (
                          <div className="flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{record.distanceFromClass}m from class</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => openTransaction(record.transactionId)}
                    className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    title="View on blockchain"
                  >
                    <ExternalLink size={12} />
                    <span className="hidden sm:inline">View TX</span>
                  </button>
                </div>

                {/* Additional details */}
                {(record.checkInAttempts > 1 || !record.verified) && (
                  <div className="mt-2 ml-11 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      {record.checkInAttempts > 1 && (
                        <span>Attempts: {record.checkInAttempts}</span>
                      )}
                      <span>Verified: {record.verified ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};