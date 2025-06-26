import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ExcuseSubmission, AttendanceSession } from '../types';
import { ExcuseSubmission as ExcuseSubmissionModal } from './ExcuseSubmission';
import { useAttendance } from '../hooks/useAttendance';

interface StudentExcuseSubmissionProps {
  excuses: ExcuseSubmission[];
  sessions: AttendanceSession[];
  account: string;
}

export const StudentExcuseSubmission: React.FC<StudentExcuseSubmissionProps> = ({
  excuses,
  sessions,
  account
}) => {
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const { canSubmitExcuse } = useAttendance();

  // Get sessions where student can submit excuses
  const availableForExcuse = sessions.filter(session => 
    canSubmitExcuse(session.id, account)
  );

  const getStatusIcon = (status: ExcuseSubmission['approvalStatus']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={14} className="text-red-600" />;
      default:
        return <Clock size={14} className="text-orange-600" />;
    }
  };

  const getStatusColor = (status: ExcuseSubmission['approvalStatus']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  const getStatusText = (status: ExcuseSubmission['approvalStatus']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSessionInfo = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Submit New Excuse */}
      {availableForExcuse.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-black" />
              <h2 className="text-xl font-semibold text-black">Submit Excuse</h2>
            </div>
          </div>
          
          <div className="card p-4">
            <p className="text-gray-600 text-sm mb-4">
              You can submit excuses for missed classes within the deadline period.
            </p>
            
            <div className="space-y-3">
              {availableForExcuse.map((session) => {
                const excuseDeadline = new Date(session.endTime.getTime() + (session.excuseDeadlineHours * 60 * 60 * 1000));
                const hoursRemaining = Math.floor((excuseDeadline.getTime() - Date.now()) / (1000 * 60 * 60));
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <h3 className="font-medium text-black">
                        {session.courseCode} - {session.courseName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{format(session.startTime, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-orange-600" />
                          <span className="text-orange-600">{hoursRemaining}h remaining</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Submit Excuse
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Excuse History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-black" />
          <h2 className="text-xl font-semibold text-black">My Excuses</h2>
          {excuses.length > 0 && (
            <span className="text-sm text-gray-500">({excuses.length} submitted)</span>
          )}
        </div>
        
        {excuses.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-black mb-1">No excuses submitted</h3>
            <p className="text-gray-500 text-sm">Your excuse submissions will appear here</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {excuses.map((excuse, index) => {
                const session = getSessionInfo(excuse.sessionId);
                
                return (
                  <motion.div
                    key={excuse.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                          {getStatusIcon(excuse.approvalStatus)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-black">
                              {session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session'}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(excuse.approvalStatus)}`}>
                              {getStatusText(excuse.approvalStatus)}
                            </span>
                            {!excuse.isWithinDeadline && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Late Submission
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Submitted: {format(excuse.submissionTime, 'MMM dd, yyyy at HH:mm')}</span>
                            {session && (
                              <span>Class: {format(session.startTime, 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => openTransaction(excuse.transactionId)}
                        className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        title="View on blockchain"
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">View TX</span>
                      </button>
                    </div>

                    {/* Excuse Reason */}
                    <div className="ml-11 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <h4 className="text-sm font-medium text-black mb-2">Reason for Absence</h4>
                        <p className="text-sm text-gray-700">{excuse.reason}</p>
                      </div>
                    </div>

                    {/* Review Information */}
                    {excuse.reviewTime && excuse.reviewedBy && (
                      <div className="ml-11">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-black">
                              Reviewed on {format(excuse.reviewTime, 'MMM dd, yyyy at HH:mm')}
                            </span>
                          </div>
                          {excuse.reviewNotes && (
                            <p className="text-sm text-gray-700">{excuse.reviewNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Excuse Submission Modal */}
      {selectedSession && (
        <ExcuseSubmissionModal
          session={selectedSession}
          onSuccess={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};