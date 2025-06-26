import React from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, MapPin, BookOpen, Shield, AlertTriangle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AttendanceSession } from '../types';
import { ExcuseSubmission } from './ExcuseSubmission';
import { useAttendance } from '../hooks/useAttendance';
import { useWallet } from '../hooks/useWallet';

interface SessionCardProps {
  session: AttendanceSession;
  onJoin?: (sessionId: string) => void;
  isStudent?: boolean;
  hasAttended?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onJoin, 
  isStudent = false,
  hasAttended = false 
}) => {
  const { canSubmitExcuse } = useAttendance();
  const { account } = useWallet();
  
  const now = new Date();
  const isActive = session.isActive && now >= session.startTime && now <= session.endTime;
  const isPast = now > session.endTime;
  const checkInDeadline = new Date(session.startTime.getTime() + (session.checkInWindow * 60 * 1000));
  const canCheckIn = now >= session.startTime && now <= checkInDeadline;
  const canSubmitExcuseForSession = account ? canSubmitExcuse(session.id, account) : false;

  const openLocationInMaps = () => {
    const url = `https://www.google.com/maps?q=${session.location.latitude},${session.location.longitude}`;
    window.open(url, '_blank');
  };

  const getStatusColor = () => {
    if (isPast) return 'bg-gray-100 text-gray-600';
    if (canCheckIn) return 'bg-black text-white';
    if (isActive) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusText = () => {
    if (isPast) return 'Ended';
    if (canCheckIn) return 'Check-in Open';
    if (isActive) return 'Active';
    return 'Upcoming';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">{session.courseCode}</span>
            {session.verifiedChecker && (
              <Shield size={12} className="text-gray-600" title="Verified Checker" />
            )}
          </div>
          <h3 className="text-base font-medium text-black mb-1">
            {session.courseName}
          </h3>
          <p className="text-gray-600 text-sm">
            {session.description}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} />
            <span className="text-sm">
              {format(session.startTime, 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} />
            <span className="text-sm">
              {format(session.startTime, 'HH:mm')} - {format(session.endTime, 'HH:mm')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={14} />
          <span className="text-sm">
            {session.attendeeCount} attendees
          </span>
        </div>

        <div className="flex items-start gap-2 text-gray-600">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <button
              onClick={openLocationInMaps}
              className="text-sm text-left hover:text-black hover:underline transition-colors"
              title="Open in Google Maps"
            >
              {session.location.address || `${session.location.latitude.toFixed(4)}, ${session.location.longitude.toFixed(4)}`}
            </button>
          </div>
        </div>

        {/* Verification Requirements */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="flex items-center gap-2 text-xs font-medium text-black mb-2">
            <Shield size={10} />
            Verification Requirements
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={8} />
              <span>Within {session.allowedRadius}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={8} />
              <span>{session.checkInWindow}min window</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
            <FileText size={8} />
            <span>Excuse deadline: {session.excuseDeadlineHours}h after class</span>
          </div>
        </div>

        {isStudent && hasAttended && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={14} />
            <span className="text-sm font-medium">Attended</span>
          </div>
        )}

        {isStudent && canCheckIn && !hasAttended && (
          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 rounded-lg p-2 border border-orange-200">
            <AlertTriangle size={14} />
            <span className="text-sm">Check-in window closes at {format(checkInDeadline, 'HH:mm')}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded border border-gray-200">
        Declared: {format(session.declarationTime, 'MMM dd, yyyy at HH:mm')}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {isStudent && canCheckIn && !hasAttended && onJoin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onJoin(session.id)}
            className="btn-primary w-full"
          >
            Mark Attendance
          </motion.button>
        )}

        {isStudent && canSubmitExcuseForSession && (
          <ExcuseSubmission session={session} />
        )}

        {isStudent && !canCheckIn && !hasAttended && !canSubmitExcuseForSession && (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-2.5">
            <XCircle size={14} />
            <span className="text-sm">
              {isPast ? 'Session ended' : isActive ? 'Check-in window closed' : 'Check-in not open yet'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};