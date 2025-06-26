import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Clock, 
  Download, 
  StopCircle,
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceSession, AttendanceRecord } from '../types';

interface LiveSessionMonitorProps {
  session: AttendanceSession;
  records: AttendanceRecord[];
  onExportCSV: () => void;
  currentTime: Date;
}

export const LiveSessionMonitor: React.FC<LiveSessionMonitorProps> = ({
  session,
  records,
  onExportCSV,
  currentTime
}) => {
  const [showStudentList, setShowStudentList] = useState(false);

  const timeRemaining = Math.max(0, session.endTime.getTime() - currentTime.getTime());
  const checkInDeadline = new Date(session.startTime.getTime() + (session.checkInWindow * 60 * 1000));
  const checkInTimeRemaining = Math.max(0, checkInDeadline.getTime() - currentTime.getTime());

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openLocationInMaps = () => {
    const url = `https://www.google.com/maps?q=${session.location.latitude},${session.location.longitude}`;
    window.open(url, '_blank');
  };

  const getStatusCounts = () => {
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = present + late;
    return { present, late, total };
  };

  const statusCounts = getStatusCounts();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 border-2 border-green-200 bg-green-50"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-600">LIVE SESSION</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-black mb-1">
            {session.courseCode} - {session.courseName}
          </h3>
          <p className="text-gray-600 text-sm">
            {session.description}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Session Timer */}
          <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-green-600" />
              <span className="text-xs font-medium text-green-600">SESSION ENDS IN</span>
            </div>
            <div className="text-lg font-mono font-bold text-black">
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
          
          {/* Check-in Timer */}
          {checkInTimeRemaining > 0 && (
            <div className="bg-white rounded-lg p-3 border border-orange-200 text-center">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-600">CHECK-IN CLOSES</span>
              </div>
              <div className="text-lg font-mono font-bold text-black">
                {formatTimeRemaining(checkInTimeRemaining)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-600">TOTAL</span>
          </div>
          <div className="text-xl font-semibold text-blue-600">
            {statusCounts.total}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-xs font-medium text-green-600">PRESENT</span>
          </div>
          <div className="text-xl font-semibold text-green-600">
            {statusCounts.present}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-orange-600" />
            <span className="text-xs font-medium text-orange-600">LATE</span>
          </div>
          <div className="text-xl font-semibold text-orange-600">
            {statusCounts.late}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-600">RATE</span>
          </div>
          <div className="text-xl font-semibold text-purple-600">
            {session.attendeeCount > 0 ? Math.round((statusCounts.total / session.attendeeCount) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Start Time:</span>
            <div className="font-medium text-black">{format(session.startTime, 'HH:mm')}</div>
          </div>
          <div>
            <span className="text-gray-600">End Time:</span>
            <div className="font-medium text-black">{format(session.endTime, 'HH:mm')}</div>
          </div>
          <div>
            <span className="text-gray-600">Check-in Window:</span>
            <div className="font-medium text-black">{session.checkInWindow} minutes</div>
          </div>
          <div>
            <span className="text-gray-600">Allowed Radius:</span>
            <div className="font-medium text-black">{session.allowedRadius}m</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={openLocationInMaps}
            className="flex items-center gap-2 text-sm text-black hover:text-gray-600 hover:underline"
          >
            <MapPin size={12} />
            <span>{session.location.address || 'View GPS Location'}</span>
          </button>
        </div>
      </div>

      {/* Student List Toggle */}
      {records.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowStudentList(!showStudentList)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            {showStudentList ? 'Hide' : 'Show'} Student List ({records.length})
          </button>
          
          {showStudentList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    className={`p-3 flex items-center justify-between ${
                      index !== records.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <span className="font-medium text-black text-sm">
                        {formatAddress(record.studentAddress)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{format(record.timestamp, 'HH:mm')}</span>
                      <span>{record.distanceFromClass}m</span>
                      <span className={`px-2 py-1 rounded-full font-medium ${
                        record.status === 'present' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onExportCSV}
          className="btn-secondary flex items-center gap-2 flex-1"
        >
          <Download size={16} />
          Export CSV
        </button>
        
        <button
          className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
          title="Close attendance window manually"
        >
          <StopCircle size={16} />
          Close Session
        </button>
      </div>
    </motion.div>
  );
};