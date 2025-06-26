import React from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useUserProfile } from '../hooks/useUserProfile';

export const WalletConnect: React.FC = () => {
  const { account, isConnected, isConnecting, error, connect, disconnect } = useWallet();
  const { resetAll } = useUserProfile();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      // Reset all user profile data first
      resetAll();
      
      // Disconnect wallet
      await disconnect();
      
      // Clear any localStorage data
      localStorage.clear();
      
      // Force page reload to ensure complete reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Force reload even if disconnect fails
      window.location.reload();
    }
  };

  if (isConnected && account) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-black">
            {formatAddress(account)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
          title="Disconnect wallet"
        >
          <LogOut size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary flex items-center gap-3 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet size={18} />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </motion.button>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200"
        >
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
};