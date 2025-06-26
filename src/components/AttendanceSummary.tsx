import React from 'react';
import { BarChart3, TrendingUp, Calendar, Users, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { CourseAttendanceSummary } from '../types';
import { ExamEligibilityCard } from './ExamEligibilityCard';

interface AttendanceSummaryProps {
  courseSummaries: CourseAttendanceSummary[];
  isStudent?: boolean;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ 
  courseSummaries, 
  isStudent = false 
}) => {
  if (courseSummaries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <BarChart3 size={40} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-base font-medium text-black mb-2">
          {isStudent ? 'No attendance records yet' : 'No course data available'}
        </h3>
        <p className="text-gray-500 text-sm">
          {isStudent 
            ? 'Your attendance summary will appear here once you start attending classes'
            : 'Course attendance summaries will appear here once students start attending'
          }
        </p>
      </div>
    );
  }

  const overallStats = courseSummaries.reduce((acc, course) => ({
    totalSessions: acc.totalSessions + course.totalSessions,
    attendedSessions: acc.attendedSessions + course.attendedSessions,
    excusedSessions: acc.excusedSessions + course.excusedSessions,
    eligibleCourses: acc.eligibleCourses + (course.examEligibility.isEligible ? 1 : 0)
  }), { totalSessions: 0, attendedSessions: 0, excusedSessions: 0, eligibleCourses: 0 });

  const overallPercentage = overallStats.totalSessions > 0 
    ? ((overallStats.attendedSessions + overallStats.excusedSessions) / overallStats.totalSessions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      {isStudent && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-black" />
            <h3 className="text-base font-medium text-black">Overall Attendance Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <Calendar size={20} className="text-gray-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-black">{overallStats.totalSessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <Users size={20} className="text-green-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-green-600">{overallStats.attendedSessions}</div>
              <div className="text-sm text-green-600">Attended</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <TrendingUp size={20} className="text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-blue-600">{overallPercentage.toFixed(1)}%</div>
              <div className="text-sm text-blue-600">Overall Rate</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
              <GraduationCap size={20} className="text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-semibold text-purple-600">
                {overallStats.eligibleCourses}/{courseSummaries.length}
              </div>
              <div className="text-sm text-purple-600">Exam Eligible</div>
            </div>
          </div>
        </div>
      )}

      {/* Course-wise Exam Eligibility */}
      <div>
        <h3 className="text-base font-medium text-black mb-4 flex items-center gap-2">
          <GraduationCap size={18} />
          {isStudent ? 'Your Exam Eligibility Status' : 'Course Attendance Overview'}
        </h3>
        
        <div className="grid gap-4">
          {courseSummaries.map((course, index) => (
            <motion.div
              key={course.courseCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ExamEligibilityCard 
                courseSummary={course} 
                isStudent={isStudent}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Veracity Assurance Footer */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
          <span className="font-medium">Blockchain-Verified Attendance Data</span>
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          All calculations are based on immutable, GPS-verified attendance records stored on the Algorand blockchain
        </p>
      </div>
    </div>
  );
};