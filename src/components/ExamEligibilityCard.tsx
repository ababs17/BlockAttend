import React from 'react';
import { GraduationCap, CheckCircle, XCircle, AlertTriangle, TrendingUp, Calendar, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExamEligibility, CourseAttendanceSummary } from '../types';

interface ExamEligibilityCardProps {
  courseSummary: CourseAttendanceSummary;
  isStudent?: boolean;
}

export const ExamEligibilityCard: React.FC<ExamEligibilityCardProps> = ({ 
  courseSummary, 
  isStudent = false 
}) => {
  const { examEligibility } = courseSummary;

  const getStatusIcon = () => {
    switch (examEligibility.status) {
      case 'eligible':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'at-risk':
        return <AlertTriangle size={18} className="text-orange-600" />;
      case 'not-eligible':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return <GraduationCap size={18} className="text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (examEligibility.status) {
      case 'eligible':
        return 'bg-green-50 border-green-200';
      case 'at-risk':
        return 'bg-orange-50 border-orange-200';
      case 'not-eligible':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (examEligibility.status) {
      case 'eligible':
        return 'Exam Eligible';
      case 'at-risk':
        return 'At Risk';
      case 'not-eligible':
        return 'Not Eligible';
      default:
        return 'Unknown';
    }
  };

  const getProgressBarColor = () => {
    if (examEligibility.attendancePercentage >= examEligibility.requiredPercentage) {
      return 'bg-green-500';
    } else if (examEligibility.attendancePercentage >= examEligibility.requiredPercentage * 0.8) {
      return 'bg-orange-500';
    } else {
      return 'bg-red-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 border-2 ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-base font-medium text-black">
              {courseSummary.courseCode} - {courseSummary.courseName}
            </h3>
            <p className="text-sm text-gray-600">
              {getStatusText()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold text-black">
            {examEligibility.attendancePercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            Required: {examEligibility.requiredPercentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-black">Attendance Progress</span>
          <span className="text-sm text-gray-600">
            {courseSummary.attendedSessions + courseSummary.excusedSessions} / {courseSummary.totalSessions}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(examEligibility.attendancePercentage, 100)}%` }}
          />
          {/* Required threshold indicator */}
          <div
            className="absolute h-2 w-0.5 bg-black -mt-2"
            style={{ marginLeft: `${examEligibility.requiredPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>0%</span>
          <span className="relative">
            {examEligibility.requiredPercentage}% Required
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-black"></div>
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Attendance Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={12} className="text-green-600" />
            <span className="text-sm font-medium text-black">Present</span>
          </div>
          <div className="text-lg font-semibold text-green-600">
            {courseSummary.attendedSessions}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={12} className="text-blue-600" />
            <span className="text-sm font-medium text-black">Excused</span>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {courseSummary.excusedSessions}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        {examEligibility.status === 'eligible' && (
          <div className="flex items-center gap-2 text-green-700">
            <Target size={14} />
            <span className="text-sm font-medium">
              You meet the attendance requirement and are eligible for exams!
            </span>
          </div>
        )}
        
        {examEligibility.status === 'at-risk' && examEligibility.sessionsNeeded && (
          <div className="flex items-center gap-2 text-orange-700">
            <TrendingUp size={14} />
            <span className="text-sm font-medium">
              You need to attend {examEligibility.sessionsNeeded} more session{examEligibility.sessionsNeeded > 1 ? 's' : ''} to become eligible.
            </span>
          </div>
        )}
        
        {examEligibility.status === 'not-eligible' && (
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={14} />
            <span className="text-sm font-medium">
              {examEligibility.sessionsNeeded 
                ? `You need ${examEligibility.sessionsNeeded} more sessions, but this may not be possible with remaining classes.`
                : 'Attendance requirement not met for exam eligibility.'
              }
            </span>
          </div>
        )}
      </div>

      {/* Veracity Assurance */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
          <span>Calculated from immutable blockchain attendance records</span>
        </div>
      </div>
    </motion.div>
  );
};