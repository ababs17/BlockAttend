import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Coins,
  RefreshCw
} from 'lucide-react';
import { algorandService } from '../services/algorand';
import { walletService } from '../services/wallet';

export const TestNetStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await algorandService.testConnection();
      setIsConnected(connected);
      
      const account = walletService.getConnectedAccount();
      if (account && connected) {
        try {
          const info = await algorandService.getAccountInfo(account);
          setAccountInfo(info);
        } catch (accountError) {
          console.warn('Failed to get account info:', accountError);
          setAccountInfo(null);
        }
      }
    } catch (err) {
      console.error('Connection check failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
      setAccountInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to prevent immediate execution issues
    const timer = setTimeout(() => {
      checkConnection();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const formatAlgoAmount = (microAlgos: number) => {
    if (typeof microAlgos !== 'number' || isNaN(microAlgos)) {
      return '0.000000';
    }
    return (microAlgos / 1000000).toFixed(6);
  };

  const openFaucet = () => {
    try {
      window.open('https://testnet.algoexplorer.io/dispenser', '_blank');
    } catch (err) {
      console.error('Failed to open faucet:', err);
    }
  };

  const openExplorer = () => {
    try {
      const account = walletService.getConnectedAccount();
      if (accountInfo && account) {
        window.open(`https://testnet.algoexplorer.io/address/${account}`, '_blank');
      }
    } catch (err) {
      console.error('Failed to open explorer:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isConnected === null ? (
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          ) : isConnected ? (
            <Wifi size={16} className="text-green-600" />
          ) : (
            <WifiOff size={16} className="text-red-600" />
          )}
          <span className="text-sm font-medium text-black">
            Algorand TestNet
          </span>
        </div>
        
        <button
          onClick={checkConnection}
          disabled={isLoading}
          className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Refresh connection"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 mb-3">
          <AlertTriangle size={14} />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {isConnected && accountInfo && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Balance:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-black">
                {formatAlgoAmount(accountInfo.amount || 0)} ALGO
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                TestNet Only
              </span>
              <Coins size={12} className="text-gray-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Min Balance:</span>
            <span className="text-sm text-gray-600">
              {formatAlgoAmount(accountInfo['min-balance'] || 0)} ALGO
            </span>
          </div>

          {(accountInfo.amount || 0) < 1000000 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Low Balance</span>
              </div>
              <p className="text-xs text-orange-600 mb-2">
                You need ALGO to create transactions. Get free TestNet ALGO from the faucet.
              </p>
              <button
                onClick={openFaucet}
                className="flex items-center gap-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors"
              >
                <ExternalLink size={10} />
                Get TestNet ALGO
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={openExplorer}
              className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors flex-1 justify-center"
            >
              <ExternalLink size={10} />
              View on Explorer
            </button>
          </div>
        </div>
      )}

      {isConnected === false && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
            <WifiOff size={16} />
            <span className="text-sm font-medium">Connection Failed</span>
          </div>
          <p className="text-xs text-gray-600">
            Unable to connect to Algorand TestNet
          </p>
        </div>
      )}

      {isConnected && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle size={10} className="text-green-600" />
            <span>Connected to TestNet</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};