import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { testSupabaseConnection } from '../lib/supabase';

export const SupabaseConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        const connected = await testSupabaseConnection();
        setIsConnected(connected);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Database size={14} className="animate-pulse" />
        <span>Checking database connection...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 text-sm ${
        isConnected ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isConnected ? (
        <>
          <Wifi size={14} />
          <span>Database connected</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Database disconnected</span>
        </>
      )}
    </motion.div>
  );
};