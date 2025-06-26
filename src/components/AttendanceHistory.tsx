import React from 'react';
import { History, ExternalLink, CheckCircle, Clock, MapPin, AlertTriangle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AttendanceRecord } from '../types';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openTransaction = (txId: string) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };

  const getStatusIcon = (record: AttendanceRecord) => {
    if (record.status === 'present') {
      return <CheckCircle size={14} className="text-green-600" />;
    } else if (record.status === 'late') {
      return <AlertTriangle size={14} className="text-orange-600" />;
    }
    return <Clock size={14} className="text-gray-600" />;
  };

  const getStatusColor = (record: AttendanceRecord) => {
    if (record.status === 'present') {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (record.status === 'late') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusText = (record: AttendanceRecord) => {
    return record.status.charAt(0).toUpperCase() + record.status.slice(1);
  };

  if (records.length === 0) {
    return (
      <div className="card p-12 text-center">
        <History size={40} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-base font-medium text-black mb-2">No attendance records yet</h3>
        <p className="text-gray-500 text-sm">Records will appear here once students mark attendance</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-base font-medium text-black flex items-center gap-2">
          <History size={18} />
          Attendance History
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {records.map((record, index) => (
          <motion.div
            key={`${record.transactionId}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  record.verified ? 'bg-gray-100' : 'bg-gray-50'
                }`}>
                  {getStatusIcon(record)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-black">
                      {formatAddress(record.studentAddress)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record)}`}>
                      {getStatusText(record)}
                    </span>
                    {record.locationVerified && (
                      <Shield size={10} className="text-gray-600" title="Location Verified" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{format(record.timestamp, 'MMM dd, yyyy at HH:mm')}</span>
                    {record.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={8} />
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
                View TX
              </button>
            </div>

            {/* Additional verification details */}
            <div className="mt-2 ml-11 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Attempts: {record.checkInAttempts}</span>
                <span>Verified: {record.verified ? 'Yes' : 'No'}</span>
                <span>Location Match: {record.locationVerified ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};