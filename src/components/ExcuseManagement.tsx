import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, User, MessageSquare, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ExcuseSubmission } from '../types';
import { useAttendance } from '../hooks/useAttendance';

interface ExcuseManagementProps {
  excuses: ExcuseSubmission[];
  isTeacher?: boolean;
}

export const ExcuseManagement: React.FC<ExcuseManagementProps> = ({ excuses, isTeacher = false }) => {
  const { reviewExcuse, isLoading } = useAttendance();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

  const handleReview = async (excuseId: string, status: 'approved' | 'rejected') => {
    try {
      await reviewExcuse(excuseId, status);
    } catch (error) {
      console.error('Failed to review excuse:', error);
      alert(error instanceof Error ? error.message : 'Failed to review excuse');
    }
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

  if (excuses.length === 0) {
    return (
      <div className="card p-12 text-center">
        <FileText size={40} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-base font-medium text-black mb-2">
          {isTeacher ? 'No excuse submissions' : 'No excuses submitted'}
        </h3>
        <p className="text-gray-500 text-sm">
          {isTeacher 
            ? 'Student excuse submissions will appear here for review'
            : 'Your excuse submissions will appear here'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-base font-medium text-black flex items-center gap-2">
          <FileText size={18} />
          {isTeacher ? 'Excuse Submissions' : 'My Excuses'}
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {excuses.map((excuse, index) => (
          <motion.div
            key={excuse.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  excuse.approvalStatus === 'approved' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {getStatusIcon(excuse.approvalStatus)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isTeacher && (
                      <span className="font-medium text-black">
                        {formatAddress(excuse.studentAddress)}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(excuse.approvalStatus)}`}>
                      {getStatusText(excuse.approvalStatus)}
                    </span>
                    {!excuse.isWithinDeadline && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        Late Submission
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Submitted: {format(excuse.submissionTime, 'MMM dd, yyyy at HH:mm')}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => openTransaction(excuse.transactionId)}
                className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                title="View on blockchain"
              >
                <ExternalLink size={12} />
                View TX
              </button>
            </div>

            <div className="ml-11 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium text-black mb-2">Reason for Absence</h4>
                <p className="text-sm text-gray-700">{excuse.reason}</p>
              </div>

              {excuse.reviewTime && excuse.reviewedBy && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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

              {isTeacher && excuse.approvalStatus === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(excuse.id, 'approved')}
                    disabled={isLoading}
                    className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-green-200"
                  >
                    <CheckCircle size={12} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(excuse.id, 'rejected')}
                    disabled={isLoading}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border border-red-200"
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};