import { useState, useEffect } from 'react';
import { walletService } from '../services/wallet';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    walletService.onConnect = (address: string) => {
      setAccount(address);
      setError(null);
      setIsConnecting(false);
    };

    walletService.onDisconnect = () => {
      setAccount(null);
      setError(null);
      setIsConnecting(false);
    };

    // Check if already connected
    const connectedAccount = walletService.getConnectedAccount();
    if (connectedAccount) {
      setAccount(connectedAccount);
    }

    // Cleanup function
    return () => {
      walletService.onConnect = undefined;
      walletService.onDisconnect = undefined;
    };
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await walletService.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await walletService.disconnect();
      // Clear all local state
      setAccount(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  return {
    account,
    isConnected: account !== null,
    isConnecting,
    error,
    connect,
    disconnect
  };
};