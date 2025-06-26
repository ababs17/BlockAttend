import React, { useState } from 'react';
import { FileText, X, Clock, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { AttendanceSession } from '../types';
import { useSupabaseAttendance } from '../hooks/useSupabaseAttendance';

interface ExcuseSubmissionProps {
  session: AttendanceSession;
  onSuccess?: () => void;
}

export const ExcuseSubmission: React.FC<ExcuseSubmissionProps> = ({ session, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { submitExcuse, isLoading, error, loadData } = useSupabaseAttendance();

  const excuseDeadline = new Date(session.endTime.getTime() + (session.excuseDeadlineHours * 60 * 60 * 1000));
  const timeRemaining = excuseDeadline.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      return;
    }

    try {
      await submitExcuse(session.id, reason);
      // Reload data to show the new excuse
      await loadData();
      setReason('');
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to submit excuse:', err);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <FileText size={14} />
        Submit Excuse
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isLoading && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-black" />
                  <h2 className="text-lg font-medium text-black">Submit Excuse</h2>
                </div>
                <button
                  onClick={() => !isLoading && setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-black mb-2">
                    {session.courseCode} - {session.courseName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {format(session.startTime, 'MMM dd, yyyy at HH:mm')} - {format(session.endTime, 'HH:mm')}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={12} className="text-gray-500" />
                    <span className="text-gray-600">
                      Deadline: {format(excuseDeadline, 'MMM dd, yyyy at HH:mm')}
                    </span>
                  </div>
                  {hoursRemaining > 0 && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <AlertCircle size={12} className="text-orange-600" />
                      <span className="text-orange-600">
                        {hoursRemaining} hours remaining
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Reason for Absence *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    maxLength={500}
                    className="input w-full resize-none"
                    placeholder="Please provide a detailed explanation for your absence..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Be specific and honest. This becomes part of your permanent record.
                    </p>
                    <span className="text-xs text-gray-400">
                      {reason.length}/500
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-sm font-medium text-black mb-2">Veracity Requirements</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Must be submitted within {session.excuseDeadlineHours} hours after class ends
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Only the class checker can approve/reject
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Becomes part of permanent blockchain record
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                    className="btn-secondary flex-1 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !reason.trim()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send size={14} />
                        Submit Excuse
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};