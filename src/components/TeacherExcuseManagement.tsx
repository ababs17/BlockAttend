import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  MessageSquare,
  ExternalLink,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ExcuseSubmission, AttendanceSession } from '../types';
import { useSupabaseAttendance } from '../hooks/useSupabaseAttendance';

interface TeacherExcuseManagementProps {
  excuses: ExcuseSubmission[];
  sessions: AttendanceSession[];
  getSessionExcuses: (sessionId: string) => ExcuseSubmission[];
}

export const TeacherExcuseManagement: React.FC<TeacherExcuseManagementProps> = ({
  excuses,
  sessions,
  getSessionExcuses
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [reviewingExcuse, setReviewingExcuse] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  
  const { reviewExcuse, isLoading, loadData } = useSupabaseAttendance();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

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

  const handleReview = async (excuseId: string, status: 'approved' | 'rejected') => {
    try {
      await reviewExcuse(excuseId, status, reviewNotes.trim() || undefined);
      // Reload data to get updated records
      await loadData();
      setReviewingExcuse(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to review excuse:', error);
    }
  };

  // Filter excuses
  const filteredExcuses = excuses.filter(excuse => {
    const statusMatch = selectedStatus === 'all' || excuse.approvalStatus === selectedStatus;
    const sessionMatch = selectedSession === 'all' || excuse.sessionId === selectedSession;
    return statusMatch && sessionMatch;
  });

  // Get counts for different statuses
  const pendingCount = excuses.filter(e => e.approvalStatus === 'pending').length;
  const approvedCount = excuses.filter(e => e.approvalStatus === 'approved').length;
  const rejectedCount = excuses.filter(e => e.approvalStatus === 'rejected').length;

  if (excuses.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">Excuse Management</h2>
        <div className="card p-8 text-center">
          <FileText size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-black mb-1">No excuse submissions</h3>
          <p className="text-gray-500 text-sm">Student excuse submissions will appear here for review</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-black" />
        <h2 className="text-xl font-semibold text-black">Excuse Management</h2>
        <span className="text-sm text-gray-500">({filteredExcuses.length} excuses)</span>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={16} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-600">PENDING</span>
          </div>
          <div className="text-2xl font-semibold text-orange-600">{pendingCount}</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-600">APPROVED</span>
          </div>
          <div className="text-2xl font-semibold text-green-600">{approvedCount}</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-600">REJECTED</span>
          </div>
          <div className="text-2xl font-semibold text-red-600">{rejectedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="input text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
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
            setSelectedStatus('all');
            setSelectedSession('all');
          }}
          className="btn-secondary text-sm"
        >
          Clear
        </button>
      </div>

      {/* Excuse List */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredExcuses.map((excuse, index) => {
            const session = getSessionInfo(excuse.sessionId);
            const isReviewing = reviewingExcuse === excuse.id;
            
            return (
              <motion.div
                key={excuse.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {getStatusIcon(excuse.approvalStatus)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-black">
                          {formatAddress(excuse.studentAddress)}
                        </span>
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
                        <span>
                          {session ? `${session.courseCode} - ${session.courseName}` : 'Unknown Session'}
                        </span>
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
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-black mb-2">Reason for Absence</h4>
                    <p className="text-sm text-gray-700">{excuse.reason}</p>
                  </div>
                </div>

                {/* Review Section */}
                {excuse.approvalStatus === 'pending' && (
                  <div className="mb-4">
                    {!isReviewing ? (
                      <button
                        onClick={() => setReviewingExcuse(excuse.id)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <MessageSquare size={14} />
                        Review Excuse
                      </button>
                    ) : (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-sm font-medium text-black mb-3">Review Excuse</h4>
                        
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Optional review notes..."
                          rows={3}
                          className="input w-full resize-none mb-3"
                        />
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(excuse.id, 'approved')}
                            disabled={isLoading}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-green-200"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => handleReview(excuse.id, 'rejected')}
                            disabled={isLoading}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-red-200"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                          
                          <button
                            onClick={() => {
                              setReviewingExcuse(null);
                              setReviewNotes('');
                            }}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Review */}
                {excuse.reviewTime && excuse.reviewedBy && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={12} className="text-gray-600" />
                      <span className="text-sm font-medium text-black">
                        Reviewed by {formatAddress(excuse.reviewedBy)}
                      </span>
                      <span className="text-xs text-gray-500">
                        on {format(excuse.reviewTime, 'MMM dd, yyyy at HH:mm')}
                      </span>
                    </div>
                    {excuse.reviewNotes && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="text-gray-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{excuse.reviewNotes}</p>
                      </div>
                    )}
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